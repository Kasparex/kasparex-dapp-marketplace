'use client';

import type { ChroniclesLbEntityType } from './constants';

export const CHRONICLES_LB_LOCAL_STORAGE_KEY = 'chronicles-leaderboard-local-v1';

type SlotIndex = 1 | 2 | 3;

type SlotKey = `${ChroniclesLbEntityType}:${string}:${SlotIndex}`;
type ReadKey = `${ChroniclesLbEntityType}:${string}`;

type WalletRow = {
  activated?: Record<string, true>;
  placements?: Record<string, string | null>;
  reads?: Record<string, true>;
};

type Store = Record<string, WalletRow>;

function safeParse(raw: string | null): Store {
  if (!raw) return {};
  try {
    const p = JSON.parse(raw) as Store;
    return typeof p === 'object' && p !== null ? p : {};
  } catch {
    return {};
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
  if (typeof window === 'undefined') return {};
  try {
    return safeParse(localStorage.getItem(CHRONICLES_LB_LOCAL_STORAGE_KEY));
  } catch {
    return {};
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

export function getLocalActivatedSlots(addr: string, entityType: ChroniclesLbEntityType, entityId: string): Set<SlotIndex> {
  const a = normalizeAddr(addr);
  const row = readStore()[a] ?? {};
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
  slotIndex: SlotIndex
): string | null {
  const a = normalizeAddr(addr);
  const row = readStore()[a] ?? {};
  const placements = row.placements ?? {};
  const v = placements[slotKey(entityType, entityId, slotIndex)];
  if (v === undefined) return null;
  return v;
}

export function getLocalReadConfirmed(addr: string, entityType: ChroniclesLbEntityType, entityId: string): boolean {
  const a = normalizeAddr(addr);
  const row = readStore()[a] ?? {};
  const reads = row.reads ?? {};
  return reads[readKey(entityType, entityId)] === true;
}

export function recordLocalActivate(addr: string, entityType: ChroniclesLbEntityType, entityId: string, slotIndex: 2 | 3) {
  const a = normalizeAddr(addr);
  const store = readStore();
  const row = store[a] ?? {};
  const activated = row.activated ?? {};
  activated[slotKey(entityType, entityId, slotIndex)] = true;
  store[a] = { ...row, activated };
  writeStore(store);
}

export function recordLocalSetSlot(
  addr: string,
  entityType: ChroniclesLbEntityType,
  entityId: string,
  slotIndex: SlotIndex,
  nftRef: string | null
) {
  const a = normalizeAddr(addr);
  const store = readStore();
  const row = store[a] ?? {};
  const placements = row.placements ?? {};
  placements[slotKey(entityType, entityId, slotIndex)] = nftRef;
  store[a] = { ...row, placements };
  writeStore(store);
}

export function recordLocalRead(addr: string, entityType: ChroniclesLbEntityType, entityId: string) {
  const a = normalizeAddr(addr);
  const store = readStore();
  const row = store[a] ?? {};
  const reads = row.reads ?? {};
  reads[readKey(entityType, entityId)] = true;
  store[a] = { ...row, reads };
  writeStore(store);
}

