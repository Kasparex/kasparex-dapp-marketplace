'use client';

import type { ChroniclesLbEntityType } from './constants';
import { currentSeasonWindowUtc, isWithinSeason, type SeasonId } from '@/lib/leaderboard/seasons';

export const CHRONICLES_LB_LOCAL_STORAGE_KEY = 'chronicles-leaderboard-local-v2';

type SlotIndex = 1 | 2 | 3;

type SlotKey = `${ChroniclesLbEntityType}:${string}:${SlotIndex}`;
type ReadKey = `${ChroniclesLbEntityType}:${string}`;

type TxKind = 'read' | 'slot:activate' | 'slot:set' | 'slot:clear';

type VerifiedTx = { txHash: string; txTimeMs: number; kind: TxKind };
type PendingTx = { txHash: string; createdAtMs: number; kind: TxKind };

type SeasonRow = {
  activated?: Record<string, true>;
  placements?: Record<string, string | null>;
  placementRarities?: Record<string, 'diamond' | 'rare' | 'standard'>;
  reads?: Record<string, true>;
  verifiedTxs?: Record<string, VerifiedTx>;
  pendingTxs?: Record<string, PendingTx>;
};

type WalletRow = {
  seasons?: Record<string, SeasonRow>;
};

type Store = { v: 2; wallets: Record<string, WalletRow> };

function safeParse(raw: string | null): Store | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as Store;
    if (typeof p !== 'object' || p === null) return null;
    if ((p as { v?: unknown }).v !== 2) return null;
    if (typeof (p as { wallets?: unknown }).wallets !== 'object') return null;
    return p;
  } catch {
    return null;
  }
}

function normalizeAddr(a: string): string {
  const t = a.trim();
  if (!t) return '';
  return t.startsWith('kaspa:') ? t : `kaspa:${t}`;
}

function slotKey(entityType: ChroniclesLbEntityType, entityId: string, slotIndex: SlotIndex): SlotKey {
  return `${entityType}:${entityId}:${slotIndex}`;
}

function readKey(entityType: ChroniclesLbEntityType, entityId: string): ReadKey {
  return `${entityType}:${entityId}`;
}

function readStore(): Store {
  if (typeof window === 'undefined') return { v: 2, wallets: {} };
  try {
    const parsed = safeParse(localStorage.getItem(CHRONICLES_LB_LOCAL_STORAGE_KEY));
    if (parsed) return parsed;
    // migrate v1 -> v2 (best-effort, no season metadata available)
    const legacyRaw = localStorage.getItem('chronicles-leaderboard-local-v1');
    if (!legacyRaw) return { v: 2, wallets: {} };
    const legacy = (() => {
      try {
        const p = JSON.parse(legacyRaw) as Record<string, { activated?: Record<string, true>; placements?: Record<string, string | null>; reads?: Record<string, true> }>;
        return typeof p === 'object' && p !== null ? p : null;
      } catch {
        return null;
      }
    })();
    if (!legacy) return { v: 2, wallets: {} };
    const season = currentSeasonWindowUtc();
    const wallets: Record<string, WalletRow> = {};
    for (const [addr, row] of Object.entries(legacy)) {
      wallets[addr] = {
        seasons: {
          [season.id]: {
            activated: row.activated ?? {},
            placements: row.placements ?? {},
            reads: row.reads ?? {},
          },
        },
      };
    }
    const next: Store = { v: 2, wallets };
    localStorage.setItem(CHRONICLES_LB_LOCAL_STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch {
    return { v: 2, wallets: {} };
  }
}

function writeStore(next: Store) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CHRONICLES_LB_LOCAL_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('chronicles-lb-local'));
  } catch {
    // ignore
  }
}

function currentSeasonId(): SeasonId {
  return currentSeasonWindowUtc().id;
}

function ensureSeasonRow(store: Store, addrNorm: string, seasonId: SeasonId): SeasonRow {
  const w = store.wallets[addrNorm] ?? {};
  const seasons = w.seasons ?? {};
  const row = seasons[seasonId] ?? {};
  seasons[seasonId] = row;
  store.wallets[addrNorm] = { ...w, seasons };
  return row;
}

