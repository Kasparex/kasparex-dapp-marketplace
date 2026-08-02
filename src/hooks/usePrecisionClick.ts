'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { isValidKaspaAddress } from '@/lib/kaspa/sdk';
import { signKrc20Transfer } from '@/lib/kaspa/l1WalletActions';
import { payKaspaL1, recordL1Reward, verifyKaspaL1Payment } from '@/lib/games/sdk';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { applyKrexFeeDiscount } from '@/lib/hub/applyKrexFeeDiscount';
import { KRC20_TRANSFER_TYPE, KREX_DECIMALS } from '@/lib/game/diamond-veins-config';
import { classifyNftSlotRarity } from '@/lib/nft/nft-slot-rarity';
import {
  PRECISION_CLICK_ENTRY_KAS,
  PRECISION_CLICK_GAME_ID,
  PRECISION_CLICK_REFINE_MIN,
  PRECISION_CLICK_RUN_MS,
  PRECISION_CLICK_STORAGE_PREFIX,
  PRECISION_ENTRY_ADDONS,
  PRECISION_LEVELS,
  PRECISION_OPERATIVE_PERKS,
  PRECISION_OPERATIVE_SLOT_UNLOCK_KAS,
  bankFragmentsForClear,
  getPrecisionLevel,
  getPrecisionShopItem,
  resolvePrecisionOperativeTier,
  type PrecisionAddonId,
  type PrecisionOperativeTier,
  type PrecisionShopItemId,
} from '@/lib/game/precision-click/config';
import {
  createEmptyPrecisionState,
  normalizeOperativeSlots,
  type PrecisionClickPersistedState,
  type PrecisionOperativeSlot,
} from '@/lib/game/precision-click/types';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import type { MiningSlotType } from '@/lib/game/engine/types';

const DEFAULT_TREASURY = process.env.NEXT_PUBLIC_GAME_TREASURY_ADDRESS || '';
const KREX_PRIORITY_FEE_KAS = 0.001;
const KREX_PER_KAS = 100;

function storageKey(address: string) {
  return `${PRECISION_CLICK_STORAGE_PREFIX}:${address.trim().toLowerCase()}`;
}

function mapRarityToOperativeTier(collection: string, tokenId: number): PrecisionOperativeTier {
  return resolvePrecisionOperativeTier(collection, tokenId, classifyNftSlotRarity);
}

function refreshOperativeTiers(
  slots: Array<PrecisionOperativeSlot | null>,
): Array<PrecisionOperativeSlot | null> {
  return slots.map((s) =>
    s
      ? {
          ...s,
          tier: mapRarityToOperativeTier(s.collection, s.tokenId),
        }
      : null,
  );
}

function filledOperatives(slots: Array<PrecisionOperativeSlot | null>): PrecisionOperativeSlot[] {
  return slots.filter((s): s is PrecisionOperativeSlot => Boolean(s?.nftRef));
}

function stackOperativePerks(slots: Array<PrecisionOperativeSlot | null>) {
  const filled = filledOperatives(slots);
  if (filled.length === 0) return null;
  let extendMs = 0;
  let fragmentMult = 1;
  let missForgiveness = 0;
  for (const s of filled) {
    const p = PRECISION_OPERATIVE_PERKS[s.tier];
    extendMs += p.extendMs;
    fragmentMult = Math.max(fragmentMult, p.fragmentMult);
    missForgiveness += p.missForgiveness;
  }
  return { extendMs, fragmentMult, missForgiveness, count: filled.length };
}

