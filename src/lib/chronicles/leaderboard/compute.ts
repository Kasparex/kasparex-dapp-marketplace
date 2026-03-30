import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { getFullTransactionsForAddress, type KaspaRestTransaction } from '@/lib/kaspa/api';
import { getChroniclesVaultTreasuryL1Address } from '@/lib/chronicles/vault/config';
import {
  CHRONICLES_LB_POINTS_PER_READ_CONFIRM,
  type ChroniclesLbEntityType,
} from './constants';
import { parseChroniclesLbPayload } from './parse';
import type { ChroniclesLbEvent } from './types';
import { fetchNFTMetadata } from '@/lib/nft/metadata';
import type { ParsedNFTMetadata } from '@/lib/nft/metadata';
import { getNftRarityFromMetadata, pointsForNftInSlot } from '@/lib/leaderboard/nftPoints';

export type ChroniclesLeaderboardRow = {
  wallet: string;
  totalScore: number;
  filledSlotsCount: number;
  confirmedReadsCount: number;
  lastActivityMs: number;
};

type SlotKey = `${ChroniclesLbEntityType}:${string}:${1 | 2 | 3}`;
type ReadKey = `${ChroniclesLbEntityType}:${string}`;

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

function slotKey(e: {
  entityType: ChroniclesLbEntityType;
  entityId: string;
  slotIndex: 1 | 2 | 3;
}): SlotKey {
  return `${e.entityType}:${e.entityId}:${e.slotIndex}`;
}

function readKey(e: { entityType: ChroniclesLbEntityType; entityId: string }): ReadKey {
  return `${e.entityType}:${e.entityId}`;
}

type WalletState = {
  activatedSlots: Set<SlotKey>; // slots 2-3 activated; slot 1 implicit
  placements: Map<SlotKey, string | null>; // last-write-wins set/clear
  reads: Set<ReadKey>; // one per entity per wallet
  lastActivityMs: number;
};

function ensureState(map: Map<string, WalletState>, wallet: string): WalletState {
  const w = map.get(wallet);
  if (w) return w;
  const next: WalletState = {
    activatedSlots: new Set(),
    placements: new Map(),
    reads: new Set(),
    lastActivityMs: 0,
  };
  map.set(wallet, next);
  return next;
}

function applyEvent(state: WalletState, e: ChroniclesLbEvent, tMs: number) {
  state.lastActivityMs = Math.max(state.lastActivityMs, tMs);
  if (e.kind === 'slot:activate') {
    state.activatedSlots.add(slotKey({ entityType: e.entityType, entityId: e.entityId, slotIndex: e.slotIndex }));
    return;
  }
  if (e.kind === 'slot:set') {
    state.placements.set(slotKey({ entityType: e.entityType, entityId: e.entityId, slotIndex: e.slotIndex }), e.nftRef);
    return;
  }
  if (e.kind === 'slot:clear') {
    state.placements.set(slotKey({ entityType: e.entityType, entityId: e.entityId, slotIndex: e.slotIndex }), null);
    return;
  }
  if (e.kind === 'read') {
    state.reads.add(readKey({ entityType: e.entityType, entityId: e.entityId }));
  }
}

function slotIsActive(state: WalletState, k: SlotKey): boolean {
  // slot 1 is always active; slot 2/3 require activation.
  const slotIndex = Number(k.split(':').slice(-1)[0]);
  if (slotIndex === 1) return true;
  return state.activatedSlots.has(k);
}

function computeRow(wallet: string, state: WalletState): ChroniclesLeaderboardRow {
  // (sync placeholder) – replaced by async scoring below
  return {
    wallet,
    totalScore: 0,
    filledSlotsCount: 0,
    confirmedReadsCount: state.reads.size,
    lastActivityMs: state.lastActivityMs,
  };
}

function parseNftRef(ref: string): { collection: string; tokenId: number } | null {
  const [collection, tokenStr] = String(ref ?? '').split('#');
  const tokenId = Number(tokenStr);
  if (!collection || !Number.isFinite(tokenId)) return null;
  return { collection, tokenId };
}

export async function computeChroniclesLeaderboard(options?: { limit?: number }): Promise<ChroniclesLeaderboardRow[]> {
  const treasury = getChroniclesVaultTreasuryL1Address();
  const txs = await getFullTransactionsForAddress(treasury, options?.limit ?? 300);

  const byWallet = new Map<string, WalletState>();

  // Sort ascending by time so last-write-wins is natural.
  const sorted = txs.slice().sort((a, b) => txTimeMs(a) - txTimeMs(b));

  for (const tx of sorted) {
    const e = parseChroniclesLbPayload(tx.payload ?? null);
    if (!e) continue;
    const wallet = normAddr(e.payerKaspa);
    const state = ensureState(byWallet, wallet);
    applyEvent(state, e, txTimeMs(tx));
  }

  const metaCache = new Map<string, ParsedNFTMetadata | null>();

  const rows = (
    await Promise.all(
      Array.from(byWallet.entries()).map(async ([wallet, state]) => {
        let filled = 0;
        let slotPoints = 0;
        for (const [k, v] of state.placements.entries()) {
          if (!slotIsActive(state, k)) continue;
          if (v == null || String(v).trim().length === 0) continue;
          filled += 1;

          const parsed = parseNftRef(v);
          const collection = parsed?.collection ?? String(v).split('#')[0] ?? '';
          let rarity: 'diamond' | 'rare' | 'standard' = 'standard';

          if (parsed) {
            const cacheKey = `${parsed.collection}#${parsed.tokenId}`;
            let meta = metaCache.get(cacheKey);
            if (meta === undefined) {
              try {
                meta = (await fetchNFTMetadata(parsed.collection, parsed.tokenId)) ?? null;
              } catch {
                meta = null;
              }
              metaCache.set(cacheKey, meta);
            }
            rarity = getNftRarityFromMetadata(meta);
          }

          slotPoints += pointsForNftInSlot({ collection, rarity }).points;
        }

        const reads = state.reads.size;
        const totalScore = slotPoints + reads * CHRONICLES_LB_POINTS_PER_READ_CONFIRM;
        return {
          wallet,
          totalScore,
          filledSlotsCount: filled,
          confirmedReadsCount: reads,
          lastActivityMs: state.lastActivityMs,
        } satisfies ChroniclesLeaderboardRow;
      })
    )
  )
    .filter((r) => r.totalScore > 0)
    .sort((a, b) => b.totalScore - a.totalScore || b.lastActivityMs - a.lastActivityMs);

  return rows;
}

