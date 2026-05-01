'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import {
  createInitialMinecoreState,
  hydrateMinecoreState,
  applyMinecoreEvent,
  deriveState,
  computeLiveDiamonds,
  computePlantReady,
  computeLiveBatteryChargeMs,
  minecoreAutoRestartInfrastructureActive,
  minecorePlantHasForemanInCrew,
  hasInstalledBattery,
  type MinecoreState,
  type MinecoreBatteryId,
  type PlantSlotState,
} from '@/lib/game/minecore';
import { fetchNFTMetadata, type ParsedNFTMetadata } from '@/lib/nft/metadata';
import {
  MINECORE_PLANT_RECHARGE_COST_KAS,
  MINECORE_DEFAULT_SLOT_UNLOCK_COST_KAS,
  MINECORE_STORAGE_PREFIX,
  MINECORE_KREX_PER_KAS,
  MINECORE_PLANT_REPAIR_KAS,
  MINECORE_STABILITY_PATCH_LIST_KAS,
  minecoreKrexFromDiscountedKas,
  MINECORE_KREX_BOOST_SHOP_KAS,
  MINECORE_KAS_OVERCLOCK_SHOP_KAS,
} from '@/lib/game/minecore/config';
import { payKaspaL1, recordL1Reward, verifyKaspaL1Payment } from '@/lib/games/sdk';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { KRC20_TRANSFER_TYPE, KREX_DECIMALS, KREX_TIER_SHOP_DISCOUNT_PCT } from '@/lib/game/diamond-veins-config';
import { signKrc20Transfer } from '@/lib/kaspa/l1WalletActions';
import { getNFTTier } from '@/lib/game/diamond-bonuses';
import type { MiningSlotType } from '@/lib/game/engine';
import { explainPlantSetupBlock, nextPlantSetupAfterInstallPart } from '@/lib/game/minecore/asset-usage';
import { enforcePlantInventoryInvariants } from '@/lib/game/minecore/inventory-invariants';
import type { MinecoreComputeContext } from '@/lib/game/minecore/compute-context';
import type { MinecoreIngredient, MinecorePowerNodeId } from '@/lib/game/minecore/types';

const DEFAULT_TREASURY = process.env.NEXT_PUBLIC_GAME_TREASURY_ADDRESS || '';
const KREX_RECHARGE_PRIORITY_FEE_KAS = 0.001;