function normalizeLoaded(
  address: string,
  parsed: Partial<PrecisionClickPersistedState> & { operative?: PrecisionOperativeSlot | null },
): PrecisionClickPersistedState {
  const base = createEmptyPrecisionState(address);
  const cleared = Array.isArray(parsed.clearedLevels)
    ? parsed.clearedLevels.map((n) => Math.floor(Number(n))).filter((n) => n >= 1 && n <= 10)
    : [];
  return {
    ...base,
    ...parsed,
    version: 3,
    walletAddress: address,
    inventory: {
      shard_lens: Math.max(0, Math.floor(parsed.inventory?.shard_lens ?? 0)),
      null_filter: Math.max(0, Math.floor(parsed.inventory?.null_filter ?? 0)),
    },
    ownedAddons: Array.isArray(parsed.ownedAddons) ? parsed.ownedAddons : [],
    clearedLevels: [...new Set(cleared)].sort((a, b) => a - b),
    highestClearedLevel: Math.max(
      0,
      Math.min(10, Math.floor(parsed.highestClearedLevel ?? (cleared.length ? Math.max(...cleared) : 0))),
    ),
    ariaFragments: Math.max(0, Math.floor(parsed.ariaFragments ?? 0)),
    fragmentsEarnedLifetime: Math.max(0, Math.floor(parsed.fragmentsEarnedLifetime ?? 0)),
    refinementPointsTotal: Math.max(0, Math.floor(parsed.refinementPointsTotal ?? 0)),
    booster: parsed.booster ?? null,
    operativeSlots: refreshOperativeTiers(normalizeOperativeSlots(parsed)),
    runExpiresAt: typeof parsed.runExpiresAt === 'number' ? parsed.runExpiresAt : null,
    entryUnlocked: Boolean(parsed.entryUnlocked),
  };
}

