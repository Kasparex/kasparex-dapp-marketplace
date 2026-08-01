'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { isValidKaspaAddress } from '@/lib/kaspa/sdk';
import { signKrc20Transfer } from '@/lib/kaspa/l1WalletActions';
import { payKaspaL1, recordL1Reward, verifyKaspaL1Payment } from '@/lib/games/sdk';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { applyKrexFeeDiscount } from '@/lib/hub/applyKrexFeeDiscount';
import { KRC20_TRANSFER_TYPE, KREX_DECIMALS } from '@/lib/game/diamond-veins-config';
import {
  PRECISION_CLICK_ENTRY_KAS,
  PRECISION_CLICK_GAME_ID,
  PRECISION_CLICK_REFINE_MIN,
  PRECISION_CLICK_STORAGE_PREFIX,
  PRECISION_ENTRY_ADDONS,
  PRECISION_LEVELS,
  getPrecisionShopItem,
  type PrecisionAddonId,
  type PrecisionShopItemId,
} from '@/lib/game/precision-click/config';
import {
  createEmptyPrecisionState,
  type PrecisionClickPersistedState,
} from '@/lib/game/precision-click/types';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';

const DEFAULT_TREASURY = process.env.NEXT_PUBLIC_GAME_TREASURY_ADDRESS || '';
const KREX_PRIORITY_FEE_KAS = 0.001;
const KREX_PER_KAS = 100;

function storageKey(address: string) {
  return `${PRECISION_CLICK_STORAGE_PREFIX}:${address.trim().toLowerCase()}`;
}

function loadState(address: string): PrecisionClickPersistedState {
  if (typeof window === 'undefined') return createEmptyPrecisionState(address);
  try {
    const raw = localStorage.getItem(storageKey(address));
    if (!raw) return createEmptyPrecisionState(address);
    const parsed = JSON.parse(raw) as Partial<PrecisionClickPersistedState>;
    const base = createEmptyPrecisionState(address);
    return {
      ...base,
      ...parsed,
      version: 2,
      walletAddress: address,
      inventory: {
        shard_lens: Math.max(0, Math.floor(parsed.inventory?.shard_lens ?? 0)),
        null_filter: Math.max(0, Math.floor(parsed.inventory?.null_filter ?? 0)),
      },
      ownedAddons: Array.isArray(parsed.ownedAddons) ? parsed.ownedAddons : [],
      highestClearedLevel: Math.max(0, Math.min(10, Math.floor(parsed.highestClearedLevel ?? 0))),
      ariaFragments: Math.max(0, Math.floor(parsed.ariaFragments ?? 0)),
      fragmentsEarnedLifetime: Math.max(0, Math.floor(parsed.fragmentsEarnedLifetime ?? 0)),
      refinementPointsTotal: Math.max(0, Math.floor(parsed.refinementPointsTotal ?? 0)),
      booster: parsed.booster ?? null,
      entryUnlocked: Boolean(parsed.entryUnlocked),
    };
  } catch {
    return createEmptyPrecisionState(address);
  }
}

function saveState(state: PrecisionClickPersistedState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(storageKey(state.walletAddress), JSON.stringify({ ...state, updatedAt: Date.now() }));
  } catch {
    /* ignore */
  }
}

function liveBooster(state: PrecisionClickPersistedState): PrecisionClickPersistedState['booster'] {
  if (!state.booster) return null;
  if (state.booster.until <= Date.now()) return null;
  return state.booster;
}