function withinCurrentSeason(txTimeMs: number, seasonId: SeasonId): boolean {
  const window = seasonId === currentSeasonId() ? currentSeasonWindowUtc() : currentSeasonWindowUtc(txTimeMs);
  // If someone passes a historical season id, we still allow by comparing to the computed month window of txTimeMs.
  // This keeps gating logic simple without persisting season metadata in local storage.
  const seasonWindow = seasonId === window.id ? window : currentSeasonWindowUtc(txTimeMs);
  return isWithinSeason(txTimeMs, seasonWindow);
}

export function exportChroniclesLeaderboardLocal(): string {
  const store = readStore();
  return JSON.stringify(store);
}

export function importChroniclesLeaderboardLocal(rawJson: string): { ok: true } | { ok: false; error: string } {
  try {
    const parsed = safeParse(rawJson);
    if (!parsed) return { ok: false, error: 'Invalid store JSON.' };
    writeStore(parsed);
    return { ok: true };
  } catch {
    return { ok: false, error: 'Invalid store JSON.' };
  }
}

export function recordLocalPendingTx(addr: string, txHash: string, kind: TxKind, seasonId?: SeasonId) {
  const a = normalizeAddr(addr);
  if (!a || !txHash) return;
  const store = readStore();
  const sId = seasonId ?? currentSeasonId();
  const row = ensureSeasonRow(store, a, sId);
  const pending = row.pendingTxs ?? {};
  pending[txHash] = { txHash, createdAtMs: Date.now(), kind };
  row.pendingTxs = pending;
  writeStore(store);
}

export function recordLocalVerifiedTx(addr: string, txHash: string, txTimeMs: number, kind: TxKind, seasonId?: SeasonId) {
  const a = normalizeAddr(addr);
  if (!a || !txHash) return;
  const store = readStore();
  const sId = seasonId ?? currentSeasonId();
  if (!withinCurrentSeason(txTimeMs, sId)) return;
  const row = ensureSeasonRow(store, a, sId);
  const verified = row.verifiedTxs ?? {};
  if (verified[txHash]) return; // idempotent
  verified[txHash] = { txHash, txTimeMs, kind };
  row.verifiedTxs = verified;
  if (row.pendingTxs && row.pendingTxs[txHash]) {
    const next = { ...row.pendingTxs };
    delete next[txHash];
    row.pendingTxs = next;
  }
  writeStore(store);
}

export function getLocalActivatedSlots(addr: string, entityType: ChroniclesLbEntityType, entityId: string, seasonId?: SeasonId): Set<SlotIndex> {
  const a = normalizeAddr(addr);
  const store = readStore();
  const row = store.wallets[a]?.seasons?.[seasonId ?? currentSeasonId()] ?? {};
  const activated = row.activated ?? {};
  const out = new Set<SlotIndex>();
  for (const i of [2, 3] as const) {
    if (activated[slotKey(entityType, entityId, i)]) out.add(i);
  }
  // slot 1 is always active
  out.add(1);
  return out;
}

export function getLocalSlotPlacement(
  addr: string,
  entityType: ChroniclesLbEntityType,
  entityId: string,
  slotIndex: SlotIndex,
  seasonId?: SeasonId
): string | null {
  const a = normalizeAddr(addr);
  const store = readStore();
  const row = store.wallets[a]?.seasons?.[seasonId ?? currentSeasonId()] ?? {};
  const placements = row.placements ?? {};
  const v = placements[slotKey(entityType, entityId, slotIndex)];
  if (v === undefined) return null;
  return v;
}

export function getLocalReadConfirmed(addr: string, entityType: ChroniclesLbEntityType, entityId: string, seasonId?: SeasonId): boolean {
  const a = normalizeAddr(addr);
  const store = readStore();
  const row = store.wallets[a]?.seasons?.[seasonId ?? currentSeasonId()] ?? {};
  const reads = row.reads ?? {};
  return reads[readKey(entityType, entityId)] === true;
}

