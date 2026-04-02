import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { getFullTransactionsForAddress, type KaspaRestTransaction } from '@/lib/kaspa/api';
import { getChroniclesVaultTreasuryL1Address } from '@/lib/chronicles/vault/config';
import { parseChroniclesLbPayload } from '@/lib/chronicles/leaderboard/parse';
import { pointsForNftInSlot } from '@/lib/leaderboard/nftPoints';
import { currentSeasonWindowUtc, seasonWindowFromSeasonId, type SeasonId } from '@/lib/leaderboard/seasons';
import { parseVaultPayloadBinding } from '@/lib/chronicles/vault/verifyUnlockTx';
import { MODULES } from '@/lib/modules/registry';
import type { ModuleId } from '@/lib/modules/types';
import {
  buildStoreModuleEntitlementsIndex,
  isModuleUnlockedByStore,
  moduleIdFromVaultOfferId,
  normalizeKaspaAddressLoose,
} from '@/lib/modules/entitlements';
import { CHRONICLES_LB_POINTS_PER_READ_CONFIRM } from '@/lib/chronicles/leaderboard/constants';

export type GlobalLeaderboardRow = {
  wallet: string;
  totalScore: number;
  filledSlotsCount: number;
  confirmedReadsCount: number;
  lastActivityMs: number;
};

type SlotKey = `${string}:${string}:${1 | 2 | 3}`;
type ReadKey = `${string}:${string}`;

function txTimeMs(tx: KaspaRestTransaction): number {
  const t = tx.accepting_block_time ?? tx.block_time;
  if (typeof t === 'number' && t > 1e12) return t;
  if (typeof t === 'number' && t > 1e9) return t * 1000;
  return Date.now();
}

function normAddr(a: string): string {
  try {
    return normalizeKaspaAddress(a);
  } catch {
    return a.trim();
  }
}

function slotKey(e: { entityType: string; entityId: string; slotIndex: 1 | 2 | 3 }): SlotKey {
  return `${e.entityType}:${e.entityId}:${e.slotIndex}`;
}

function readKey(e: { entityType: string; entityId: string }): ReadKey {
  return `${e.entityType}:${e.entityId}`;
}

type WalletState = {
  // entitlements
  unlockedModules: Set<ModuleId>;
  // slots/reads state (last-write-wins)
  activatedSlots: Set<SlotKey>;
  placements: Map<SlotKey, string | null>;
  reads: Set<ReadKey>;
  lastActivityMs: number;
};

function ensureState(map: Map<string, WalletState>, wallet: string): WalletState {
  const w = map.get(wallet);
  if (w) return w;
  const next: WalletState = {
    unlockedModules: new Set<ModuleId>(),
    activatedSlots: new Set(),
    placements: new Map(),
    reads: new Set(),
    lastActivityMs: 0,
  };
  map.set(wallet, next);
  return next;
}

function slotIsActive(state: WalletState, k: SlotKey): boolean {
  // slot 1 always active; slot 2/3 require activation
  const slotIndex = Number(k.split(':').slice(-1)[0]);
  if (slotIndex === 1) return true;
  return state.activatedSlots.has(k);
}

function parseNftRef(ref: string): { collection: string; tokenId: number } | null {
  const [collection, tokenStr] = String(ref ?? '').split('#');
  const tokenId = Number(tokenStr);
  if (!collection || !Number.isFinite(tokenId)) return null;
  return { collection, tokenId };
}

