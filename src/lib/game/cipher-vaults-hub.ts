import { CIPHER_VAULTS_STORAGE_PREFIX } from '@/lib/game/cipher-vaults-config';
import { REDEEMABLE_BREAKDOWN_REFRESH_EVENT } from '@/lib/game/minecore/deduct-refinement-hub';

export const CIPHER_VAULTS_EXTERNAL_PERSIST_EVENT = 'kasparex-cipher-vaults-persisted';

function storageKeys(kaspaAddress: string): string[] {
  const trimmed = (kaspaAddress ?? '').trim();
  const lower = trimmed.toLowerCase();
  return Array.from(new Set([`${CIPHER_VAULTS_STORAGE_PREFIX}:${trimmed}`, `${CIPHER_VAULTS_STORAGE_PREFIX}:${lower}`]));
}

export function broadcastCipherVaultsExternalPersist(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(CIPHER_VAULTS_EXTERNAL_PERSIST_EVENT));
  window.dispatchEvent(new Event(REDEEMABLE_BREAKDOWN_REFRESH_EVENT));
}

/**
 * Cipher Fragments refine 1:1 into Hub redeemable points (Game Deck → /rewards).
 */
export function readCipherVaultsRefinementPointsTotal(kaspaAddress: string): number {
  if (typeof window === 'undefined') return 0;
  const addr = (kaspaAddress ?? '').trim();
  if (!addr) return 0;
  for (const key of storageKeys(addr)) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as { refinementPointsTotal?: number };
      const n = parsed.refinementPointsTotal;
      if (typeof n === 'number' && Number.isFinite(n)) return Math.max(0, Math.floor(n));
    } catch {
      // try next
    }
  }
  return 0;
}

export function deductCipherVaultsRefinementPointsPersisted(kaspaAddress: string, deduct: number): number {
  const addr = (kaspaAddress ?? '').trim();
  const d = Math.max(0, Math.floor(deduct));
  if (!addr || d <= 0 || typeof window === 'undefined') return 0;
  for (const key of storageKeys(addr)) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const state = JSON.parse(raw) as Record<string, unknown>;
      const cur = Math.max(0, Math.floor(Number(state.refinementPointsTotal ?? 0)));
      const apply = Math.min(d, cur);
      if (apply <= 0) return 0;
      localStorage.setItem(
        key,
        JSON.stringify({
          ...state,
          refinementPointsTotal: cur - apply,
          updatedAt: Date.now(),
        }),
      );
      broadcastCipherVaultsExternalPersist();
      return apply;
    } catch {
      // try next
    }
  }
  return 0;
}
