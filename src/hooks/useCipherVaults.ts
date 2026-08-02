'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { isValidKaspaAddress } from '@/lib/kaspa/sdk';
import { signKrc20Transfer } from '@/lib/kaspa/l1WalletActions';
import { payKaspaL1, recordL1Reward, verifyKaspaL1Payment } from '@/lib/games/sdk';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { usePricingSnapshot } from '@/hooks/usePricingSnapshot';
import { applyKrexFeeDiscount } from '@/lib/hub/applyKrexFeeDiscount';
import { resolveTokenAmountFromKas } from '@/lib/pricing/registry';
import { KRC20_TRANSFER_TYPE, KREX_DECIMALS } from '@/lib/game/diamond-veins-config';
import { classifyNftSlotRarity } from '@/lib/nft/nft-slot-rarity';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import type { MiningSlotType } from '@/lib/game/engine/types';
import {
  CIPHER_COVENANT_WINDOW_MS,
  CIPHER_ENTRY_ADDONS,
  CIPHER_LEVELS,
  CIPHER_REFINE_MIN,
  CIPHER_SEAL_POINTS_PER_CORRECT,
  CIPHER_VAULTS_GAME_ID,
  CIPHER_VAULTS_STORAGE_PREFIX,
  CIPHER_VAULTS_TREASURY_ADDRESS,
  CIPHER_VAULT_PASS_TIER,
  CIPHER_WARDEN_PERKS,
  CIPHER_WARDEN_SLOT_UNLOCK_KAS,
  addonListKas,
  bankFragmentsForClear,
  bundleAddons,
  getCipherLevel,
  getCipherShopItem,
  getCipherVaultTier,
  resolveCipherWardenTier,
  type CipherAddonId,
  type CipherShopItemId,
  type CipherVaultTierId,
  type CipherWardenTier,
} from '@/lib/game/cipher-vaults-config';
import {
  createInitialCipherVaultsState,
  normalizeWardenSlots,
  type CipherVaultsState,
  type CipherWardenSlot,
  type CipherActiveLevel,
} from '@/lib/game/cipher-vaults-types';
import {
  makeCipherLevelSpec,
  applyCipherMoves,
  isSolved,
  countCorrect,
  type CipherMove,
} from '@/lib/game/cipher-grid';
import {
  assertNftRefGloballyFree,
  globalNftConflictMessage,
  normalizeNftRef,
} from '@/lib/nft/kasparexMergedGlobalNftRefs';
import { syncGlobalNftSlotsForEntity } from '@/lib/nft/globalNftSlotRegistry';
import { broadcastCipherVaultsExternalPersist } from '@/lib/game/cipher-vaults-hub';
import { REDEEMABLE_BREAKDOWN_REFRESH_EVENT } from '@/lib/game/minecore/deduct-refinement-hub';

const DEFAULT_TREASURY = CIPHER_VAULTS_TREASURY_ADDRESS;
const KREX_PRIORITY_FEE_KAS = 0.001;

function storageKey(address: string) {
  return `${CIPHER_VAULTS_STORAGE_PREFIX}:${address.trim().toLowerCase()}`;
}