/** Persisted game state is keyed only by Kaspa L1 address - no shared guest bucket. */
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
  const { tier: krexTier, l1Balance: krexL1Balance } = useKREXBalance();

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

  const [slottedMetadata, setSlottedMetadata] = useState<Record<number, ParsedNFTMetadata>>({});

  const minecoreComputeContext = useMemo((): MinecoreComputeContext => ({ nftMetadataByDeckIndex: slottedMetadata }), [
    slottedMetadata,
  ]);

  // Derive statuses from timestamps (progress + completed state) without mutating persisted state each second.
  const nowTick = useNowTick(1000);
  const derived = useMemo(() => deriveState(mc, nowTick, minecoreComputeContext), [mc, nowTick, minecoreComputeContext]);

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

  const prevAutomationRestartRef = useRef<Record<number, string>>({});

  /**
   * Auto-restart mining after a run ends (CreditingReady / BatteryEmpty / DailyCapReached → ReadyToMine).
   * Requires batteries installed with charge; never refills power or batteries - Foreman energy-cell refill removed.
   */
  useEffect(() => {
    if (!walletState.isConnected || !walletAddr) return;
    if (!minecoreAutoRestartInfrastructureActive(mcRef.current)) return;

    const now = Date.now();
    const slots = derived.plantSlots;

    for (let slotIdx = 0; slotIdx < slots.length; slotIdx++) {
      const rawSlot = mcRef.current.plantSlots[slotIdx];
      if (!rawSlot?.unlocked) continue;
      if (!minecorePlantHasForemanInCrew(mcRef.current, rawSlot)) continue;
      if (!rawSlot.autoRestartMining) continue;

      const st = slots[slotIdx]?.status;
      if (!st) continue;

      const prev = prevAutomationRestartRef.current[slotIdx];
      prevAutomationRestartRef.current[slotIdx] = st;
      if (prev === undefined) continue;

      if (st !== 'ReadyToMine' || prev === 'ReadyToMine') continue;
      if (prev !== 'CreditingReady' && prev !== 'BatteryEmpty' && prev !== 'DailyCapReached') continue;

      if (!computePlantReady(mcRef.current, rawSlot)) continue;
      if (!hasInstalledBattery(rawSlot.setup, rawSlot.type)) continue;
      if (computeLiveBatteryChargeMs(rawSlot, now) <= 0) continue;

      dispatch({ type: 'StartMining', slotIndex: slotIdx, at: now });
    }
  }, [walletState.isConnected, walletAddr, derived.plantSlots, dispatch]);

  /**
   * When a run ends (cycle complete or battery empty), bank mined diamonds to the wallet immediately - no separate Extract step.
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
        (slot.cycle != null && computeLiveDiamonds(mcRef.current, slot, now, minecoreComputeContext) > 0);
      if (justEntered && (st === 'CreditingReady' || st === 'BatteryEmpty') && canBank) {
        dispatch({ type: 'Extract', slotIndex: slotIdx, at: now });
      }
      autoBankPrevStatusRef.current[slotIdx] = st;
    }
  }, [walletState.isConnected, walletAddr, derived.plantSlots, nowTick, dispatch, minecoreComputeContext]);

  useEffect(() => {
    let cancelled = false;
    const slots = derived.nftSlots ?? [];
    setSlottedMetadata((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        const i = Number(k);
        if (!Number.isFinite(i) || i < 0 || i >= slots.length) delete next[i];
        else if (slots[i]?.nftId == null) delete next[i];
      }
      return next;
    });
    void (async () => {
      for (let deckIdx = 0; deckIdx < slots.length; deckIdx++) {
        const slot = slots[deckIdx];
        if (slot.nftId == null || !slot.collection) continue;
        try {
          const meta = await fetchNFTMetadata(slot.collection, slot.nftId);
          if (!cancelled && meta) {
            setSlottedMetadata((prev) => ({ ...prev, [deckIdx]: meta }));
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

  useEffect(() => {
    const slots = derived.nftSlots ?? [];
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (slot.nftId == null || !slot.collection) {
        if (slot.minecorePerkTier != null) {
          dispatch({ type: 'SyncMinecoreNftPerkTier', at: Date.now(), slotIndex: i, tier: null });
        }
        continue;
      }
      const meta = slottedMetadata[i] ?? null;
      const tier = getNFTTier(slot.collection, slot.nftId, meta);
      if (slot.minecorePerkTier === tier) continue;
      dispatch({ type: 'SyncMinecoreNftPerkTier', at: Date.now(), slotIndex: i, tier });
    }
  }, [derived.nftSlots, slottedMetadata, dispatch]);

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

  /** L1 KREX (KRC-20) transfer to game treasury - same flow as plant recharge. */
  const payKrexTreasury = useCallback(
    async (
      amountKrex: number,
      meta: { skuId: string; recordActionType: string; transactionDetail?: Record<string, unknown> },
    ) => {
      setLastPaymentError(null);
      if (!walletState.isConnected || !walletState.provider || !walletState.address) {
        setLastPaymentError('Wallet connection required');
        return { ok: false as const };
      }
      if (!DEFAULT_TREASURY) {
        setLastPaymentError('Treasury address not configured');
        return { ok: false as const };
      }
      if (krexL1Balance + 1e-12 < amountKrex) {
        setLastPaymentError('Insufficient KREX balance on L1 for this purchase');
        return { ok: false as const };
      }
      try {
        const amountSmallest = Math.floor(amountKrex * Math.pow(10, KREX_DECIMALS));
        if (!Number.isFinite(amountSmallest) || amountSmallest <= 0) {
          setLastPaymentError('KREX amount too small to transfer');
          return { ok: false as const };
        }
        const inscribeJson = {
          p: 'KRC-20',
          op: 'transfer',
          tick: 'KREX',
          amt: amountSmallest.toString(),
          to: DEFAULT_TREASURY,
        };
        const txHash = await signKrc20Transfer(
          walletState.provider,
          JSON.stringify(inscribeJson),
          KRC20_TRANSFER_TYPE,
          DEFAULT_TREASURY,
          KREX_RECHARGE_PRIORITY_FEE_KAS,
        );

        void recordL1Reward({
          userAddress: walletState.address,
          dappId: 'minecore',
          actionType: meta.recordActionType,
          actionValue: amountKrex,
          txHash,
          network: 'L1',
        }).catch(() => {});

        try {
          window.dispatchEvent(
            new CustomEvent('record-transaction', {
              detail: {
                type: meta.skuId,
                currency: 'KREX',
                amount: amountKrex,
                txHash,
                status: 'completed',
                ...meta.transactionDetail,
              },
            }),
          );
        } catch {
          // ignore
        }

        return { ok: true as const, txHash };
      } catch (e) {
        setLastPaymentError(e instanceof Error ? e.message : 'KREX payment failed');
        return { ok: false as const };
      }
    },
    [walletState.isConnected, walletState.provider, walletState.address, krexL1Balance],
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

  const setPlantPowerNodes = useCallback((slotIndex: number, ids: (MinecorePowerNodeId | null)[]) => {
    dispatch({ type: 'InstallPart', slotIndex, at: Date.now(), part: { kind: 'powerNodes', ids } });
  }, [dispatch]);

  const assignPlantWorkerNftDeck = useCallback(
    (slotIndex: number, deckSlotIndex: number | null, workerSlotPosition = 0) => {
      dispatch({
        type: 'InstallPart',
        slotIndex,
        at: Date.now(),
        part: { kind: 'crewWorkerNftDeck', deckSlotIndex, workerSlotPosition },
      });
    },
    [dispatch],
  );

  const assignPlantCrewDeckIndices = useCallback((slotIndex: number, indices: (number | null)[]) => {
    dispatch({
      type: 'InstallPart',
      slotIndex,
      at: Date.now(),
      part: { kind: 'crewWorkerNftDecks', indices },
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
      const paid = await payKasBestEffort({
        amountKas: getKasPriceAfterDiscount(amountKas),
        skuId: 'minecore:repair',
        purchaseType: 'other',
      });
      if (!paid.ok) return false;
      dispatch({ type: 'Repair', slotIndex, at: Date.now(), consumeStabilityPatch: false });
      return true;
    },
    [dispatch, payKasBestEffort, getKasPriceAfterDiscount],
  );

  const repairPlantWithPayment = useCallback(
    async (slotIndex: number, opts: { currency: 'KAS' | 'KREX'; consumeStabilityPatch: boolean }) => {
      const listKas = MINECORE_PLANT_REPAIR_KAS;
      const discounted = getKasPriceAfterDiscount(listKas);
      if (opts.currency === 'KREX') {
        const paid = await payKrexTreasury(minecoreKrexFromDiscountedKas(discounted), {
          skuId: opts.consumeStabilityPatch ? 'minecore:maintenance:early:krex' : 'minecore:maintenance:krex',
          recordActionType: 'maintenance-krex',
          transactionDetail: { slotIndex, early: opts.consumeStabilityPatch },
        });
        if (!paid.ok) return false;
      } else {
        const paid = await payKasBestEffort({
          amountKas: discounted,
          skuId: opts.consumeStabilityPatch ? 'minecore:maintenance:early' : 'minecore:maintenance',
          purchaseType: 'other',
        });
        if (!paid.ok) return false;
      }
      dispatch({
        type: 'Repair',
        slotIndex,
        at: Date.now(),
        consumeStabilityPatch: opts.consumeStabilityPatch,
      });
      return true;
    },
    [dispatch, payKasBestEffort, payKrexTreasury, getKasPriceAfterDiscount],
  );

  const purchaseStabilityPatchesWithKAS = useCallback(
    async (count: number) => {
      const q = Math.max(1, Math.floor(count));
      const paid = await payKasBestEffort({
        amountKas: getKasPriceAfterDiscount(MINECORE_STABILITY_PATCH_LIST_KAS * q),
        skuId: 'minecore:shop:stability-patch',
        purchaseType: 'other',
      });
      if (!paid.ok) return false;
      dispatch({ type: 'AddStabilityPatches', count: q, at: Date.now() });
      return true;
    },
    [dispatch, payKasBestEffort, getKasPriceAfterDiscount],
  );

  const purchaseStabilityPatchesWithKREX = useCallback(
    async (count: number) => {
      const q = Math.max(1, Math.floor(count));
      const listKas = MINECORE_STABILITY_PATCH_LIST_KAS * q;
      const discounted = getKasPriceAfterDiscount(listKas);
      const paid = await payKrexTreasury(minecoreKrexFromDiscountedKas(discounted), {
        skuId: 'minecore:shop:stability-patch:krex',
        recordActionType: 'stability-patch',
        transactionDetail: { count: q },
      });
      if (!paid.ok) return false;
      dispatch({ type: 'AddStabilityPatches', count: q, at: Date.now() });
      return true;
    },
    [dispatch, payKrexTreasury, getKasPriceAfterDiscount],
  );

  const purchaseKrexBoostChargesWithKAS = useCallback(
    async (count: number) => {
      const q = Math.max(1, Math.floor(count));
      const paid = await payKasBestEffort({
        amountKas: getKasPriceAfterDiscount(MINECORE_KREX_BOOST_SHOP_KAS * q),
        skuId: 'minecore:shop:krex-boost',
        purchaseType: 'other',
      });
      if (!paid.ok) return false;
      dispatch({ type: 'GrantModuleInventory', moduleId: 'krex-boost', count: q, at: Date.now() });
      return true;
    },
    [dispatch, payKasBestEffort, getKasPriceAfterDiscount],
  );

  const purchaseKasOverclockWithKAS = useCallback(
    async (slotIndex: number, count: number) => {
      const q = Math.max(1, Math.floor(count));
      const paid = await payKasBestEffort({
        amountKas: getKasPriceAfterDiscount(MINECORE_KAS_OVERCLOCK_SHOP_KAS * q),
        skuId: 'minecore:shop:kas-overclock',
        purchaseType: 'other',
      });
      if (!paid.ok) return false;
      dispatch({ type: 'ApplyKasOverclock', slotIndex, count: q, at: Date.now() });
      return true;
    },
    [dispatch, payKasBestEffort, getKasPriceAfterDiscount],
  );

  const purchaseKrexBoostChargesWithKREX = useCallback(
    async (count: number) => {
      const q = Math.max(1, Math.floor(count));
      const listKas = MINECORE_KREX_BOOST_SHOP_KAS * q;
      const discounted = getKasPriceAfterDiscount(listKas);
      const paid = await payKrexTreasury(minecoreKrexFromDiscountedKas(discounted), {
        skuId: 'minecore:shop:krex-boost:krex',
        recordActionType: 'shop-krex-boost',
        transactionDetail: { count: q },
      });
      if (!paid.ok) return false;
      dispatch({ type: 'GrantModuleInventory', moduleId: 'krex-boost', count: q, at: Date.now() });
      return true;
    },
    [dispatch, payKrexTreasury, getKasPriceAfterDiscount],
  );

  const purchaseKasOverclockWithKREX = useCallback(
    async (slotIndex: number, count: number) => {
      const q = Math.max(1, Math.floor(count));
      const listKas = MINECORE_KAS_OVERCLOCK_SHOP_KAS * q;
      const discounted = getKasPriceAfterDiscount(listKas);
      const paid = await payKrexTreasury(minecoreKrexFromDiscountedKas(discounted), {
        skuId: 'minecore:shop:kas-overclock:krex',
        recordActionType: 'shop-kas-overclock',
        transactionDetail: { slotIndex, count: q },
      });
      if (!paid.ok) return false;
      dispatch({ type: 'ApplyKasOverclock', slotIndex, count: q, at: Date.now() });
      return true;
    },
    [dispatch, payKrexTreasury, getKasPriceAfterDiscount],
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

  /** Refill selected battery slot(s). KAS = L1 KAS send; KREX = L1 KRC-20 transfer to treasury (same wallet flow as Garage). */
  const rechargePlant = useCallback(
    async (
      slotIndex: number,
      opts?: { batterySlotIndex?: number; batterySlotIndexes?: number[]; currency?: 'KAS' | 'KREX' },
    ) => {
      let indexes: number[];
      if (opts?.batterySlotIndexes && opts.batterySlotIndexes.length > 0) {
        indexes = opts.batterySlotIndexes;
      } else if (opts?.batterySlotIndex != null) {
        indexes = [opts.batterySlotIndex];
      } else {
        indexes = [0];
      }
      const currency = opts?.currency ?? 'KAS';
      const listKas = MINECORE_PLANT_RECHARGE_COST_KAS * indexes.length;
      const payKas = getKasPriceAfterDiscount(listKas);
      const payKrex = payKas * MINECORE_KREX_PER_KAS;

      const payload = {
        type: 'RechargePlant' as const,
        slotIndex,
        at: Date.now(),
        batterySlotIndexes: indexes.length > 1 ? indexes : undefined,
        batterySlotIndex: indexes.length === 1 ? indexes[0] : undefined,
      };

      if (currency === 'KREX') {
        const paid = await payKrexTreasury(payKrex, {
          skuId: 'minecore:plant:recharge',
          recordActionType: 'recharge-krex',
          transactionDetail: { slotCount: indexes.length, plantIndex: slotIndex },
        });
        if (!paid.ok) return false;
        dispatch(payload);
        return true;
      }

      const paid = await payKasBestEffort({
        amountKas: payKas,
        skuId: 'minecore:plant:recharge',
        purchaseType: 'other',
      });
      if (!paid.ok) return false;
      dispatch(payload);
      return true;
    },
    [dispatch, payKasBestEffort, payKrexTreasury, getKasPriceAfterDiscount],
  );

  const rechargePlantWithKAS = useCallback(
    (slotIndex: number, opts?: { batterySlotIndex?: number; batterySlotIndexes?: number[] }) =>
      rechargePlant(slotIndex, { ...opts, currency: 'KAS' }),
    [rechargePlant],
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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kasparex-nft-usage'));
    }
  }, [dispatch]);

  const removeNFT = useCallback((slotIndex: number) => {
    dispatch({ type: 'RemoveNFT', at: Date.now(), slotIndex });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kasparex-nft-usage'));
    }
  }, [dispatch]);

  const setPlantAutoRestartMining = useCallback((slotIndex: number, enabled: boolean) => {
    dispatch({ type: 'SetPlantAutoRestartMining', at: Date.now(), slotIndex, enabled });
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

  const purchaseIngredientPackWithKAS = useCallback(
    async (pack: Partial<Record<MinecoreIngredient, number>>, opts: { amountKas: number; skuId: string }) => {
      const paid = await payKasBestEffort({
        amountKas: getKasPriceAfterDiscount(opts.amountKas),
        skuId: opts.skuId,
        purchaseType: 'other',
      });
      if (!paid.ok) return false;
      const at = Date.now();
      for (const [k, v] of Object.entries(pack)) {
        const n = Math.max(0, Math.floor(Number(v) || 0));
        if (n > 0) {
          dispatch({ type: 'AddIngredients', at, ingredient: k as MinecoreIngredient, amount: n });
        }
      }
      return true;
    },
    [dispatch, payKasBestEffort, getKasPriceAfterDiscount],
  );

  const purchaseIngredientWithKREX = useCallback(
    async (ingredient: MinecoreIngredient, opts: { amount: number; amountKrex: number }) => {
      const paid = await payKrexTreasury(opts.amountKrex, {
        skuId: `minecore:ingredient:${ingredient}:krex`,
        recordActionType: 'shop-ingredient-krex',
      });
      if (!paid.ok) return false;
      dispatch({ type: 'AddIngredients', at: Date.now(), ingredient, amount: opts.amount });
      return true;
    },
    [dispatch, payKrexTreasury],
  );

  const purchaseIngredientPackWithKREX = useCallback(
    async (pack: Partial<Record<MinecoreIngredient, number>>, opts: { amountKrex: number; skuId: string }) => {
      const paid = await payKrexTreasury(opts.amountKrex, {
        skuId: opts.skuId,
        recordActionType: 'shop-pack-krex',
      });
      if (!paid.ok) return false;
      const at = Date.now();
      for (const [k, v] of Object.entries(pack)) {
        const n = Math.max(0, Math.floor(Number(v) || 0));
        if (n > 0) {
          dispatch({ type: 'AddIngredients', at, ingredient: k as MinecoreIngredient, amount: n });
        }
      }
      return true;
    },
    [dispatch, payKrexTreasury],
  );

  const purchaseIngredientWithGrid = useCallback(
    (ingredient: MinecoreIngredient, opts: { amount: number; gridCost: number }) => {
      const bal = mcRef.current.gridRedeemableTotal ?? 0;
      if (bal + 1e-9 < opts.gridCost) {
        setLastPaymentError('Insufficient GRID redeemable balance for this purchase');
        return false;
      }
      setLastPaymentError(null);
      dispatch({
        type: 'BuyIngredientWithGrid',
        at: Date.now(),
        ingredient,
        amount: opts.amount,
        gridCost: opts.gridCost,
      });
      return true;
    },
    [dispatch],
  );

  return {
    state: derived,
    slottedMetadata,
    minecoreComputeContext,
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
      setPlantPowerNodes,
      assignPlantWorkerNftDeck,
      assignPlantCrewDeckIndices,
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
      repairPlantWithPayment,
      purchaseStabilityPatchesWithKAS,
      purchaseStabilityPatchesWithKREX,
      refine,
      redeemGrid,
      craftRecipe,
      deployNFT,
      removeNFT,
      setPlantAutoRestartMining,
      purchaseIngredientWithKAS,
      purchaseIngredientPackWithKAS,
      purchaseIngredientWithKREX,
      purchaseIngredientPackWithKREX,
      purchaseIngredientWithGrid,
      refillBattery,
      refillBatteryWithKAS,
      rechargePlant,
      rechargePlantWithKAS,
      changePlantType,
      purchaseKrexBoostChargesWithKAS,
      purchaseKrexBoostChargesWithKREX,
      purchaseKasOverclockWithKAS,
      purchaseKasOverclockWithKREX,
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

