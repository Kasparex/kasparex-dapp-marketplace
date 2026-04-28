'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import {
  createInitialMinecoreState,
  hydrateMinecoreState,
  applyMinecoreEvent,
  deriveState,
  computeLiveDiamonds,
  type MinecoreState,
  type MinecoreBatteryId,
  type PlantSlotState,
} from '@/lib/game/minecore';
import { fetchNFTMetadata, type ParsedNFTMetadata } from '@/lib/nft/metadata';
import { MINECORE_PLANT_RECHARGE_COST_KAS, MINECORE_DEFAULT_SLOT_UNLOCK_COST_KAS, MINECORE_STORAGE_PREFIX } from '@/lib/game/minecore/config';
import { payKaspaL1, recordL1Reward, verifyKaspaL1Payment } from '@/lib/games/sdk';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { KREX_TIER_SHOP_DISCOUNT_PCT } from '@/lib/game/diamond-veins-config';
import type { MiningSlotType } from '@/lib/game/engine';
import { explainPlantSetupBlock, nextPlantSetupAfterInstallPart } from '@/lib/game/minecore/asset-usage';
import { enforcePlantInventoryInvariants } from '@/lib/game/minecore/inventory-invariants';

const DEFAULT_TREASURY = process.env.NEXT_PUBLIC_GAME_TREASURY_ADDRESS || '';

/** Persisted game state is keyed only by Kaspa L1 address — no shared guest bucket. */
function walletStorageKey(address: string) {
  return `${MINECORE_STORAGE_PREFIX}:${address.trim()}`;
}

function loadPersistedMinecore(key: string): MinecoreState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return hydrateMinecoreState(JSON.parse(raw));
  } catch {
    return null;
  }
}

