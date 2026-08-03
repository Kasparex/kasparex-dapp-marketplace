import type { KrexWrapRecord, KrexWrapStatus } from './types';

const STORAGE_KEY = 'kx_krex_wrap_history_v1';
const MAX_RECORDS = 50;

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function normalizeRecord(raw: Partial<KrexWrapRecord> & { id?: string }): KrexWrapRecord | null {
  if (!raw?.id) return null;
  const amount =
    typeof raw.amount === 'number' && Number.isFinite(raw.amount)
      ? raw.amount
      : typeof raw.amountKrex === 'number' && Number.isFinite(raw.amountKrex)
        ? raw.amountKrex
        : 0;
  const tick = (raw.tick || 'KREX').trim().toUpperCase() || 'KREX';
  const createdAt = raw.createdAt || new Date().toISOString();
  const updatedAt = raw.updatedAt || createdAt;
  return {
    id: raw.id,
    createdAt,
    updatedAt,
    wallet: raw.wallet || '',
    tick,
    network: raw.network === 'testnet-10' ? 'testnet-10' : raw.network === 'mainnet' ? 'mainnet' : undefined,
    amount,
    amountKrex: amount,
    feeKas: typeof raw.feeKas === 'number' ? raw.feeKas : 0,
    feeTxHash: raw.feeTxHash,
    depositTxHash: raw.depositTxHash,
    mintTxHash: raw.mintTxHash,
    status: (raw.status as KrexWrapStatus) || 'draft',
    note: raw.note,
  };
}

function readAll(): KrexWrapRecord[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<KrexWrapRecord>[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((row) => normalizeRecord(row))
      .filter((row): row is KrexWrapRecord => Boolean(row));
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
  partial: Omit<KrexWrapRecord, 'createdAt' | 'updatedAt' | 'amount' | 'tick'> & {
    amount?: number;
    amountKrex?: number;
    tick?: string;
    createdAt?: string;
    updatedAt?: string;
  },
): KrexWrapRecord {
  const now = new Date().toISOString();
  const amount =
    typeof partial.amount === 'number'
      ? partial.amount
      : typeof partial.amountKrex === 'number'
        ? partial.amountKrex
        : 0;
  const tick = (partial.tick || 'KREX').trim().toUpperCase() || 'KREX';
  const all = readAll();
  const idx = all.findIndex((r) => r.id === partial.id);
  const next: KrexWrapRecord = {
    ...partial,
    tick,
    amount,
    amountKrex: amount,
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
  if (typeof updated.amount !== 'number' && typeof updated.amountKrex === 'number') {
    updated.amount = updated.amountKrex;
  }
  if (updated.tick) updated.tick = updated.tick.toUpperCase();
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