export async function computeGlobalLeaderboard(options?: { limit?: number; seasonId?: SeasonId }): Promise<GlobalLeaderboardRow[]> {
  const treasury = getChroniclesVaultTreasuryL1Address();
  const txs = await getFullTransactionsForAddress(treasury, options?.limit ?? 2000);
  const season = options?.seasonId ? seasonWindowFromSeasonId(options.seasonId) : currentSeasonWindowUtc();

  const storeEntitlements = await buildStoreModuleEntitlementsIndex();

  const byWallet = new Map<string, WalletState>();
  const sorted = txs.slice().sort((a, b) => txTimeMs(a) - txTimeMs(b));

  // 1) First pass: record module unlocks (vault or store) across all time.
  for (const tx of sorted) {
    const binding = parseVaultPayloadBinding(tx.payload ?? null);
    if (!binding) continue;
    const moduleId = moduleIdFromVaultOfferId(binding.offerId);
    if (!moduleId) continue;
    const wallet = normAddr(binding.payer);
    const state = ensureState(byWallet, wallet);
    state.unlockedModules.add(moduleId);
  }

  // Store unlocks: apply to any wallet we later see in events; we also apply to existing known wallets now.
  for (const [wallet, state] of byWallet.entries()) {
    const walletNorm = normalizeKaspaAddressLoose(wallet);
    for (const moduleId of Object.keys(MODULES) as ModuleId[]) {
      if (isModuleUnlockedByStore(storeEntitlements, walletNorm, moduleId)) {
        state.unlockedModules.add(moduleId);
      }
    }
  }

  // 2) Second pass: apply leaderboard events in the current season.
  for (const tx of sorted) {
    const eventTimeMs = txTimeMs(tx);
    if (eventTimeMs < season.startUtcMs || eventTimeMs >= season.endUtcMs) continue;
    const e = parseChroniclesLbPayload(tx.payload ?? null);
    if (!e) continue;
    const wallet = normAddr(e.payerKaspa);
    const state = ensureState(byWallet, wallet);

    // Attach store unlocks lazily for wallets that only appear in season events.
    const walletNorm = normalizeKaspaAddressLoose(wallet);
    for (const moduleId of Object.keys(MODULES) as ModuleId[]) {
      if (isModuleUnlockedByStore(storeEntitlements, walletNorm, moduleId)) {
        state.unlockedModules.add(moduleId);
      }
    }

    state.lastActivityMs = Math.max(state.lastActivityMs, eventTimeMs);
    if (e.kind === 'slot:activate') {
      state.activatedSlots.add(slotKey({ entityType: e.entityType, entityId: e.entityId, slotIndex: e.slotIndex }));
    } else if (e.kind === 'slot:set') {
      state.placements.set(slotKey({ entityType: e.entityType, entityId: e.entityId, slotIndex: e.slotIndex }), e.nftRef);
    } else if (e.kind === 'slot:clear') {
      state.placements.set(slotKey({ entityType: e.entityType, entityId: e.entityId, slotIndex: e.slotIndex }), null);
    } else if (e.kind === 'read') {
      state.reads.add(readKey({ entityType: e.entityType, entityId: e.entityId }));
    }
  }

  const rows = Array.from(byWallet.entries())
    .map(([wallet, state]) => {
      const readsCount = state.reads.size;

      let filled = 0;
      let slotPoints = 0;
      for (const [k, v] of state.placements.entries()) {
        if (!slotIsActive(state, k)) continue;
        if (v == null || String(v).trim().length === 0) continue;
        filled += 1;
        const parsed = parseNftRef(v);
        const collection = parsed?.collection ?? String(v).split('#')[0] ?? '';
        const tokenId = parsed?.tokenId;
        slotPoints += pointsForNftInSlot({ collection, tokenId }).points;
      }

      // Module gating + weights
      const readsUnlocked = state.unlockedModules.has('confirmed_reads');
      const slotsUnlocked = state.unlockedModules.has('nft_slots');

      const readsScore = readsUnlocked ? readsCount * CHRONICLES_LB_POINTS_PER_READ_CONFIRM * MODULES.confirmed_reads.weight : 0;
      const slotsScore = slotsUnlocked ? slotPoints * MODULES.nft_slots.weight : 0;
      const totalScore = readsScore + slotsScore;

      return {
        wallet,
        totalScore,
        filledSlotsCount: slotsUnlocked ? filled : 0,
        confirmedReadsCount: readsUnlocked ? readsCount : 0,
        lastActivityMs: state.lastActivityMs,
      } satisfies GlobalLeaderboardRow;
    })
    .filter((r) => r.totalScore > 0)
    .sort((a, b) => b.totalScore - a.totalScore || b.lastActivityMs - a.lastActivityMs);

  return rows;
}