function makeSeed(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function mapRarityToWardenTier(collection: string, tokenId: number): CipherWardenTier {
  return resolveCipherWardenTier(collection, tokenId, classifyNftSlotRarity);
}

function refreshWardenTiers(slots: Array<CipherWardenSlot | null>): Array<CipherWardenSlot | null> {
  return slots.map((s) => (s ? { ...s, tier: mapRarityToWardenTier(s.collection, s.tokenId) } : null));
}

function filledWardens(slots: Array<CipherWardenSlot | null>): CipherWardenSlot[] {
  return slots.filter((s): s is CipherWardenSlot => Boolean(s?.nftRef));
}

function stackWardenPerks(slots: Array<CipherWardenSlot | null>) {
  const filled = filledWardens(slots);
  if (filled.length === 0) {
    return { extraMoves: 0, extraTimeMs: 0, fragmentMult: 1, covenantExtendMs: 0, count: 0 };
  }
  let extraMoves = 0;
  let extraTimeMs = 0;
  let fragmentMult = 1;
  let covenantExtendMs = 0;
  for (const s of filled) {
    const p = CIPHER_WARDEN_PERKS[s.tier];
    extraMoves += p.extraMoves;
    extraTimeMs += p.extraTimeMs;
    fragmentMult = Math.max(fragmentMult, p.fragmentMult);
    covenantExtendMs += p.covenantExtendMs;
  }
  return { extraMoves, extraTimeMs, fragmentMult, covenantExtendMs, count: filled.length };
}

function isCovenantActive(state: CipherVaultsState, now = Date.now()): boolean {
  return Boolean(state.entryUnlocked && state.covenantExpiresAt && state.covenantExpiresAt > now);
}

function normalizeLoaded(address: string, parsed: Partial<CipherVaultsState>): CipherVaultsState {
  const base = createInitialCipherVaultsState(address);
  const cleared = Array.isArray(parsed.clearedLevels)
    ? parsed.clearedLevels.map((n) => Math.floor(Number(n))).filter((n) => n >= 1 && n <= 8)
    : [];
  const highest = Math.max(
    0,
    Math.floor(parsed.highestClearedLevel ?? (cleared.length ? Math.max(...cleared) : 0)),
  );
  return {
    ...base,
    ...parsed,
    version: 3,
    walletAddress: address,
    activeRun: null,
    inventory: {
      rune_hint: Math.max(0, Math.floor(parsed.inventory?.rune_hint ?? 0)),
      vault_pass: Math.max(0, Math.floor(parsed.inventory?.vault_pass ?? 0)),
    },
    ownedAddons: Array.isArray(parsed.ownedAddons) ? parsed.ownedAddons : [],
    cipherFragments: Math.max(0, Math.floor(parsed.cipherFragments ?? 0)),
    fragmentsEarnedLifetime: Math.max(0, Math.floor(parsed.fragmentsEarnedLifetime ?? 0)),
    refinementPointsTotal: Math.max(0, Math.floor(parsed.refinementPointsTotal ?? 0)),
    sealPoints: Math.max(0, Math.floor(parsed.sealPoints ?? 0)),
    booster: parsed.booster ?? null,
    wardenSlots: refreshWardenTiers(normalizeWardenSlots(parsed)),
    ledger: Array.isArray(parsed.ledger) ? parsed.ledger : [],
    entryUnlocked: Boolean(parsed.entryUnlocked),
    entryTxHash: parsed.entryTxHash,
    vaultTierId: parsed.vaultTierId ?? null,
    covenantExpiresAt: typeof parsed.covenantExpiresAt === 'number' ? parsed.covenantExpiresAt : null,
    clearedLevels: [...new Set(cleared)].sort((a, b) => a - b),
    highestClearedLevel: highest,
    retriesLeft: Math.max(0, Math.floor(parsed.retriesLeft ?? 0)),
    fragmentMult: Math.max(0.01, Number(parsed.fragmentMult ?? 1) || 1),
    activeLevel: parsed.activeLevel ?? null,
    redeemedRefinementPointsTotal: Math.max(0, Math.floor(parsed.redeemedRefinementPointsTotal ?? 0)),
    ticketsSpent: Math.max(0, Math.floor(parsed.ticketsSpent ?? 0)),
  };
}

function loadState(address: string): CipherVaultsState {
  if (typeof window === 'undefined') return createInitialCipherVaultsState(address);
  try {
    const raw = localStorage.getItem(storageKey(address));
    if (!raw) return createInitialCipherVaultsState(address);
    return normalizeLoaded(address, JSON.parse(raw) as Partial<CipherVaultsState>);
  } catch {
    return createInitialCipherVaultsState(address);
  }
}

function saveState(state: CipherVaultsState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(storageKey(state.walletAddress), JSON.stringify({ ...state, updatedAt: Date.now() }));
    syncGlobalNftSlotsForEntity({
      wallet: state.walletAddress,
      entityType: 'cipher-vaults',
      entityId: 'cipher-warden',
      href: '/games/cipher-vaults',
      labelFor: (idx) => `Cipher Vaults · Cipher Warden #${idx + 1}`,
      slots: state.wardenSlots ?? [],
    });
  } catch {
    // ignore
  }
}

function boosterMultNow(booster: CipherVaultsState['booster']): number {
  if (!booster || booster.until <= Date.now()) return 1;
  return booster.mult;
}

function buildActiveLevel(args: {
  levelId: number;
  seed: string;
  extraMoves: number;
  extraTimeMs: number;
  wardenMoves: number;
  wardenTimeMs: number;
}): CipherActiveLevel | null {
  const level = getCipherLevel(args.levelId);
  if (!level) return null;
  const now = Date.now();
  const spec = makeCipherLevelSpec({
    seed: args.seed,
    size: level.size,
    scrambleDepth: level.scrambleDepth,
    fogCount: level.fogCount,
  });
  return {
    levelId: level.id,
    seed: args.seed,
    startedAt: now,
    solveExpiresAt: now + level.timeLimitMs + args.extraTimeMs + args.wardenTimeMs,
    moveLimit: level.moveLimit + args.extraMoves + args.wardenMoves,
    size: spec.size,
    initial: spec.initial,
    target: spec.target,
    fogHidden: spec.fogHidden,
  };
}