function loadState(address: string): PrecisionClickPersistedState {
  if (typeof window === 'undefined') return createEmptyPrecisionState(address);
  try {
    const raw = localStorage.getItem(storageKey(address));
    if (!raw) return createEmptyPrecisionState(address);
    return normalizeLoaded(address, JSON.parse(raw) as Partial<PrecisionClickPersistedState>);
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

function isRunActive(state: PrecisionClickPersistedState, now = Date.now()): boolean {
  return Boolean(state.entryUnlocked && state.runExpiresAt && state.runExpiresAt > now);
}

export function usePrecisionClick() {
  const { state: wallet } = useKaspaWallet();
  const { tier: krexTier, l1Balance: krexL1Balance } = useKREXBalance();
  const walletAddr = wallet.address?.trim() || '';

  const [state, setState] = useState<PrecisionClickPersistedState>(() => createEmptyPrecisionState(''));
  const [paying, setPaying] = useState(false);
  const [buyBusyId, setBuyBusyId] = useState<string | null>(null);
  const [refining, setRefining] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastSuccess, setLastSuccess] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

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

  /** Expire lock window: keep fragments, reset levels so a new entry is required. */
  const expireRunIfNeeded = useCallback(
    (prev: PrecisionClickPersistedState, now = Date.now()): PrecisionClickPersistedState => {
      if (!prev.entryUnlocked) return prev;
      if (prev.runExpiresAt != null && prev.runExpiresAt > now) return prev;
      return {
        ...prev,
        entryUnlocked: false,
        runExpiresAt: null,
        ownedAddons: [],
        clearedLevels: [],
        highestClearedLevel: 0,
      };
    },
    [],
  );

  useEffect(() => {
    const id = setInterval(() => {
      setNowTick(Date.now());
      persist((prev) => expireRunIfNeeded(prev));
    }, 15_000);
    return () => clearInterval(id);
  }, [persist, expireRunIfNeeded]);

  const liveState = useMemo(() => expireRunIfNeeded(state, nowTick), [state, nowTick, expireRunIfNeeded]);
  const runActive = isRunActive(liveState, nowTick);
  const runMsLeft = runActive && liveState.runExpiresAt ? Math.max(0, liveState.runExpiresAt - nowTick) : 0;

  const booster = useMemo(() => liveBooster(liveState), [liveState]);
  const boosterMult = booster?.mult ?? 1;

  const operativePerks = useMemo(
    () => stackOperativePerks(liveState.operativeSlots),
    [liveState.operativeSlots],
  );

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
          const paid = await payKrex({ amountKrex: payKasAmount * KREX_PER_KAS, skuId: 'precision-click:entry' });
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
        const now = Date.now();
        persist((prev) => {
          const operativeBonus = stackOperativePerks(prev.operativeSlots)?.extendMs ?? 0;
          const slots = prev.operativeSlots.map((s) => (s ? { ...s, appliedAt: now } : null));
          return {
            ...prev,
            walletAddress: walletAddr,
            entryUnlocked: true,
            entryTxHash: txHash,
            ownedAddons: [...args.addonIds],
            clearedLevels: [],
            highestClearedLevel: 0,
            runExpiresAt: now + PRECISION_CLICK_RUN_MS + operativeBonus,
            operativeSlots: slots.length ? slots : [null],
          };
        });
        setLastSuccess('Lock opened for 24h. Cleared levels reset. Finish the cascade before the timer ends.');
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
      if (def.extendRunMs && !isRunActive(liveState)) {
        setLastError('Open a lock first (pay entry) before buying Chrono Seals.');
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
          const next = expireRunIfNeeded({ ...prev, walletAddress: walletAddr || prev.walletAddress });
          if (def.boosterMult && def.durationMs) {
            next.booster = {
              mult: def.boosterMult,
              until: Date.now() + def.durationMs,
              itemId: def.id,
              txHash,
            };
          }
          if (def.extendRunMs && next.runExpiresAt) {
            next.runExpiresAt = next.runExpiresAt + def.extendRunMs * qty;
            next.entryUnlocked = true;
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
    [
      getKasPriceAfterDiscount,
      payKrex,
      payKas,
      persist,
      walletAddr,
      liveState,
      expireRunIfNeeded,
    ],
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

  /** Bank fixed clear reward only when a level is newly cleared this lock. */
  const clearLevel = useCallback(
    (levelId: number, payoutMult: number) => {
      const level = getPrecisionLevel(levelId);
      if (!level) return { ok: false as const, banked: 0 };
      if (liveState.clearedLevels.includes(levelId) || !isRunActive(liveState)) {
        return { ok: false as const, banked: 0 };
      }
      const banked = bankFragmentsForClear({
        bankReward: level.bankReward,
        levelMult: level.fragmentMult,
        addonFragmentMult: 1,
        boosterMult: payoutMult,
        operativeMult: 1,
      });
      persist((prev) => {
        const live = expireRunIfNeeded(prev);
        if (!isRunActive(live) || live.clearedLevels.includes(levelId)) return live;
        const clearedLevels = [...live.clearedLevels, levelId].sort((a, b) => a - b);
        return {
          ...live,
          clearedLevels,
          highestClearedLevel: Math.max(live.highestClearedLevel, levelId),
          ariaFragments: live.ariaFragments + banked,
          fragmentsEarnedLifetime: live.fragmentsEarnedLifetime + banked,
        };
      });
      return { ok: true as const, banked };
    },
    [persist, expireRunIfNeeded, liveState],
  );

  const setOperative = useCallback(
    (
      slotIndex: number,
      slot: Omit<PrecisionOperativeSlot, 'appliedAt' | 'tier'> & { tier?: PrecisionOperativeTier },
    ) => {
      const tier = slot.tier ?? mapRarityToOperativeTier(slot.collection, slot.tokenId);
      const perks = PRECISION_OPERATIVE_PERKS[tier];
      persist((prev) => {
        const live = expireRunIfNeeded(prev);
        const slots = [...(live.operativeSlots.length ? live.operativeSlots : [null])];
        while (slots.length <= slotIndex) slots.push(null);
        const now = Date.now();
        const prevAt = slots[slotIndex];
        const already = prevAt?.nftRef === slot.nftRef;
        let runExpiresAt = live.runExpiresAt;
        if (live.entryUnlocked && runExpiresAt && !already) {
          const prevExtend = prevAt ? PRECISION_OPERATIVE_PERKS[prevAt.tier].extendMs : 0;
          runExpiresAt = runExpiresAt - prevExtend + perks.extendMs;
        }
        slots[slotIndex] = {
          nftRef: slot.nftRef,
          collection: slot.collection,
          tokenId: slot.tokenId,
          tier,
          imageUrl: slot.imageUrl ?? null,
          appliedAt: now,
        };
        return {
          ...live,
          runExpiresAt,
          operativeSlots: slots,
        };
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kasparex-nft-usage'));
      }
      setLastSuccess(
        `Sync Operative slotted (${PRECISION_OPERATIVE_PERKS[tier].label}). Lock extended while active.`,
      );
    },
    [persist, expireRunIfNeeded],
  );

  const clearOperative = useCallback(
    (slotIndex: number) => {
      persist((prev) => {
        const slots = [...(prev.operativeSlots.length ? prev.operativeSlots : [null])];
        if (slotIndex < 0 || slotIndex >= slots.length) return prev;
        slots[slotIndex] = null;
        return { ...prev, operativeSlots: slots };
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kasparex-nft-usage'));
      }
    },
    [persist],
  );

  const purchaseOperativeSlots = useCallback(
    async (slotTypes: MiningSlotType[]) => {
      setLastError(null);
      setLastSuccess(null);
      const count = Math.max(1, slotTypes.length);
      const listKas = PRECISION_OPERATIVE_SLOT_UNLOCK_KAS * count;
      const payKasAmount = getKasPriceAfterDiscount(listKas);
      setPaying(true);
      try {
        const paid = await payKas({
          amountKas: payKasAmount,
          skuId: `precision-click:operative-slot:add:${count}`,
          purchaseType: 'other',
        });
        if (!paid.ok) {
          setLastError(paid.error);
          return false;
        }
        persist((prev) => {
          const slots = [...(prev.operativeSlots.length ? prev.operativeSlots : [null])];
          for (let i = 0; i < count; i++) slots.push(null);
          return { ...prev, operativeSlots: slots };
        });
        setLastSuccess(
          count === 1
            ? 'Extra Sync Operative slot unlocked.'
            : `${count} Sync Operative slots unlocked.`,
        );
        return true;
      } finally {
        setPaying(false);
      }
    },
    [getKasPriceAfterDiscount, payKas, persist],
  );

  const refineFragments = useCallback(
    async (amountArg: number): Promise<{ points: number; amount: number } | null> => {
      if (!walletAddr) {
        setLastError('Connect a Kaspa wallet to refine.');
        return null;
      }
      const bag = Math.floor(liveState.ariaFragments);
      const amount = Math.max(0, Math.min(bag, Math.floor(amountArg)));
      if (amount < PRECISION_CLICK_REFINE_MIN) {
        setLastError(`Refine at least ${PRECISION_CLICK_REFINE_MIN} Aria fragments.`);
        return null;
      }
      setRefining(true);
      try {
        const points = amount;
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
    [walletAddr, liveState.ariaFragments, persist],
  );

  const maxUnlockedLevel = runActive
    ? Math.min(10, liveState.highestClearedLevel + 1)
    : 0;

  const addonBundle = useMemo(() => {
    let extraTimeMs = 0;
    let fragmentBonusMult = 1;
    let missForgiveness = 0;
    for (const id of liveState.ownedAddons) {
      const def = PRECISION_ENTRY_ADDONS.find((a) => a.id === id);
      if (!def) continue;
      extraTimeMs += def.extraTimeMs ?? 0;
      fragmentBonusMult *= def.fragmentBonusMult ?? 1;
      missForgiveness += def.missForgiveness ?? 0;
    }
    if (operativePerks) {
      fragmentBonusMult *= operativePerks.fragmentMult;
      missForgiveness += operativePerks.missForgiveness;
    }
    return { extraTimeMs, fragmentBonusMult, missForgiveness };
  }, [liveState.ownedAddons, operativePerks]);

  return {
    state: liveState,
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
    runActive,
    runMsLeft,
    runExpiresAt: liveState.runExpiresAt,
    operativePerks,
    payEntry,
    buyShopItem,
    consumeRunItems,
    clearLevel,
    setOperative,
    clearOperative,
    purchaseOperativeSlots,
    operativeSlotUnlockKas: PRECISION_OPERATIVE_SLOT_UNLOCK_KAS,
    refineFragments,
    refineMin: PRECISION_CLICK_REFINE_MIN,
  };
}
