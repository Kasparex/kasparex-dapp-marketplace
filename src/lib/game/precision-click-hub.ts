import { PRECISION_CLICK_STORAGE_PREFIX } from '@/lib/game/precision-click/config';
import { REDEEMABLE_BREAKDOWN_REFRESH_EVENT } from '@/lib/game/minecore/deduct-refinement-hub';

export const PRECISION_CLICK_EXTERNAL_PERSIST_EVENT = 'kasparex-precision-click-persisted';

function storageKeys(kaspaAddress: string): string[] {
  const trimmed = (kaspaAddress ?? '').trim();
  const lower = trimmed.toLowerCase();
  return Array.from(
    new Set([`${PRECISION_CLICK_STORAGE_PREFIX}:${trimmed}`, `${PRECISION_CLICK_STORAGE_PREFIX}:${lower}`]),
  );
}

export function broadcastPrecisionClickExternalPersist(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(PRECISION_CLICK_EXTERNAL_PERSIST_EVENT));
  window.dispatchEvent(new Event(REDEEMABLE_BREAKDOWN_REFRESH_EVENT));
}

/**
 * Aria Fragments refine 1:1 into Hub redeemable points (Game Deck → /rewards).
 */
export function readPrecisionClickRefinementPointsTotal(kaspaAddress: string): number {
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

export function deductPrecisionClickRefinementPointsPersisted(kaspaAddress: string, deduct: number): number {
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
      broadcastPrecisionClickExternalPersist();
      return apply;
    } catch {
      // try next
    }
  }
  return 0;
}