export function usePrecisionClick() {
  const { state: wallet } = useKaspaWallet();
  const { tier: krexTier, l1Balance: krexL1Balance } = useKREXBalance();
  const walletAddr = wallet.address?.trim() || '';

  const [state, setState] = useState<PrecisionClickPersistedState>(() =>
    createEmptyPrecisionState(''),
  );
  const [paying, setPaying] = useState(false);
  const [buyBusyId, setBuyBusyId] = useState<string | null>(null);
  const [refining, setRefining] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastSuccess, setLastSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddr) {
      setState(createEmptyPrecisionState(''));
      return;
    }
    setState(loadState(walletAddr));
  }, [walletAddr]);

  const persist = useCallback((updater: (prev: PrecisionClickPersistedState) => PrecisionClickPersistedState) => {
    setState((prev) => {
      const next = updater(prev);
      if (next.walletAddress) saveState(next);
      return next;
    });
  }, []);

  const booster = useMemo(() => liveBooster(state), [state]);
  const boosterMult = booster?.mult ?? 1;

  const getKasPriceAfterDiscount = useCallback(
    (listKas: number) => applyKrexFeeDiscount(listKas, krexTier),
    [krexTier],
  );

  const entryListKas = PRECISION_CLICK_ENTRY_KAS;
  const entryDiscountedKas = getKasPriceAfterDiscount(entryListKas);

  const addonListKas = useCallback((ids: PrecisionAddonId[]) => {
    return ids.reduce((sum, id) => {
      const def = PRECISION_ENTRY_ADDONS.find((a) => a.id === id);
      return sum + (def?.listKas ?? 0);
    }, 0);
  }, []);

  const payKas = useCallback(
    async (args: { amountKas: number; skuId: string; purchaseType: 'entry' | 'boost' | 'other' }) => {
      if (!wallet.isConnected || !wallet.provider || !walletAddr) {
        return { ok: false as const, error: 'Connect a Kaspa wallet first.' };
      }
      if (!DEFAULT_TREASURY || !isValidKaspaAddress(DEFAULT_TREASURY)) {
        return { ok: false as const, error: 'Game treasury address is not configured.' };
      }
      const pay = await payKaspaL1({
        provider: wallet.provider,
        fromKaspaAddress: walletAddr,
        toKaspaAddress: DEFAULT_TREASURY,
        amountKas: args.amountKas,
        gameId: PRECISION_CLICK_GAME_ID,
        skuId: args.skuId,
        purchaseType: args.purchaseType,
      });
      if (!pay.ok) return { ok: false as const, error: pay.error };
      void recordL1Reward({
        userAddress: walletAddr,
        dappId: PRECISION_CLICK_GAME_ID,
        actionType: args.purchaseType === 'entry' ? 'game_entry' : 'game_purchase',
        actionValue: args.amountKas,
        txHash: pay.txHash,
        network: 'L1',
      }).catch(() => {});
      void verifyKaspaL1Payment({
        txHash: pay.txHash,
        payerKaspaAddress: walletAddr,
        toKaspaAddress: DEFAULT_TREASURY,
        minAmountKas: args.amountKas,
        gameId: PRECISION_CLICK_GAME_ID,
        skuId: args.skuId,
        purchaseType: args.purchaseType,
        sessionId: pay.sessionId,
      }).catch(() => {});
      return { ok: true as const, txHash: pay.txHash };
    },
    [wallet.isConnected, wallet.provider, walletAddr],
  );

  const payKrex = useCallback(
    async (args: { amountKrex: number; skuId: string }) => {
      if (!wallet.isConnected || !wallet.provider || !walletAddr) {
        return { ok: false as const, error: 'Connect a Kaspa wallet first.' };
      }
      const treasury = (process.env.NEXT_PUBLIC_KREX_BOOSTER_TREASURY_ADDRESS || DEFAULT_TREASURY).trim();
      if (!treasury || !isValidKaspaAddress(treasury)) {
        return { ok: false as const, error: 'KREX treasury address is not configured.' };
      }
      if (krexL1Balance < args.amountKrex) {
        return { ok: false as const, error: 'Insufficient KREX balance on L1.' };
      }
      const amountSmallest = Math.floor(args.amountKrex * Math.pow(10, KREX_DECIMALS));
      const payload = JSON.stringify({
        p: 'KRC-20',
        op: 'transfer',
        tick: 'KREX',
        amt: amountSmallest.toString(),
        to: treasury,
      });
      try {
        const tx = await signKrc20Transfer(
          wallet.provider,
          payload,
          KRC20_TRANSFER_TYPE,
          treasury,
          KREX_PRIORITY_FEE_KAS,
        );
        const txHash = extractKaspaTransactionId(tx) || String(tx ?? '');
        void recordL1Reward({
          userAddress: walletAddr,
          dappId: PRECISION_CLICK_GAME_ID,
          actionType: 'game_purchase',
          actionValue: args.amountKrex,
          txHash,
          network: 'L1',
        }).catch(() => {});
        return { ok: true as const, txHash };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'KREX transfer failed.';
        return { ok: false as const, error: message };
      }
    },
    [wallet.isConnected, wallet.provider, walletAddr, krexL1Balance],
  );

  const payEntry = useCallback(
    async (args: { addonIds: PrecisionAddonId[]; currency: 'KAS' | 'KREX' }) => {
      setLastError(null);
      setLastSuccess(null);
      if (!walletAddr) {
        setLastError('Connect a Kaspa wallet first.');
        return false;
      }
      const addonsKas = addonListKas(args.addonIds);
      const listTotal = entryListKas + addonsKas;
      const payKasAmount = getKasPriceAfterDiscount(listTotal);
      setPaying(true);
      try {
        let txHash = '';
        if (args.currency === 'KREX') {
          const krexAmt = payKasAmount * KREX_PER_KAS;
          const paid = await payKrex({ amountKrex: krexAmt, skuId: 'precision-click:entry' });
          if (!paid.ok) {
            setLastError(paid.error);
            return false;
          }
          txHash = paid.txHash;
        } else {
          const paid = await payKas({
            amountKas: payKasAmount,
            skuId: 'precision-click:entry',
            purchaseType: 'entry',
          });
          if (!paid.ok) {
            setLastError(paid.error);
            return false;
          }
          txHash = paid.txHash;
        }
        persist((prev) => ({
          ...prev,
          walletAddress: walletAddr,
          entryUnlocked: true,
          entryTxHash: txHash,
          ownedAddons: [...args.addonIds],
        }));
        setLastSuccess('Entry unlocked. Levels are ready in Play.');
        return true;
      } finally {
        setPaying(false);
      }
    },
    [walletAddr, addonListKas, entryListKas, getKasPriceAfterDiscount, payKrex, payKas, persist],
  );

  const buyShopItem = useCallback(
    async (args: { itemId: PrecisionShopItemId; currency: 'KAS' | 'KREX'; quantity?: number }) => {
      setLastError(null);
      setLastSuccess(null);
      const def = getPrecisionShopItem(args.itemId);
      if (!def) {
        setLastError('Unknown shop item.');
        return false;
      }
      const qty = Math.max(1, Math.floor(args.quantity ?? 1));
      const listKas = def.listKas * qty;
      const payKasAmount = getKasPriceAfterDiscount(listKas);
      setBuyBusyId(args.itemId);
      try {
        let txHash = '';
        if (args.currency === 'KREX') {
          const paid = await payKrex({
            amountKrex: payKasAmount * KREX_PER_KAS,
            skuId: `precision-click:shop:${args.itemId}`,
          });
          if (!paid.ok) {
            setLastError(paid.error);
            return false;
          }
          txHash = paid.txHash;
        } else {
          const paid = await payKas({
            amountKas: payKasAmount,
            skuId: `precision-click:shop:${args.itemId}`,
            purchaseType: def.boosterMult ? 'boost' : 'other',
          });
          if (!paid.ok) {
            setLastError(paid.error);
            return false;
          }
          txHash = paid.txHash;
        }

        persist((prev) => {
          const next = { ...prev, walletAddress: walletAddr || prev.walletAddress };
          if (def.boosterMult && def.durationMs) {
            next.booster = {
              mult: def.boosterMult,
              until: Date.now() + def.durationMs,
              itemId: def.id,
              txHash,
            };
          }
          if (def.effect === 'shard_lens') {
            next.inventory = {
              ...next.inventory,
              shard_lens: next.inventory.shard_lens + (def.charges ?? 1) * qty,
            };
          }
          if (def.effect === 'null_filter') {
            next.inventory = {
              ...next.inventory,
              null_filter: next.inventory.null_filter + (def.charges ?? 1) * qty,
            };
          }
          return next;
        });
        setLastSuccess(`${def.title} purchased.`);
        return true;
      } finally {
        setBuyBusyId(null);
      }
    },
    [getKasPriceAfterDiscount, payKrex, payKas, persist, walletAddr],
  );

  const consumeRunItems = useCallback(
    (opts: { useShardLens: boolean; useNullFilter: boolean }) => {
      persist((prev) => {
        const inv = { ...prev.inventory };
        if (opts.useShardLens && inv.shard_lens > 0) inv.shard_lens -= 1;
        if (opts.useNullFilter && inv.null_filter > 0) inv.null_filter -= 1;
        return { ...prev, inventory: inv };
      });
    },
    [persist],
  );

  const bankRunFragments = useCallback(
    (grossFragments: number, levelId: number, cleared: boolean) => {
      const gained = Math.max(0, Math.floor(grossFragments));
      persist((prev) => ({
        ...prev,
        ariaFragments: prev.ariaFragments + gained,
        fragmentsEarnedLifetime: prev.fragmentsEarnedLifetime + gained,
        highestClearedLevel: cleared
          ? Math.max(prev.highestClearedLevel, Math.min(10, levelId))
          : prev.highestClearedLevel,
      }));
    },
    [persist],
  );

  const refineFragments = useCallback(
    async (amountArg: number): Promise<{ points: number; amount: number } | null> => {
      if (!walletAddr) {
        setLastError('Connect a Kaspa wallet to refine.');
        return null;
      }
      const bag = Math.floor(state.ariaFragments);
      const amount = Math.max(0, Math.min(bag, Math.floor(amountArg)));
      if (amount < PRECISION_CLICK_REFINE_MIN) {
        setLastError(`Refine at least ${PRECISION_CLICK_REFINE_MIN} Aria fragments.`);
        return null;
      }
      setRefining(true);
      try {
        const points = amount; // 1:1 Hub points
        const syntheticTx =
          typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function'
            ? Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join('')
            : `${Date.now()}`.padStart(64, '0');

        void fetch('/api/rewards/l1/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            txHash: syntheticTx,
            userAddress: walletAddr,
            dappId: PRECISION_CLICK_GAME_ID,
            actionType: 'refine',
            actionValue: points,
            network: 'L1',
          }),
        }).catch(() => {});

        persist((prev) => ({
          ...prev,
          ariaFragments: Math.max(0, prev.ariaFragments - amount),
          refinementPointsTotal: prev.refinementPointsTotal + points,
        }));
        setLastSuccess(`Refined ${amount.toLocaleString()} fragments → ${points.toLocaleString()} Hub points.`);
        return { points, amount };
      } finally {
        setRefining(false);
      }
    },
    [walletAddr, state.ariaFragments, persist],
  );

  const maxUnlockedLevel = Math.min(10, state.highestClearedLevel + 1);
  const addonBundle = useMemo(() => {
    let extraTimeMs = 0;
    let fragmentBonusMult = 1;
    let missForgiveness = 0;
    for (const id of state.ownedAddons) {
      const def = PRECISION_ENTRY_ADDONS.find((a) => a.id === id);
      if (!def) continue;
      extraTimeMs += def.extraTimeMs ?? 0;
      fragmentBonusMult *= def.fragmentBonusMult ?? 1;
      missForgiveness += def.missForgiveness ?? 0;
    }
    return { extraTimeMs, fragmentBonusMult, missForgiveness };
  }, [state.ownedAddons]);

  return {
    state,
    walletConnected: Boolean(wallet.isConnected && walletAddr),
    walletAddr,
    krexTier,
    entryListKas,
    entryDiscountedKas,
    getKasPriceAfterDiscount,
    addonListKas,
    paying,
    buyBusyId,
    refining,
    lastError,
    lastSuccess,
    clearNotices: () => {
      setLastError(null);
      setLastSuccess(null);
    },
    booster,
    boosterMult,
    maxUnlockedLevel,
    levels: PRECISION_LEVELS,
    addonBundle,
    payEntry,
    buyShopItem,
    consumeRunItems,
    bankRunFragments,
    refineFragments,
    refineMin: PRECISION_CLICK_REFINE_MIN,
  };
}