export function useCipherVaults() {
  const { state: wallet } = useKaspaWallet();
  const walletAddr = wallet.address?.trim() || '';
  const { tier, l1Balance: krexL1Balance } = useKREXBalance();
  const { snapshot: pricingSnapshot } = usePricingSnapshot(['KREX']);

  const [state, setState] = useState<CipherVaultsState>(() =>
    walletAddr ? loadState(walletAddr) : createInitialCipherVaultsState(),
  );
  const [paying, setPaying] = useState(false);
  const [buyBusyId, setBuyBusyId] = useState<string | null>(null);
  const [refining, setRefining] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastSuccess, setLastSuccess] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    if (!walletAddr) {
      setState(createInitialCipherVaultsState());
      return;
    }
    setState(loadState(walletAddr));
  }, [walletAddr]);

  const persist = useCallback((updater: (prev: CipherVaultsState) => CipherVaultsState) => {
    setState((prev) => {
      const next = updater(prev);
      if (next.walletAddress) saveState(next);
      return next;
    });
  }, []);

  /** Expire covenant: keep bag/inventory, reset ladder so a new entry is required. */
  const expireCovenantIfNeeded = useCallback(
    (prev: CipherVaultsState, now = Date.now()): CipherVaultsState => {
      if (!prev.entryUnlocked) return prev;
      if (prev.covenantExpiresAt != null && prev.covenantExpiresAt > now) return prev;
      return {
        ...prev,
        entryUnlocked: false,
        covenantExpiresAt: null,
        vaultTierId: null,
        ownedAddons: [],
        clearedLevels: [],
        highestClearedLevel: 0,
        retriesLeft: 0,
        fragmentMult: 1,
        activeLevel: null,
        entryTxHash: undefined,
      };
    },
    [],
  );

  useEffect(() => {
    const id = setInterval(() => {
      setNowTick(Date.now());
      persist((prev) => expireCovenantIfNeeded(prev));
    }, 1000);
    return () => clearInterval(id);
  }, [persist, expireCovenantIfNeeded]);

  const liveState = useMemo(() => expireCovenantIfNeeded(state, nowTick), [state, nowTick, expireCovenantIfNeeded]);

  const getKasPriceAfterDiscount = useCallback(
    (listKas: number) => applyKrexFeeDiscount(listKas, tier),
    [tier],
  );

  const liveBoosterMult = boosterMultNow(liveState.booster);
  const wardenStack = useMemo(() => stackWardenPerks(liveState.wardenSlots), [liveState.wardenSlots]);
  const addonBundle = useMemo(() => bundleAddons(liveState.ownedAddons), [liveState.ownedAddons]);

  const covenantActive = isCovenantActive(liveState, nowTick);
  const runActive = covenantActive;
  const covenantMsLeft =
    covenantActive && liveState.covenantExpiresAt
      ? Math.max(0, liveState.covenantExpiresAt - nowTick)
      : 0;
  const activeLevelSolveMsLeft = liveState.activeLevel
    ? Math.max(0, liveState.activeLevel.solveExpiresAt - nowTick)
    : 0;

  const vaultDef = liveState.vaultTierId ? getCipherVaultTier(liveState.vaultTierId) : undefined;
  const maxUnlockedLevel = !covenantActive
    ? 0
    : Math.min(vaultDef?.maxLevel ?? 1, Math.max(1, liveState.highestClearedLevel + 1));

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
        gameId: CIPHER_VAULTS_GAME_ID,
        skuId: args.skuId,
        purchaseType: args.purchaseType,
      });
      if (!pay.ok) return { ok: false as const, error: pay.error };
      void recordL1Reward({
        userAddress: walletAddr,
        dappId: CIPHER_VAULTS_GAME_ID,
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
        gameId: CIPHER_VAULTS_GAME_ID,
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
      const treasury = (
        process.env.NEXT_PUBLIC_KREX_BOOSTER_TREASURY_ADDRESS || DEFAULT_TREASURY
      ).trim();
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
          dappId: CIPHER_VAULTS_GAME_ID,
          actionType: 'game_purchase',
          actionValue: args.amountKrex,
          txHash,
          network: 'L1',
        }).catch(() => {});
        return { ok: true as const, txHash };
      } catch (err) {
        return {
          ok: false as const,
          error: err instanceof Error ? err.message : 'KREX transfer failed.',
        };
      }
    },
    [wallet.isConnected, wallet.provider, walletAddr, krexL1Balance],
  );

  const startVault = useCallback(
    async (args: {
      tierId: CipherVaultTierId;
      addonIds: CipherAddonId[];
      currency: 'KAS' | 'KREX' | 'VAULT_PASS';
    }) => {
      setLastError(null);
      setLastSuccess(null);
      if (!walletAddr) {
        setLastError('Connect a Kaspa wallet first.');
        return false;
      }
      const tierDef = getCipherVaultTier(args.tierId);
      if (!tierDef) {
        setLastError('Unknown vault.');
        return false;
      }

      const addons = bundleAddons(args.addonIds);
      const listTotal = tierDef.entryKAS + addonListKas(args.addonIds);
      const payKasAmount = getKasPriceAfterDiscount(listTotal);
      const fragmentMult = tierDef.fragmentMult * addons.fragmentBonusMult;
      const now = Date.now();
      const covenantExpiresAt = now + CIPHER_COVENANT_WINDOW_MS + wardenStack.covenantExtendMs;

      setPaying(true);
      try {
        let txHash = '';
        let paidBy: 'KAS' | 'KREX' | 'VAULT_PASS' = args.currency;

        if (args.currency === 'VAULT_PASS') {
          if (args.tierId !== CIPHER_VAULT_PASS_TIER) {
            setLastError('Vault Pass only opens Seal Fragment covenants.');
            return false;
          }
          if (args.addonIds.length > 0) {
            setLastError('Vault Pass cannot include paid add-ons. Pay with KAS/KREX for add-ons.');
            return false;
          }
          if (liveState.inventory.vault_pass <= 0) {
            setLastError('No Vault Pass in inventory. Buy one in the Shop.');
            return false;
          }
          paidBy = 'VAULT_PASS';
        } else if (args.currency === 'KREX') {
          let amountKrex: number;
          try {
            amountKrex = resolveTokenAmountFromKas(payKasAmount, 'KREX', pricingSnapshot);
          } catch (e) {
            setLastError(e instanceof Error ? e.message : 'KREX rate unavailable.');
            return false;
          }
          const paid = await payKrex({ amountKrex, skuId: `cipher-vaults:entry:${args.tierId}` });
          if (!paid.ok) {
            setLastError(paid.error);
            return false;
          }
          txHash = paid.txHash;
        } else {
          const paid = await payKas({
            amountKas: payKasAmount,
            skuId: `cipher-vaults:entry:${args.tierId}`,
            purchaseType: 'entry',
          });
          if (!paid.ok) {
            setLastError(paid.error);
            return false;
          }
          txHash = paid.txHash;
        }

        persist((prev) => {
          const slots = prev.wardenSlots.map((s) => (s ? { ...s, appliedAt: now } : null));
          return {
            ...prev,
            walletAddress: walletAddr,
            entryUnlocked: true,
            entryTxHash: txHash || prev.entryTxHash,
            vaultTierId: args.tierId,
            covenantExpiresAt,
            clearedLevels: [],
            highestClearedLevel: 0,
            activeLevel: null,
            ownedAddons: [...args.addonIds],
            retriesLeft: addons.retryCharge,
            fragmentMult,
            wardenSlots: slots.length ? slots : [null],
            inventory:
              paidBy === 'VAULT_PASS'
                ? { ...prev.inventory, vault_pass: Math.max(0, prev.inventory.vault_pass - 1) }
                : prev.inventory,
          };
        });
        setLastSuccess(
          `${tierDef.label} covenant opened for ${Math.round(CIPHER_COVENANT_WINDOW_MS / 3_600_000)}h. Clear levels before the window ends.`,
        );
        return true;
      } finally {
        setPaying(false);
      }
    },
    [
      walletAddr,
      liveState.inventory.vault_pass,
      getKasPriceAfterDiscount,
      wardenStack.covenantExtendMs,
      payKrex,
      payKas,
      pricingSnapshot,
      persist,
    ],
  );

  const startLevel = useCallback(
    (levelId: number): boolean => {
      setLastError(null);
      setLastSuccess(null);
      const live = expireCovenantIfNeeded(liveState);
      if (!isCovenantActive(live)) {
        setLastError('Open a vault covenant first.');
        return false;
      }
      if (live.activeLevel) {
        setLastError('Finish or abandon the current level first.');
        return false;
      }
      const vault = live.vaultTierId ? getCipherVaultTier(live.vaultTierId) : undefined;
      if (!vault) {
        setLastError('No vault class on this covenant.');
        return false;
      }
      const level = getCipherLevel(levelId);
      if (!level) {
        setLastError('Unknown level.');
        return false;
      }
      if (levelId > vault.maxLevel) {
        setLastError(`${vault.label} only unlocks levels 1–${vault.maxLevel}.`);
        return false;
      }
      if (live.clearedLevels.includes(levelId)) {
        setLastError('That level is already cleared this covenant.');
        return false;
      }
      const unlocked = levelId === 1 || live.clearedLevels.includes(levelId - 1);
      if (!unlocked) {
        setLastError('Clear the previous level first.');
        return false;
      }

      const addons = bundleAddons(live.ownedAddons);
      const wardens = stackWardenPerks(live.wardenSlots);
      const active = buildActiveLevel({
        levelId,
        seed: makeSeed(),
        extraMoves: addons.extraMoves,
        extraTimeMs: addons.extraTimeMs,
        wardenMoves: wardens.extraMoves,
        wardenTimeMs: wardens.extraTimeMs,
      });
      if (!active) {
        setLastError('Failed to generate level.');
        return false;
      }
      persist((prev) => ({ ...expireCovenantIfNeeded(prev), activeLevel: active }));
      setLastSuccess(`${level.name} started. Solve before the timer ends.`);
      return true;
    },
    [liveState, expireCovenantIfNeeded, persist],
  );

  const submitLevel = useCallback(
    (moves: CipherMove[]): { ok: boolean; banked: number } => {
      setLastError(null);
      setLastSuccess(null);
      const live = expireCovenantIfNeeded(liveState);
      if (!isCovenantActive(live) || !live.activeLevel) {
        setLastError('No active level to submit.');
        return { ok: false, banked: 0 };
      }
      const active = live.activeLevel;
      const level = getCipherLevel(active.levelId);
      const vault = live.vaultTierId ? getCipherVaultTier(live.vaultTierId) : undefined;
      if (!level || !vault) {
        setLastError('Level or vault missing.');
        return { ok: false, banked: 0 };
      }
      if (live.clearedLevels.includes(active.levelId)) {
        setLastError('Level already cleared.');
        return { ok: false, banked: 0 };
      }
      if (Date.now() > active.solveExpiresAt) {
        setLastError('Solve timer expired.');
        return { ok: false, banked: 0 };
      }
      if (moves.length > active.moveLimit) {
        setLastError(`Move limit exceeded (${active.moveLimit}).`);
        return { ok: false, banked: 0 };
      }

      const finalGrid = applyCipherMoves(active.initial, active.size, moves);
      if (!isSolved(finalGrid, active.target)) {
        setLastError('Grid is not sealed yet.');
        return { ok: false, banked: 0 };
      }

      const correctCount = countCorrect(finalGrid, active.target);
      void correctCount;
      const banked = bankFragmentsForClear({
        bankReward: level.bankReward,
        vaultMult: live.fragmentMult,
        addonFragmentMult: 1,
        boosterMult: liveBoosterMult,
        wardenMult: wardenStack.fragmentMult,
      });

      const entryId =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `cv-${Date.now()}-${active.levelId}`;

      persist((prev) => {
        const cur = expireCovenantIfNeeded(prev);
        if (!cur.activeLevel || cur.clearedLevels.includes(active.levelId)) return cur;
        const clearedLevels = [...cur.clearedLevels, active.levelId].sort((a, b) => a - b);
        return {
          ...cur,
          activeLevel: null,
          clearedLevels,
          highestClearedLevel: Math.max(cur.highestClearedLevel, active.levelId),
          cipherFragments: cur.cipherFragments + banked,
          fragmentsEarnedLifetime: cur.fragmentsEarnedLifetime + banked,
          ledger: [
            {
              id: entryId,
              levelId: active.levelId,
              tierId: vault.id,
              solvedAt: Date.now(),
              moves: moves.length,
              moveLimit: active.moveLimit,
              fragmentsBanked: banked,
              sealPointsEarned: correctCount * CIPHER_SEAL_POINTS_PER_CORRECT,
              entryTxHash: cur.entryTxHash,
            },
            ...cur.ledger,
          ].slice(0, 100),
        };
      });
      setLastSuccess(
        banked > 0
          ? `Level ${active.levelId} cleared. +${banked.toLocaleString()} Cipher Fragments banked.`
          : `Level ${active.levelId} cleared.`,
      );
      return { ok: true, banked };
    },
    [liveState, expireCovenantIfNeeded, liveBoosterMult, wardenStack.fragmentMult, persist],
  );

  const abandonLevel = useCallback(() => {
    persist((prev) => {
      const live = expireCovenantIfNeeded(prev);
      if (!live.activeLevel) return live;
      return { ...live, activeLevel: null };
    });
    setLastSuccess('Level abandoned. Covenant stays open.');
  }, [persist, expireCovenantIfNeeded]);

  const addSealPoints = useCallback(
    (delta: number) => {
      const n = Math.floor(delta);
      if (n <= 0) return;
      persist((prev) => ({ ...prev, sealPoints: prev.sealPoints + n }));
    },
    [persist],
  );

  const retryLevel = useCallback((): boolean => {
    setLastError(null);
    setLastSuccess(null);
    const live = expireCovenantIfNeeded(liveState);
    if (!isCovenantActive(live)) {
      setLastError('Covenant is closed.');
      return false;
    }
    const levelId = live.activeLevel?.levelId;
    if (levelId == null) {
      setLastError('No active level to retry.');
      return false;
    }
    if (live.retriesLeft <= 0) {
      setLastError('No Second Seal retries left.');
      return false;
    }
    const addons = bundleAddons(live.ownedAddons);
    const wardens = stackWardenPerks(live.wardenSlots);
    const active = buildActiveLevel({
      levelId,
      seed: makeSeed(),
      extraMoves: addons.extraMoves,
      extraTimeMs: addons.extraTimeMs,
      wardenMoves: wardens.extraMoves,
      wardenTimeMs: wardens.extraTimeMs,
    });
    if (!active) {
      setLastError('Failed to regenerate level.');
      return false;
    }
    persist((prev) => {
      const cur = expireCovenantIfNeeded(prev);
      if (cur.retriesLeft <= 0) return cur;
      return {
        ...cur,
        retriesLeft: cur.retriesLeft - 1,
        activeLevel: active,
      };
    });
    setLastSuccess('Second Seal used. Fresh attempt on the same level.');
    return true;
  }, [liveState, expireCovenantIfNeeded, persist]);

  const buyShopItem = useCallback(
    async (args: { itemId: CipherShopItemId; currency: 'KAS' | 'KREX'; quantity?: number }) => {
      setLastError(null);
      setLastSuccess(null);
      const def = getCipherShopItem(args.itemId);
      if (!def) {
        setLastError('Unknown shop item.');
        return false;
      }
      if (def.extendCovenantMs && !isCovenantActive(liveState)) {
        setLastError('Open a vault covenant first before buying Chrono Seals.');
        return false;
      }
      const qty = Math.max(1, Math.floor(args.quantity ?? 1));
      const listKas = def.listKas * qty;
      const payKasAmount = getKasPriceAfterDiscount(listKas);
      setBuyBusyId(args.itemId);
      try {
        let txHash = '';
        if (args.currency === 'KREX') {
          let amountKrex: number;
          try {
            amountKrex = resolveTokenAmountFromKas(payKasAmount, 'KREX', pricingSnapshot);
          } catch (e) {
            setLastError(e instanceof Error ? e.message : 'KREX rate unavailable.');
            return false;
          }
          const paid = await payKrex({
            amountKrex,
            skuId: `cipher-vaults:shop:${args.itemId}`,
          });
          if (!paid.ok) {
            setLastError(paid.error);
            return false;
          }
          txHash = paid.txHash;
        } else {
          const paid = await payKas({
            amountKas: payKasAmount,
            skuId: `cipher-vaults:shop:${args.itemId}`,
            purchaseType: def.boosterMult ? 'boost' : 'other',
          });
          if (!paid.ok) {
            setLastError(paid.error);
            return false;
          }
          txHash = paid.txHash;
        }

        persist((prev) => {
          const next = expireCovenantIfNeeded({
            ...prev,
            walletAddress: walletAddr || prev.walletAddress,
          });
          if (def.boosterMult && def.durationMs) {
            next.booster = {
              mult: def.boosterMult,
              until: Date.now() + def.durationMs,
              itemId: def.id,
              txHash,
            };
          }
          if (def.extendCovenantMs && next.covenantExpiresAt) {
            next.covenantExpiresAt =
              Math.max(next.covenantExpiresAt, Date.now()) + def.extendCovenantMs * qty;
            next.entryUnlocked = true;
          }
          if (def.effect === 'rune_hint') {
            next.inventory = {
              ...next.inventory,
              rune_hint: next.inventory.rune_hint + (def.charges ?? 1) * qty,
            };
          }
          if (def.effect === 'vault_pass') {
            next.inventory = {
              ...next.inventory,
              vault_pass: next.inventory.vault_pass + (def.charges ?? 1) * qty,
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
      liveState,
      getKasPriceAfterDiscount,
      payKrex,
      payKas,
      pricingSnapshot,
      persist,
      walletAddr,
      expireCovenantIfNeeded,
    ],
  );

  const consumeRuneHint = useCallback(() => {
    let ok = false;
    persist((prev) => {
      if (prev.inventory.rune_hint <= 0) return prev;
      ok = true;
      return {
        ...prev,
        inventory: { ...prev.inventory, rune_hint: prev.inventory.rune_hint - 1 },
      };
    });
    return ok;
  }, [persist]);

  const setWarden = useCallback(
    (
      slotIndex: number,
      slot: Omit<CipherWardenSlot, 'appliedAt' | 'tier'> & { tier?: CipherWardenTier },
    ) => {
      const nftRef = normalizeNftRef(slot.nftRef || `${slot.collection}#${slot.tokenId}`);
      const exclusivity = assertNftRefGloballyFree({
        payerKaspa: walletAddr,
        collection: slot.collection,
        tokenId: slot.tokenId,
        exclude: { entityType: 'cipher-vaults', entityId: 'cipher-warden', slotIndex },
        cipherWardenSlots: state.wardenSlots,
      });
      if (!exclusivity.ok) {
        setLastError(globalNftConflictMessage(exclusivity.usedIn));
        return;
      }
      const wTier = slot.tier ?? mapRarityToWardenTier(slot.collection, slot.tokenId);
      const perks = CIPHER_WARDEN_PERKS[wTier];
      persist((prev) => {
        const live = expireCovenantIfNeeded(prev);
        const slots = [...(live.wardenSlots.length ? live.wardenSlots : [null])];
        while (slots.length <= slotIndex) slots.push(null);
        const now = Date.now();
        const prevAt = slots[slotIndex];
        const already = prevAt?.nftRef === nftRef;
        let covenantExpiresAt = live.covenantExpiresAt;
        if (live.entryUnlocked && covenantExpiresAt && !already) {
          const prevExtend = prevAt ? CIPHER_WARDEN_PERKS[prevAt.tier].covenantExtendMs : 0;
          covenantExpiresAt = covenantExpiresAt - prevExtend + perks.covenantExtendMs;
        }
        slots[slotIndex] = {
          nftRef,
          collection: String(slot.collection).trim().toUpperCase(),
          tokenId: slot.tokenId,
          tier: wTier,
          imageUrl: slot.imageUrl ?? null,
          appliedAt: now,
        };
        let activeLevel = live.activeLevel;
        if (activeLevel && !already) {
          const prevMoves = prevAt ? CIPHER_WARDEN_PERKS[prevAt.tier].extraMoves : 0;
          const prevTime = prevAt ? CIPHER_WARDEN_PERKS[prevAt.tier].extraTimeMs : 0;
          activeLevel = {
            ...activeLevel,
            moveLimit: Math.max(8, activeLevel.moveLimit - prevMoves + perks.extraMoves),
            solveExpiresAt: activeLevel.solveExpiresAt - prevTime + perks.extraTimeMs,
          };
        }
        return {
          ...live,
          wardenSlots: slots,
          covenantExpiresAt: covenantExpiresAt ?? live.covenantExpiresAt,
          activeLevel,
        };
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kasparex-nft-usage'));
      }
      setLastError(null);
      setLastSuccess(`Cipher Warden slotted (${CIPHER_WARDEN_PERKS[wTier].label}).`);
    },
    [persist, expireCovenantIfNeeded, walletAddr, state.wardenSlots],
  );

  const clearWarden = useCallback(
    (slotIndex: number) => {
      persist((prev) => {
        const live = expireCovenantIfNeeded(prev);
        const slots = [...(live.wardenSlots.length ? live.wardenSlots : [null])];
        if (slotIndex < 0 || slotIndex >= slots.length) return live;
        const removed = slots[slotIndex];
        slots[slotIndex] = null;
        let covenantExpiresAt = live.covenantExpiresAt;
        if (removed && live.entryUnlocked && typeof covenantExpiresAt === 'number') {
          covenantExpiresAt = covenantExpiresAt - CIPHER_WARDEN_PERKS[removed.tier].covenantExtendMs;
        }
        let activeLevel = live.activeLevel;
        if (removed && activeLevel) {
          const perks = CIPHER_WARDEN_PERKS[removed.tier];
          activeLevel = {
            ...activeLevel,
            moveLimit: Math.max(8, activeLevel.moveLimit - perks.extraMoves),
            solveExpiresAt: activeLevel.solveExpiresAt - perks.extraTimeMs,
          };
        }
        return expireCovenantIfNeeded({ ...live, wardenSlots: slots, covenantExpiresAt, activeLevel });
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kasparex-nft-usage'));
      }
    },
    [persist, expireCovenantIfNeeded],
  );

  const purchaseWardenSlots = useCallback(
    async (slotTypes: MiningSlotType[]) => {
      setLastError(null);
      setLastSuccess(null);
      const count = Math.max(1, slotTypes.length);
      const listKas = CIPHER_WARDEN_SLOT_UNLOCK_KAS * count;
      const payKasAmount = getKasPriceAfterDiscount(listKas);
      setPaying(true);
      try {
        const paid = await payKas({
          amountKas: payKasAmount,
          skuId: `cipher-vaults:warden-slot:add:${count}`,
          purchaseType: 'other',
        });
        if (!paid.ok) {
          setLastError(paid.error);
          return false;
        }
        persist((prev) => {
          const slots = [...(prev.wardenSlots.length ? prev.wardenSlots : [null])];
          for (let i = 0; i < count; i++) slots.push(null);
          return { ...prev, wardenSlots: slots };
        });
        setLastSuccess(
          count === 1 ? 'Extra Cipher Warden slot unlocked.' : `${count} Cipher Warden slots unlocked.`,
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
      const bag = Math.floor(liveState.cipherFragments);
      const amount = Math.max(0, Math.min(bag, Math.floor(amountArg)));
      if (amount < CIPHER_REFINE_MIN) {
        setLastError(`Refine at least ${CIPHER_REFINE_MIN} Cipher Fragments.`);
        return null;
      }
      setRefining(true);
      try {
        const points = amount;
        const syntheticTx =
          typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function'
            ? Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
                b.toString(16).padStart(2, '0'),
              ).join('')
            : `${Date.now()}`.padStart(64, '0');

        void recordL1Reward({
          txHash: syntheticTx,
          userAddress: walletAddr,
          dappId: CIPHER_VAULTS_GAME_ID,
          actionType: 'refine',
          actionValue: points,
          network: 'L1',
        }).catch(() => {});

        persist((prev) => ({
          ...prev,
          cipherFragments: Math.max(0, prev.cipherFragments - amount),
          refinementPointsTotal: prev.refinementPointsTotal + points,
        }));
        broadcastCipherVaultsExternalPersist();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event(REDEEMABLE_BREAKDOWN_REFRESH_EVENT));
        }
        setLastSuccess(
          `Refined ${amount.toLocaleString()} fragments → ${points.toLocaleString()} Hub points on /rewards.`,
        );
        return { points, amount };
      } finally {
        setRefining(false);
      }
    },
    [walletAddr, liveState.cipherFragments, persist],
  );

  const bankPreview = useCallback(
    (tierId: CipherVaultTierId, addonIds: CipherAddonId[]) => {
      const tierDef = getCipherVaultTier(tierId);
      if (!tierDef) return 0;
      const addons = bundleAddons(addonIds);
      let total = 0;
      for (const level of CIPHER_LEVELS) {
        if (level.id > tierDef.maxLevel) break;
        total += bankFragmentsForClear({
          bankReward: level.bankReward,
          vaultMult: tierDef.fragmentMult,
          addonFragmentMult: addons.fragmentBonusMult,
          boosterMult: liveBoosterMult,
          wardenMult: wardenStack.fragmentMult,
        });
      }
      return total;
    },
    [liveBoosterMult, wardenStack.fragmentMult],
  );

  const canPayWithL1 =
    wallet.isConnected && (wallet.provider === 'kasware' || wallet.provider === 'kastle');

  return {
    state: liveState,
    walletConnected: Boolean(wallet.isConnected && walletAddr),
    walletAddr,
    paying,
    buyBusyId,
    refining,
    lastError,
    lastSuccess,
    clearNotices: () => {
      setLastError(null);
      setLastSuccess(null);
    },
    canPayWithL1,
    runActive,
    covenantActive,
    covenantMsLeft,
    activeLevelSolveMsLeft,
    maxUnlockedLevel,
    boosterMult: liveBoosterMult,
    wardenStack,
    addonBundle,
    levels: CIPHER_LEVELS,
    entryAddons: CIPHER_ENTRY_ADDONS,
    refineMin: CIPHER_REFINE_MIN,
    wardenSlotUnlockKas: CIPHER_WARDEN_SLOT_UNLOCK_KAS,
    getKasPriceAfterDiscount,
    bankPreview,
    startVault,
    startLevel,
    submitLevel,
    abandonLevel,
    addSealPoints,
    retryLevel,
    buyShopItem,
    consumeRuneHint,
    setWarden,
    clearWarden,
    purchaseWardenSlots,
    refineFragments,
  };
}
