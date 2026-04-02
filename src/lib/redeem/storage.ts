import type { RedeemItemId } from './catalog';

export type RedeemLedgerEntry = {
  id: string;
  wallet: string;
  seasonId: string;
  itemId: RedeemItemId;
  costPoints: number;
  redeemedAtMs: number;
};

const STORAGE_KEY = 'kasparex_redeem_ledger_v1';

function readAll(): RedeemLedgerEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as RedeemLedgerEntry[];
  } catch {
    return [];
  }
}

function writeAll(entries: RedeemLedgerEntry[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function listRedeemsForWalletSeason(wallet: string, seasonId: string): RedeemLedgerEntry[] {
  const w = (wallet ?? '').trim().toLowerCase();
  const s = (seasonId ?? '').trim();
  if (!w || !s) return [];
  return readAll().filter((e) => e.wallet.toLowerCase() === w && e.seasonId === s);
}

export function sumRedeemedPoints(wallet: string, seasonId: string): number {
  return listRedeemsForWalletSeason(wallet, seasonId).reduce((acc, e) => acc + (Number(e.costPoints) || 0), 0);
}

export function recordRedeem(entry: Omit<RedeemLedgerEntry, 'id' | 'redeemedAtMs'>) {
  const now = Date.now();
  const id = `${entry.wallet}:${entry.seasonId}:${entry.itemId}:${now}`;
  const next: RedeemLedgerEntry = { ...entry, id, redeemedAtMs: now };
  const all = readAll();
  all.unshift(next);
  writeAll(all.slice(0, 500));
  return next;
}

