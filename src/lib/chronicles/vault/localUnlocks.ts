import type { ChroniclesContentId } from '@/lib/chronicles/entitlements/types';

export const CHRONICLES_VAULT_UNLOCK_STORAGE_KEY = 'chronicles-vault-unlocks-v1';

type StoredRow = { ids: string[]; txs?: Record<string, string> };

function safeParse(raw: string | null): Record<string, StoredRow> {
  if (!raw) return {};
  try {
    const p = JSON.parse(raw) as Record<string, StoredRow>;
    return typeof p === 'object' && p !== null ? p : {};
  } catch {
    return {};
  }
}

export function readVaultUnlockStore(): Record<string, StoredRow> {
  if (typeof window === 'undefined') return {};
  try {
    return safeParse(localStorage.getItem(CHRONICLES_VAULT_UNLOCK_STORAGE_KEY));
  } catch {
    return {};
  }
}

function normalizeAddr(a: string): string {
  const t = a.trim();
  if (!t) return '';
  return t.startsWith('kaspa:') ? t : `kaspa:${t}`;
}

export function getLocalVaultUnlockedIds(address: string | null | undefined): ChroniclesContentId[] {
  if (!address) return [];
  const key = normalizeAddr(address);
  const row = readVaultUnlockStore()[key];
  return Array.isArray(row?.ids) ? (row.ids as ChroniclesContentId[]) : [];
}

export function recordVaultUnlock(address: string, offerId: ChroniclesContentId, txHash: string): void {
  if (typeof window === 'undefined') return;
  const key = normalizeAddr(address);
  const all = readVaultUnlockStore();
  const prev = all[key] ?? { ids: [] };
  const ids = new Set(prev.ids);
  ids.add(offerId);
  all[key] = {
    ids: Array.from(ids),
    txs: { ...prev.txs, [offerId]: txHash },
  };
  try {
    localStorage.setItem(CHRONICLES_VAULT_UNLOCK_STORAGE_KEY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent('chronicles-vault-unlock'));
  } catch {
    /* quota / private mode */
  }
}

export function dispatchVaultUnlockEvent(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('chronicles-vault-unlock'));
}
