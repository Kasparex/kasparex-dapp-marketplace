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
  CIPHER_REFINE_MIN,
  CIPHER_VAULTS_GAME_ID,
  CIPHER_VAULTS_STORAGE_PREFIX,
  CIPHER_VAULTS_TREASURY_ADDRESS,
  CIPHER_VAULT_PASS_TIER,
  CIPHER_WARDEN_PERKS,
  CIPHER_WARDEN_SLOT_UNLOCK_KAS,
  addonListKas,
  bankFragmentsForClear,
  bundleAddons,
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
  type CipherRun,
  type CipherVaultsState,
  type CipherWardenSlot,
} from '@/lib/game/cipher-vaults-types';

const DEFAULT_TREASURY = CIPHER_VAULTS_TREASURY_ADDRESS;
const KREX_PRIORITY_FEE_KAS = 0.001;

function storageKey(address: string) {
  return `${CIPHER_VAULTS_STORAGE_PREFIX}:${address.trim().toLowerCase()}`;
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

function normalizeLoaded(address: string, parsed: Partial<CipherVaultsState>): CipherVaultsState {
  const base = createInitialCipherVaultsState(address);
  return {
    ...base,
    ...parsed,
    version: 2,
    walletAddress: address,
    inventory: {
      rune_hint: Math.max(0, Math.floor(parsed.inventory?.rune_hint ?? 0)),
      vault_pass: Math.max(0, Math.floor(parsed.inventory?.vault_pass ?? 0)),
    },
    ownedAddons: Array.isArray(parsed.ownedAddons) ? parsed.ownedAddons : [],
    cipherFragments: Math.max(0, Math.floor(parsed.cipherFragments ?? 0)),
    fragmentsEarnedLifetime: Math.max(0, Math.floor(parsed.fragmentsEarnedLifetime ?? 0)),
    refinementPointsTotal: Math.max(0, Math.floor(parsed.refinementPointsTotal ?? 0)),
    booster: parsed.booster ?? null,
    wardenSlots: refreshWardenTiers(normalizeWardenSlots(parsed)),
    activeRun: parsed.activeRun ?? null,
    ledger: Array.isArray(parsed.ledger) ? parsed.ledger : [],
    covenantExpiresAt: typeof parsed.covenantExpiresAt === 'number' ? parsed.covenantExpiresAt : null,
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

function saveState(address: string, state: CipherVaultsState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(storageKey(address), JSON.stringify({ ...state, updatedAt: Date.now() }));
  } catch {
    // ignore
  }
}

function boosterMultNow(booster: CipherVaultsState['booster']): number {
  if (!booster || booster.until <= Date.now()) return 1;
  return booster.mult;
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
  const [puzzle, setPuzzle] = useState<{
    size: number;
    initial: number[];
    target: number[];
    moveLimit: number;
  } | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    if (!walletAddr) {
      setState(createInitialCipherVaultsState());
      setPuzzle(null);
      return;
    }
    setState(loadState(walletAddr));
  }, [walletAddr]);

  useEffect(() => {
    if (!walletAddr) return;
    saveState(walletAddr, state);
  }, [state, walletAddr]);

  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const persist = useCallback((updater: (prev: CipherVaultsState) => CipherVaultsState) => {
    setState((prev) => {
      const next = updater(prev);
      return { ...next, updatedAt: Date.now() };
    });
  }, []);

  const getKasPriceAfterDiscount = useCallback(
    (listKas: number) => applyKrexFeeDiscount(listKas, tier),
    [tier],
  );

  const liveBoosterMult = boosterMultNow(state.booster);
  const wardenStack = useMemo(() => stackWardenPerks(state.wardenSlots), [state.wardenSlots]);

  const runActive = Boolean(
    state.activeRun &&
      state.activeRun.solveExpiresAt > nowTick &&
      state.activeRun.covenantExpiresAt > nowTick,
  );
  const solveMsLeft = state.activeRun
    ? Math.max(0, state.activeRun.solveExpiresAt - nowTick)
    : 0;
  const covenantMsLeft = state.activeRun
    ? Math.max(0, state.activeRun.covenantExpiresAt - nowTick)
    : state.covenantExpiresAt
      ? Math.max(0, state.covenantExpiresAt - nowTick)
      : 0;

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

  const syncActiveRunFromServer = useCallback(async () => {
    if (!walletAddr) return null;
    try {
      const r = await fetch(`/api/games/cipher-vaults/run/current?address=${encodeURIComponent(walletAddr)}`);
      const j = (await r.json()) as {
        ok?: boolean;
        run?: CipherRun;
        puzzle?: { size: number; initial: number[]; target: number[]; moveLimit: number };
        state?: CipherVaultsState;
      };
      if (!j?.ok || !j.run) {
        setPuzzle(null);
        persist((prev) => ({ ...prev, activeRun: null }));
        return null;
      }
      persist((prev) => ({
        ...prev,
        activeRun: j.run!,
        ...(j.state
          ? {
              ledger: j.state.ledger ?? prev.ledger,
              cipherFragments: j.state.cipherFragments ?? prev.cipherFragments,
              fragmentsEarnedLifetime: j.state.fragmentsEarnedLifetime ?? prev.fragmentsEarnedLifetime,
            }
          : {}),
      }));
      if (j.puzzle) setPuzzle(j.puzzle);
      return j;
    } catch {
      return null;
    }
  }, [walletAddr, persist]);

  useEffect(() => {
    if (!walletAddr) return;
    void syncActiveRunFromServer();
  }, [walletAddr, syncActiveRunFromServer]);

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
      if (state.activeRun && state.activeRun.solveExpiresAt > Date.now()) {
        setLastError('You already have an active vault. Finish or end it before paying again.');
        return false;
      }

      const addons = bundleAddons(args.addonIds);
      const listTotal = tierDef.entryKAS + addonListKas(args.addonIds);
      const payKasAmount = getKasPriceAfterDiscount(listTotal);
      const moveLimit = tierDef.moveLimit + addons.extraMoves + wardenStack.extraMoves;
      const solveMs = tierDef.timeLimitMs + addons.extraTimeMs + wardenStack.extraTimeMs;
      const fragmentMult = addons.fragmentBonusMult * wardenStack.fragmentMult;
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
          if (state.inventory.vault_pass <= 0) {
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

        const r = await fetch('/api/games/cipher-vaults/run/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: walletAddr,
            tierId: args.tierId,
            paidBy,
            entryTxHash: txHash || undefined,
            addonIds: args.addonIds,
            moveLimit,
            solveExpiresAt: now + solveMs,
            covenantExpiresAt,
            fragmentMult,
            retriesLeft: addons.retryCharge,
            clientState: {
              cipherFragments: state.cipherFragments,
              fragmentsEarnedLifetime: state.fragmentsEarnedLifetime,
              inventory: state.inventory,
              booster: state.booster,
              wardenSlots: state.wardenSlots,
              ledger: state.ledger,
            },
          }),
        });
        const j = (await r.json()) as {
          ok?: boolean;
          error?: string;
          run?: CipherRun;
          puzzle?: { size: number; initial: number[]; target: number[]; moveLimit: number };
          state?: CipherVaultsState;
        };
        if (!j?.ok || !j.run || !j.puzzle) {
          setLastError(j?.error || 'Failed to open vault covenant.');
          return false;
        }

        persist((prev) => ({
          ...prev,
          walletAddress: walletAddr,
          activeRun: j.run!,
          ownedAddons: [...args.addonIds],
          covenantExpiresAt,
          inventory:
            paidBy === 'VAULT_PASS'
              ? { ...prev.inventory, vault_pass: Math.max(0, prev.inventory.vault_pass - 1) }
              : prev.inventory,
          ...(j.state
            ? {
                ledger: j.state.ledger ?? prev.ledger,
              }
            : {}),
        }));
        setPuzzle(j.puzzle);
        setLastSuccess(
          `${tierDef.label} covenant opened. Solve before the timer ends (${Math.round(solveMs / 60000)} min).`,
        );
        return true;
      } finally {
        setPaying(false);
      }
    },
    [
      walletAddr,
      state.activeRun,
      state.inventory.vault_pass,
      state.cipherFragments,
      state.fragmentsEarnedLifetime,
      state.inventory,
      state.booster,
      state.wardenSlots,
      state.ledger,
      getKasPriceAfterDiscount,
      wardenStack,
      payKrex,
      payKas,
      pricingSnapshot,
      persist,
    ],
  );

  const submitRun = useCallback(
    async (runId: string, moves: unknown[]) => {
      if (!walletAddr) throw new Error('Wallet not connected');
      const r = await fetch('/api/games/cipher-vaults/run/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: walletAddr,
          runId,
          moves,
          boosterMult: liveBoosterMult,
        }),
      });
      const j = (await r.json()) as {
        ok?: boolean;
        solved?: boolean;
        error?: string;
        entry?: { fragmentsBanked?: number };
        state?: CipherVaultsState;
      };
      if (j?.state) {
        persist((prev) => ({
          ...prev,
          activeRun: j.state!.activeRun,
          ledger: j.state!.ledger ?? prev.ledger,
          cipherFragments: j.state!.cipherFragments ?? prev.cipherFragments,
          fragmentsEarnedLifetime: j.state!.fragmentsEarnedLifetime ?? prev.fragmentsEarnedLifetime,
        }));
      }
      if (j?.solved) {
        setPuzzle(null);
        const banked = j.entry?.fragmentsBanked ?? 0;
        setLastSuccess(
          banked > 0
            ? `Vault cleared. +${banked.toLocaleString()} Cipher Fragments banked.`
            : 'Vault cleared. Checkpoint recorded.',
        );
      }
      return j;
    },
    [walletAddr, liveBoosterMult, persist],
  );

  const cancelRun = useCallback(
    async (runId?: string) => {
      if (!walletAddr) throw new Error('Wallet not connected');
      const r = await fetch('/api/games/cipher-vaults/run/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: walletAddr, runId }),
      });
      const j = (await r.json()) as { state?: CipherVaultsState; error?: string };
      if (j?.state) {
        persist((prev) => ({ ...prev, activeRun: j.state!.activeRun ?? null }));
      }
      setPuzzle(null);
      return j;
    },
    [walletAddr, persist],
  );

  const retryRun = useCallback(async () => {
    if (!walletAddr || !state.activeRun) return false;
    if ((state.activeRun.retriesLeft ?? 0) <= 0) {
      setLastError('No Second Seal retries left.');
      return false;
    }
    const r = await fetch('/api/games/cipher-vaults/run/retry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: walletAddr, runId: state.activeRun.runId }),
    });
    const j = (await r.json()) as {
      ok?: boolean;
      error?: string;
      run?: CipherRun;
      puzzle?: { size: number; initial: number[]; target: number[]; moveLimit: number };
    };
    if (!j?.ok || !j.run || !j.puzzle) {
      setLastError(j?.error || 'Retry failed.');
      return false;
    }
    persist((prev) => ({ ...prev, activeRun: j.run! }));
    setPuzzle(j.puzzle);
    setLastSuccess('Second Seal used. Fresh attempt on the same vault.');
    return true;
  }, [walletAddr, state.activeRun, persist]);

  const buyShopItem = useCallback(
    async (args: { itemId: CipherShopItemId; currency: 'KAS' | 'KREX'; quantity?: number }) => {
      setLastError(null);
      setLastSuccess(null);
      const def = getCipherShopItem(args.itemId);
      if (!def) {
        setLastError('Unknown shop item.');
        return false;
      }
      if (def.extendCovenantMs && !state.activeRun && !state.covenantExpiresAt) {
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
          const next = { ...prev, walletAddress: walletAddr || prev.walletAddress };
          if (def.boosterMult && def.durationMs) {
            next.booster = {
              mult: def.boosterMult,
              until: Date.now() + def.durationMs,
              itemId: def.id,
              txHash,
            };
          }
          if (def.extendCovenantMs) {
            const base =
              next.activeRun?.covenantExpiresAt ??
              next.covenantExpiresAt ??
              Date.now();
            const extended = Math.max(base, Date.now()) + def.extendCovenantMs * qty;
            next.covenantExpiresAt = extended;
            if (next.activeRun) {
              next.activeRun = { ...next.activeRun, covenantExpiresAt: extended };
            }
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
      state.activeRun,
      state.covenantExpiresAt,
      getKasPriceAfterDiscount,
      payKrex,
      payKas,
      pricingSnapshot,
      persist,
      walletAddr,
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
      const wTier = slot.tier ?? mapRarityToWardenTier(slot.collection, slot.tokenId);
      const perks = CIPHER_WARDEN_PERKS[wTier];
      persist((prev) => {
        const slots = [...(prev.wardenSlots.length ? prev.wardenSlots : [null])];
        while (slots.length <= slotIndex) slots.push(null);
        const now = Date.now();
        const prevAt = slots[slotIndex];
        const already = prevAt?.nftRef === slot.nftRef;
        let covenantExpiresAt = prev.activeRun?.covenantExpiresAt ?? prev.covenantExpiresAt;
        if (covenantExpiresAt && !already) {
          const prevExtend = prevAt ? CIPHER_WARDEN_PERKS[prevAt.tier].covenantExtendMs : 0;
          covenantExpiresAt = covenantExpiresAt - prevExtend + perks.covenantExtendMs;
        }
        slots[slotIndex] = {
          nftRef: slot.nftRef,
          collection: slot.collection,
          tokenId: slot.tokenId,
          tier: wTier,
          imageUrl: slot.imageUrl ?? null,
          appliedAt: now,
        };
        const next: CipherVaultsState = {
          ...prev,
          wardenSlots: slots,
          covenantExpiresAt: covenantExpiresAt ?? prev.covenantExpiresAt,
        };
        if (next.activeRun && covenantExpiresAt) {
          next.activeRun = { ...next.activeRun, covenantExpiresAt };
        }
        return next;
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kasparex-nft-usage'));
      }
      setLastSuccess(`Cipher Warden slotted (${CIPHER_WARDEN_PERKS[wTier].label}).`);
    },
    [persist],
  );

  const clearWarden = useCallback(
    (slotIndex: number) => {
      persist((prev) => {
        const slots = [...(prev.wardenSlots.length ? prev.wardenSlots : [null])];
        if (slotIndex < 0 || slotIndex >= slots.length) return prev;
        const removed = slots[slotIndex];
        slots[slotIndex] = null;
        let covenantExpiresAt = prev.activeRun?.covenantExpiresAt ?? prev.covenantExpiresAt;
        if (removed && typeof covenantExpiresAt === 'number') {
          covenantExpiresAt = covenantExpiresAt - CIPHER_WARDEN_PERKS[removed.tier].covenantExtendMs;
        }
        const next: CipherVaultsState = {
          ...prev,
          wardenSlots: slots,
          covenantExpiresAt,
        };
        if (next.activeRun && typeof covenantExpiresAt === 'number') {
          next.activeRun = { ...next.activeRun, covenantExpiresAt };
        }
        return next;
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kasparex-nft-usage'));
      }
    },
    [persist],
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
      const bag = Math.floor(state.cipherFragments);
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
            ? Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join('')
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
        setLastSuccess(`Refined ${amount.toLocaleString()} fragments → ${points.toLocaleString()} Hub points.`);
        return { points, amount };
      } finally {
        setRefining(false);
      }
    },
    [walletAddr, state.cipherFragments, persist],
  );

  const canPayWithL1 =
    wallet.isConnected && (wallet.provider === 'kasware' || wallet.provider === 'kastle');

  return {
    state,
    puzzle,
    paying,
    buyBusyId,
    refining,
    lastError,
    lastSuccess,
    canPayWithL1,
    runActive,
    solveMsLeft,
    covenantMsLeft,
    boosterMult: liveBoosterMult,
    wardenStack,
    refineMin: CIPHER_REFINE_MIN,
    wardenSlotUnlockKas: CIPHER_WARDEN_SLOT_UNLOCK_KAS,
    entryAddons: CIPHER_ENTRY_ADDONS,
    getKasPriceAfterDiscount,
    startVault,
    submitRun,
    cancelRun,
    retryRun,
    loadActiveRun: syncActiveRunFromServer,
    buyShopItem,
    consumeRuneHint,
    setWarden,
    clearWarden,
    purchaseWardenSlots,
    refineFragments,
    bankPreview: (tierId: CipherVaultTierId, addonIds: CipherAddonId[]) => {
      const tierDef = getCipherVaultTier(tierId);
      if (!tierDef) return 0;
      const addons = bundleAddons(addonIds);
      return bankFragmentsForClear({
        bankReward: tierDef.bankReward,
        addonFragmentMult: addons.fragmentBonusMult,
        boosterMult: liveBoosterMult,
        wardenMult: wardenStack.fragmentMult,
      });
    },
  };
}