export function recordLocalActivate(
  addr: string,
  entityType: ChroniclesLbEntityType,
  entityId: string,
  slotIndex: 2 | 3,
  meta?: { txHash?: string; txTimeMs?: number; seasonId?: SeasonId }
) {
  const a = normalizeAddr(addr);
  const store = readStore();
  const sId = meta?.seasonId ?? currentSeasonId();
  const row = ensureSeasonRow(store, a, sId);
  const activated = row.activated ?? {};
  activated[slotKey(entityType, entityId, slotIndex)] = true;
  row.activated = activated;
  if (meta?.txHash && typeof meta.txTimeMs === 'number') {
    recordLocalVerifiedTx(a, meta.txHash, meta.txTimeMs, 'slot:activate', sId);
  }
  writeStore(store);
}

export function recordLocalSetSlot(
  addr: string,
  entityType: ChroniclesLbEntityType,
  entityId: string,
  slotIndex: SlotIndex,
  nftRef: string | null,
  meta?: { txHash?: string; txTimeMs?: number; seasonId?: SeasonId; rarity?: 'diamond' | 'rare' | 'standard' }
) {
  const a = normalizeAddr(addr);
  const store = readStore();
  const sId = meta?.seasonId ?? currentSeasonId();
  const row = ensureSeasonRow(store, a, sId);
  const placements = row.placements ?? {};
  placements[slotKey(entityType, entityId, slotIndex)] = nftRef;
  row.placements = placements;
  if (meta?.rarity) {
    const rarities = row.placementRarities ?? {};
    rarities[slotKey(entityType, entityId, slotIndex)] = meta.rarity;
    row.placementRarities = rarities;
  } else if (nftRef == null && row.placementRarities) {
    const next = { ...row.placementRarities };
    delete next[slotKey(entityType, entityId, slotIndex)];
    row.placementRarities = next;
  }
  if (meta?.txHash && typeof meta.txTimeMs === 'number') {
    recordLocalVerifiedTx(a, meta.txHash, meta.txTimeMs, nftRef ? 'slot:set' : 'slot:clear', sId);
  }
  writeStore(store);
}

export function recordLocalRead(
  addr: string,
  entityType: ChroniclesLbEntityType,
  entityId: string,
  meta?: { txHash?: string; txTimeMs?: number; seasonId?: SeasonId }
) {
  const a = normalizeAddr(addr);
  const store = readStore();
  const sId = meta?.seasonId ?? currentSeasonId();
  const row = ensureSeasonRow(store, a, sId);
  const reads = row.reads ?? {};
  reads[readKey(entityType, entityId)] = true;
  row.reads = reads;
  if (meta?.txHash && typeof meta.txTimeMs === 'number') {
    recordLocalVerifiedTx(a, meta.txHash, meta.txTimeMs, 'read', sId);
  }
  writeStore(store);
}

export function getChroniclesLocalSeasonSnapshot(addr: string, seasonId?: SeasonId): {
  seasonId: SeasonId;
  activated: Record<string, true>;
  placements: Record<string, string | null>;
  placementRarities: Record<string, 'diamond' | 'rare' | 'standard'>;
  reads: Record<string, true>;
  pendingTxs: Record<string, PendingTx>;
  verifiedTxs: Record<string, VerifiedTx>;
} {
  const a = normalizeAddr(addr);
  const sId = seasonId ?? currentSeasonId();
  const store = readStore();
  const row = store.wallets[a]?.seasons?.[sId] ?? {};
  return {
    seasonId: sId,
    activated: row.activated ?? {},
    placements: row.placements ?? {},
    placementRarities: row.placementRarities ?? {},
    reads: row.reads ?? {},
    pendingTxs: row.pendingTxs ?? {},
    verifiedTxs: row.verifiedTxs ?? {},
  };
}

export function getChroniclesAllPlacedNftRefs(addr: string, seasonId?: SeasonId): Set<string> {
  const a = normalizeAddr(addr);
  const sId = seasonId ?? currentSeasonId();
  const store = readStore();
  const seasons = store.wallets[a]?.seasons ?? {};
  const row = seasons[sId] ?? {};
  const placements = row.placements ?? {};
  const out = new Set<string>();
  for (const v of Object.values(placements)) {
    if (v && String(v).trim().length > 0) out.add(String(v));
  }
  return out;
}