function savePersistedMinecore(key: string, state: MinecoreState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function useMinecore() {
  const { state: walletState } = useKaspaWallet();
  const { tier: krexTier } = useKREXBalance();

  const walletAddr = walletState.address?.trim() ?? '';

  const [mc, setMc] = useState<MinecoreState>(() => createInitialMinecoreState());
  const mcRef = useRef(mc);
  mcRef.current = mc;

  const [profileNotice, setProfileNotice] = useState<string | null>(null);
  const prevWalletRef = useRef<string>('');
  /** Avoid reloading the same wallet from localStorage on Strict Mode remounts / redundant effect runs. */
  const hydratedWalletAddrRef = useRef<string | null>(null);

  useEffect(() => {
    if (!walletAddr) {
      setProfileNotice(null);
      prevWalletRef.current = '';
      hydratedWalletAddrRef.current = null;
      return;
    }
    if (hydratedWalletAddrRef.current === walletAddr) {
      return;
    }
    hydratedWalletAddrRef.current = walletAddr;
    const loaded = loadPersistedMinecore(walletStorageKey(walletAddr));
    setMc(loaded ?? createInitialMinecoreState());
    if (prevWalletRef.current !== walletAddr) {
      const short = `${walletAddr.slice(0, 12)}…${walletAddr.slice(-10)}`;
      setProfileNotice(`Loaded Minecore profile for ${short}`);
      prevWalletRef.current = walletAddr;
      const t = window.setTimeout(() => setProfileNotice(null), 6_000);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [walletAddr]);

  /** Clamp rigs/workers/batteries/modules vs owned inventory (fixes corrupt saves + unlocks stuck InstallPart guards). */
  useEffect(() => {
    if (!walletAddr) return;
    setMc((prev) => enforcePlantInventoryInvariants(prev));
  }, [walletAddr]);

  useEffect(() => {
    if (!walletAddr) return;
    savePersistedMinecore(walletStorageKey(walletAddr), mc);
  }, [walletAddr, mc]);

  useEffect(() => {
    if (walletState.isConnected && walletState.address) {
      setMc((s) =>
        applyMinecoreEvent(s, {
          type: 'ConnectWallet',
          address: walletState.address!,
          at: Date.now(),
        })
      );
    }
  }, [walletState.isConnected, walletState.address]);

  /** Mining and mutations require a connected L1 wallet; state stays wallet-scoped in storage. */
  const miningAllowed = Boolean(walletState.isConnected && walletAddr);

  // Derive statuses from timestamps (progress + completed state) without mutating persisted state each second.
  const nowTick = useNowTick(1000);
  const derived = useMemo(() => deriveState(mc, nowTick), [mc, nowTick]);

  const [lastPaymentError, setLastPaymentError] = useState<string | null>(null);
  const [lastSetupError, setLastSetupError] = useState<string | null>(null);

  /** Applies Minecore events; InstallPart is validated first so inventory rejects never bump version silently. */
  const dispatch = useCallback((ev: Parameters<typeof applyMinecoreEvent>[1]) => {
    setMc((s) => {
      if (ev.type !== 'InstallPart') return applyMinecoreEvent(s, ev);

      const slot = s.plantSlots[ev.slotIndex];
      if (!slot || !slot.unlocked) {
        queueMicrotask(() => setLastSetupError('Plant is locked or unavailable.'));
        return s;
      }
      const nextSetup = nextPlantSetupAfterInstallPart(slot, ev.part);
      const msg = explainPlantSetupBlock(s, ev.slotIndex, nextSetup);
      if (msg) {
        queueMicrotask(() => setLastSetupError(msg));
        return s;
      }
      queueMicrotask(() => setLastSetupError(null));
      return applyMinecoreEvent(s, ev);
    });
  }, []);

  /**
   * Foreman only: auto-spend an Energy Cell to refill a dead battery. No automatic chain mining or extract (V1).
   */
  useEffect(() => {
    if (!walletState.isConnected || !walletAddr) return;
    if (!mc.automation.foremanActive) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const s = mcRef.current;
      const d = deriveState(s, now);

      for (let slotIdx = 0; slotIdx < s.plantSlots.length; slotIdx++) {
        const slot = s.plantSlots[slotIdx];
        if (!slot?.unlocked) continue;
        const status = d.plantSlots[slotIdx]?.status;
        if (!status) continue;

        if (status === 'BatteryEmpty' && s.ingredients.energyCells > 0) {
          dispatch({ type: 'AddIngredients', ingredient: 'energyCells', amount: -1, at: now });
          dispatch({ type: 'RefillBattery', slotIndex: slotIdx, at: now });
          break;
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [walletState.isConnected, walletAddr, mc.automation.foremanActive, dispatch]);

  /**
   * When a run ends (cycle complete or battery empty), bank mined diamonds to the wallet immediately — no separate Extract step.
   */
  const autoBankPrevStatusRef = useRef<Record<number, string>>({});
  useEffect(() => {
    if (!walletState.isConnected || !walletAddr) return;
    const now = nowTick;
    for (let slotIdx = 0; slotIdx < derived.plantSlots.length; slotIdx++) {
      const slot = derived.plantSlots[slotIdx];
      if (!slot?.unlocked) continue;
      const st = slot.status;
      const prev = autoBankPrevStatusRef.current[slotIdx];
      const justEntered = prev === undefined || prev !== st;
      const canBank =
        slot.diamondsAccumulated > 0 ||
        (slot.cycle != null && computeLiveDiamonds(slot, now) > 0);
      if (justEntered && (st === 'ExtractionReady' || st === 'BatteryEmpty') && canBank) {
        dispatch({ type: 'Extract', slotIndex: slotIdx, at: now });
      }
      autoBankPrevStatusRef.current[slotIdx] = st;
    }
  }, [walletState.isConnected, walletAddr, derived.plantSlots, nowTick, dispatch]);

  const [slottedMetadata, setSlottedMetadata] = useState<Record<number, ParsedNFTMetadata>>({});

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      for (const slot of derived.nftSlots ?? []) {
        if (slot.nftId == null || !slot.collection) continue;
        try {
          const meta = await fetchNFTMetadata(slot.collection, slot.nftId);
          if (!cancelled && meta) {
            setSlottedMetadata((prev) => (prev[slot.nftId!] ? prev : { ...prev, [slot.nftId!]: meta }));
          }
        } catch {
          // ignore
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [derived.nftSlots]);

  const payKasBestEffort = useCallback(
    async (params: { amountKas: number; skuId: string; purchaseType: 'slot' | 'unlock' | 'other' }) => {
      setLastPaymentError(null);
      if (!walletState.isConnected || !walletState.provider || !walletState.address) {
        setLastPaymentError('Wallet connection required');
        return { ok: false as const };
      }
      if (!DEFAULT_TREASURY) {
        setLastPaymentError('Treasury address not configured');
        return { ok: false as const };
      }

      const pay = await payKaspaL1({
        provider: walletState.provider,
        fromKaspaAddress: walletState.address,
        toKaspaAddress: DEFAULT_TREASURY,
        amountKas: params.amountKas,
        gameId: 'minecore',
        skuId: params.skuId,
        purchaseType: params.purchaseType,
      });
      if (!pay.ok) {
        setLastPaymentError(pay.error);
        return { ok: false as const };
      }

      void recordL1Reward({
        userAddress: walletState.address,
        dappId: 'minecore',
        actionType: params.purchaseType,
        actionValue: params.amountKas,
        txHash: pay.txHash,
        network: 'L1',
      }).catch(() => {});

      void verifyKaspaL1Payment({
        txHash: pay.txHash,
        payerKaspaAddress: walletState.address,
        toKaspaAddress: DEFAULT_TREASURY,
        minAmountKas: params.amountKas,
        gameId: 'minecore',
        skuId: params.skuId,
        purchaseType: params.purchaseType,
        sessionId: pay.sessionId,
      }).catch(() => {});

      return { ok: true as const, txHash: pay.txHash };
    },
    [walletState.isConnected, walletState.provider, walletState.address]
  );

  const getKasPriceAfterDiscount = useCallback(
    (unitPriceKas: number) => {
      const discountPct = KREX_TIER_SHOP_DISCOUNT_PCT[krexTier as any] ?? 0;
      const discounted = unitPriceKas * (1 - discountPct / 100);
      return Math.max(0, Math.round(discounted * 10_000) / 10_000);
    },
    [krexTier]
  );

  const unlockSlot = useCallback(
    async (slotIndex: number, amountKas: number) => {
      const paid = await payKasBestEffort({ amountKas: getKasPriceAfterDiscount(amountKas), skuId: 'minecore:slot:unlock', purchaseType: 'slot' });
      if (!paid.ok) return false;
      dispatch({ type: 'UnlockSlot', slotIndex, at: Date.now() });
      return true;
    },
    [dispatch, payKasBestEffort, getKasPriceAfterDiscount]
  );

  const addSlot = useCallback(
    async (amountKas: number) => {
      const paid = await payKasBestEffort({ amountKas: getKasPriceAfterDiscount(amountKas), skuId: 'minecore:slot:expand', purchaseType: 'slot' });
      if (!paid.ok) return false;
      dispatch({ type: 'AddSlot', at: Date.now() });
      return true;
    },
    [dispatch, payKasBestEffort, getKasPriceAfterDiscount]
  );

  const purchaseNftDeckSlot = useCallback(
    async (slotType: MiningSlotType) => {
      const paid = await payKasBestEffort({
        amountKas: getKasPriceAfterDiscount(MINECORE_DEFAULT_SLOT_UNLOCK_COST_KAS),
        skuId: `minecore:nft-slot:add:${slotType}`,
        purchaseType: 'slot',
      });
      if (!paid.ok) return false;
      dispatch({ type: 'AddNftDeckSlot', at: Date.now(), slotType });
      return true;
    },
    [dispatch, payKasBestEffort, getKasPriceAfterDiscount]
  );

  const installMachine = useCallback((slotIndex: number, id: PlantSlotState['setup']['machineId']) => {
    dispatch({ type: 'InstallPart', slotIndex, at: Date.now(), part: { kind: 'machine', id: id as any } });
  }, [dispatch]);

  const installBattery = useCallback(
    (slotIndex: number, id: MinecoreBatteryId | null, batterySlotIndex = 0) => {
      dispatch({
        type: 'InstallPart',
        slotIndex,
        at: Date.now(),
        part: { kind: 'battery', id, batterySlotIndex },
      });
    },
    [dispatch]
  );

  const assignPlantWorkerNftDeck = useCallback((slotIndex: number, deckSlotIndex: number | null) => {
    dispatch({
      type: 'InstallPart',
      slotIndex,
      at: Date.now(),
      part: { kind: 'crewWorkerNftDeck', deckSlotIndex },
    });
  }, [dispatch]);

  const setModules = useCallback((slotIndex: number, ids: PlantSlotState['setup']['moduleIds']) => {
    dispatch({ type: 'InstallPart', slotIndex, at: Date.now(), part: { kind: 'modules', ids: ids as any } });
  }, [dispatch]);

  const setBoost = useCallback((slotIndex: number, id: PlantSlotState['setup']['boostId']) => {
    dispatch({ type: 'InstallPart', slotIndex, at: Date.now(), part: { kind: 'boost', id: id as any } });
  }, [dispatch]);

  const startMining = useCallback((slotIndex: number) => {
    dispatch({ type: 'StartMining', slotIndex, at: Date.now() });
  }, [dispatch]);

  const stopMining = useCallback((slotIndex: number) => {
    dispatch({ type: 'StopMining', slotIndex, at: Date.now() });
  }, [dispatch]);

  const resumeMining = useCallback((slotIndex: number) => {
    dispatch({ type: 'ResumeMining', slotIndex, at: Date.now() });
  }, [dispatch]);

  const extract = useCallback((slotIndex: number) => {
    dispatch({ type: 'Extract', slotIndex, at: Date.now() });
  }, [dispatch]);

  const topUpPower = useCallback((slotIndex: number, added: number) => {
    dispatch({ type: 'TopUpPower', slotIndex, at: Date.now(), added });
  }, [dispatch]);

  const topUpPowerWithKAS = useCallback(
    async (slotIndex: number, opts: { added: number; amountKas: number }) => {
      const paid = await payKasBestEffort({ amountKas: getKasPriceAfterDiscount(opts.amountKas), skuId: 'minecore:power:topup', purchaseType: 'other' });
      if (!paid.ok) return false;
      dispatch({ type: 'TopUpPower', slotIndex, at: Date.now(), added: opts.added });
      return true;
    },
    [dispatch, payKasBestEffort, getKasPriceAfterDiscount]
  );

  const repair = useCallback((slotIndex: number) => {
    dispatch({ type: 'Repair', slotIndex, at: Date.now() });
  }, [dispatch]);

  const repairWithKAS = useCallback(
    async (slotIndex: number, amountKas: number) => {
      const paid = await payKasBestEffort({ amountKas: getKasPriceAfterDiscount(amountKas), skuId: 'minecore:repair', purchaseType: 'other' });
      if (!paid.ok) return false;
      dispatch({ type: 'Repair', slotIndex, at: Date.now() });
      return true;
    },
    [dispatch, payKasBestEffort, getKasPriceAfterDiscount]
  );

  const refine = useCallback(
    (amount: number) => {
      if (!walletAddr) return;
      dispatch({ type: 'Refine', at: Date.now(), amount, walletAddress: walletAddr });
    },
    [dispatch, walletAddr],
  );

  const refillBattery = useCallback((slotIndex: number) => {
    dispatch({ type: 'RefillBattery', slotIndex, at: Date.now() });
  }, [dispatch]);

  const refillBatteryWithKAS = useCallback(
    async (slotIndex: number, amountKas: number) => {
      const paid = await payKasBestEffort({
        amountKas: getKasPriceAfterDiscount(amountKas),
        skuId: 'minecore:battery:refill',
        purchaseType: 'other',
      });
      if (!paid.ok) return false;
      dispatch({ type: 'RefillBattery', slotIndex, at: Date.now() });
      return true;
    },
    [dispatch, payKasBestEffort, getKasPriceAfterDiscount]
  );

  /** One KAS purchase: add reserve unit(s) and full battery for that plant. */
  const rechargePlantWithKAS = useCallback(
    async (slotIndex: number, opts?: { units?: number }) => {
      const units = Math.max(1, Math.floor(opts?.units ?? 1));
      const paid = await payKasBestEffort({
        amountKas: getKasPriceAfterDiscount(MINECORE_PLANT_RECHARGE_COST_KAS * units),
        skuId: 'minecore:plant:recharge',
        purchaseType: 'other',
      });
      if (!paid.ok) return false;
      dispatch({ type: 'RechargePlant', slotIndex, at: Date.now(), units });
      return true;
    },
    [dispatch, payKasBestEffort, getKasPriceAfterDiscount]
  );

  const redeemGrid = useCallback(
    (points: number, token: 'GRID' | 'KREX' = 'GRID') => {
      if (!walletAddr) return;
      const at = Date.now();
      dispatch({ type: 'RedeemGrid', at, points, token: token ?? 'GRID', walletAddress: walletAddr });
    },
    [dispatch, walletAddr],
  );

  const changePlantType = useCallback(
    async (slotIndex: number, plantType: any, costKas: number) => {
      if (costKas > 0) {
        const paid = await payKasBestEffort({
          amountKas: getKasPriceAfterDiscount(costKas),
          skuId: `minecore:upgrade:${slotIndex}:${plantType}`,
          purchaseType: 'other',
        });
        if (!paid.ok) return;
      }
      dispatch({ type: 'ChangePlantType', at: Date.now(), slotIndex, plantType });
    },
    [dispatch, payKasBestEffort, getKasPriceAfterDiscount]
  );

  const craftRecipe = useCallback((recipeId: string) => {
    dispatch({ type: 'CraftRecipe', at: Date.now(), recipeId });
  }, [dispatch]);

  const deployNFT = useCallback((slotIndex: number, nftId: number, collection: string) => {
    dispatch({ type: 'DeployNFT', at: Date.now(), slotIndex, nftId, collection });
  }, [dispatch]);

  const removeNFT = useCallback((slotIndex: number) => {
    dispatch({ type: 'RemoveNFT', at: Date.now(), slotIndex });
  }, [dispatch]);

  const setAutomation = useCallback((patch: { autoRestart?: boolean }) => {
    dispatch({ type: 'SetAutomation', at: Date.now(), patch });
  }, [dispatch]);

  const purchaseIngredientWithKAS = useCallback(
    async (ingredient: any, opts: { amount: number; amountKas: number }) => {
      const paid = await payKasBestEffort({
        amountKas: getKasPriceAfterDiscount(opts.amountKas),
        skuId: `minecore:ingredient:${ingredient}`,
        purchaseType: 'other',
      });
      if (!paid.ok) return false;
      dispatch({ type: 'AddIngredients', at: Date.now(), ingredient, amount: opts.amount });
      return true;
    },
    [dispatch, payKasBestEffort, getKasPriceAfterDiscount]
  );

  return {
    state: derived,
    slottedMetadata,
    miningAllowed,
    profileNotice,
    dismissProfileNotice: () => setProfileNotice(null),
    dismissLastPaymentError: () => setLastPaymentError(null),
    dismissLastSetupError: () => setLastSetupError(null),
    wallet: {
      isConnected: walletState.isConnected,
      address: walletState.address ?? null,
      provider: walletState.provider ?? null,
    },
    lastPaymentError,
    lastSetupError,
    actions: {
      unlockSlot,
      addSlot,
      purchaseNftDeckSlot,
      installMachine,
      installBattery,
      assignPlantWorkerNftDeck,
      setModules,
      setBoost,
      startMining,
      stopMining,
      resumeMining,
      extract,
      topUpPower,
      topUpPowerWithKAS,
      repair,
      repairWithKAS,
      refine,
      redeemGrid,
      craftRecipe,
      deployNFT,
      removeNFT,
      setAutomation,
      purchaseIngredientWithKAS,
      refillBattery,
      refillBatteryWithKAS,
      rechargePlantWithKAS,
      changePlantType,
    },
    getKasPriceAfterDiscount,
    nowTick,
  };
}

function useNowTick(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

