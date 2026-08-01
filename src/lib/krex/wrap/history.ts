import type { KrexWrapRecord, KrexWrapStatus } from './types';

const STORAGE_KEY = 'kx_krex_wrap_history_v1';
const MAX_RECORDS = 50;

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readAll(): KrexWrapRecord[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as KrexWrapRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(records: KrexWrapRecord[]): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, MAX_RECORDS)));
  } catch {
    // ignore quota
  }
}

export function listKrexWrapHistory(wallet?: string | null): KrexWrapRecord[] {
  const all = readAll();
  if (!wallet) return all;
  const norm = wallet.replace(/^kaspa:/i, '').toLowerCase();
  return all.filter((r) => r.wallet.replace(/^kaspa:/i, '').toLowerCase() === norm);
}

export function upsertKrexWrapRecord(
  partial: Omit<KrexWrapRecord, 'createdAt' | 'updatedAt'> & {
    createdAt?: string;
    updatedAt?: string;
  },
): KrexWrapRecord {
  const now = new Date().toISOString();
  const all = readAll();
  const idx = all.findIndex((r) => r.id === partial.id);
  const next: KrexWrapRecord = {
    ...partial,
    createdAt: partial.createdAt ?? now,
    updatedAt: now,
  };
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...next, createdAt: all[idx].createdAt, updatedAt: now };
    writeAll(all);
    return all[idx];
  }
  writeAll([next, ...all]);
  return next;
}

export function updateKrexWrapStatus(
  id: string,
  status: KrexWrapStatus,
  patch?: Partial<KrexWrapRecord>,
): KrexWrapRecord | null {
  const all = readAll();
  const idx = all.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  const updated: KrexWrapRecord = {
    ...all[idx],
    ...patch,
    status,
    updatedAt: new Date().toISOString(),
  };
  all[idx] = updated;
  writeAll(all);
  return updated;
}

export function newKrexWrapId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `wrap-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
