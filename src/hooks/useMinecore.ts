'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { createInitialMinecoreState, hydrateMinecoreState, applyMinecoreEvent, deriveState, type MinecoreState, type PlantSlotState } from '@/lib/game/minecore';
import { MINECORE_STORAGE_PREFIX } from '@/lib/game/minecore/config';
import { payKaspaL1, recordL1Reward, verifyKaspaL1Payment } from '@/lib/games/sdk';

const RECONNECT_GRACE_MS = 24 * 60 * 60 * 1000;
const DEFAULT_TREASURY = process.env.NEXT_PUBLIC_GAME_TREASURY_ADDRESS || '';

function storageKey(address: string | null | undefined) {
  const a = (address ?? '').trim();
  return a ? `${MINECORE_STORAGE_PREFIX}:${a}` : `${MINECORE_STORAGE_PREFIX}:guest`;
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

  const key = useMemo(() => storageKey(walletState.address ?? null), [walletState.address]);

  const [mc, setMc] = useState<MinecoreState>(() => loadPersistedMinecore(key) ?? createInitialMinecoreState());
  const mcRef = useRef(mc);
  mcRef.current = mc;

  useEffect(() => {
    const loaded = loadPersistedMinecore(key);
    if (loaded) setMc(loaded);
    if (!loaded && key.endsWith(':guest')) setMc(createInitialMinecoreState());
  }, [key]);

  useEffect(() => {
    savePersistedMinecore(key, mc);
  }, [key, mc]);

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

  const miningAllowed = useMemo(() => {
    if (walletState.isConnected) return true;
    if (mc.lastConnectedAt == null) return false;
    return Date.now() - mc.lastConnectedAt <= RECONNECT_GRACE_MS;
  }, [walletState.isConnected, mc.lastConnectedAt]);

  // Derive statuses from timestamps (progress + completed state) without mutating persisted state each second.
  const nowTick = useNowTick(1000);
  const derived = useMemo(() => deriveState(mc, nowTick), [mc, nowTick]);

  const dispatch = useCallback((ev: Parameters<typeof applyMinecoreEvent>[1]) => {
    setMc((s) => applyMinecoreEvent(s, ev));
  }, []);

  const [lastPaymentError, setLastPaymentError] = useState<string | null>(null);

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

  const unlockSlot = useCallback(
    async (slotIndex: number, amountKas: number) => {
      const paid = await payKasBestEffort({ amountKas, skuId: 'minecore:slot:unlock', purchaseType: 'slot' });
      if (!paid.ok) return false;
      dispatch({ type: 'UnlockSlot', slotIndex, at: Date.now() });
      return true;
    },
    [dispatch, payKasBestEffort]
  );

  const addSlot = useCallback(
    async (amountKas: number) => {
      const paid = await payKasBestEffort({ amountKas, skuId: 'minecore:slot:expand', purchaseType: 'slot' });
      if (!paid.ok) return false;
      dispatch({ type: 'AddSlot', at: Date.now() });
      return true;
    },
    [dispatch, payKasBestEffort]
  );

  const installMachine = useCallback((slotIndex: number, id: PlantSlotState['setup']['machineId']) => {
    dispatch({ type: 'InstallPart', slotIndex, at: Date.now(), part: { kind: 'machine', id: id as any } });
  }, [dispatch]);

  const installBattery = useCallback((slotIndex: number, id: PlantSlotState['setup']['batteryId']) => {
    dispatch({ type: 'InstallPart', slotIndex, at: Date.now(), part: { kind: 'battery', id: id as any } });
  }, [dispatch]);

  const installWorker = useCallback((slotIndex: number, id: PlantSlotState['setup']['workerId']) => {
    dispatch({ type: 'InstallPart', slotIndex, at: Date.now(), part: { kind: 'worker', id: id as any } });
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

  const extract = useCallback((slotIndex: number) => {
    dispatch({ type: 'Extract', slotIndex, at: Date.now() });
  }, [dispatch]);

  const topUpPower = useCallback((slotIndex: number, added: number) => {
    dispatch({ type: 'TopUpPower', slotIndex, at: Date.now(), added });
  }, [dispatch]);

  const topUpPowerWithKAS = useCallback(
    async (slotIndex: number, opts: { added: number; amountKas: number }) => {
      const paid = await payKasBestEffort({ amountKas: opts.amountKas, skuId: 'minecore:power:topup', purchaseType: 'other' });
      if (!paid.ok) return false;
      dispatch({ type: 'TopUpPower', slotIndex, at: Date.now(), added: opts.added });
      return true;
    },
    [dispatch, payKasBestEffort]
  );

  const repair = useCallback((slotIndex: number) => {
    dispatch({ type: 'Repair', slotIndex, at: Date.now() });
  }, [dispatch]);

  const refine = useCallback((amount: number) => {
    dispatch({ type: 'Refine', at: Date.now(), amount });
  }, [dispatch]);

  const redeemGrid = useCallback((points: number) => {
    dispatch({ type: 'RedeemGrid', at: Date.now(), points });
  }, [dispatch]);

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
      const paid = await payKasBestEffort({ amountKas: opts.amountKas, skuId: `minecore:ingredient:${ingredient}`, purchaseType: 'other' });
      if (!paid.ok) return false;
      dispatch({ type: 'AddIngredients', at: Date.now(), ingredient, amount: opts.amount });
      return true;
    },
    [dispatch, payKasBestEffort]
  );

  return {
    state: derived,
    miningAllowed,
    wallet: {
      isConnected: walletState.isConnected,
      address: walletState.address ?? null,
      provider: walletState.provider ?? null,
    },
    lastPaymentError,
    actions: {
      unlockSlot,
      addSlot,
      installMachine,
      installBattery,
      installWorker,
      setModules,
      setBoost,
      startMining,
      extract,
      topUpPower,
      topUpPowerWithKAS,
      repair,
      refine,
      redeemGrid,
      craftRecipe,
      deployNFT,
      removeNFT,
      setAutomation,
      purchaseIngredientWithKAS,
    },
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

