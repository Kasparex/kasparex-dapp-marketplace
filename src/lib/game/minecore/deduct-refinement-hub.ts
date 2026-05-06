import { MINECORE_STORAGE_PREFIX } from '@/lib/game/minecore/config';
import { hydrateMinecoreState } from '@/lib/game/minecore/hydrate';

/** Same-tab reload hook for `useMinecore` after external persisted edits (e.g. /rewards catalog spend). */
export const MINECORE_EXTERNAL_PERSIST_EVENT = 'kasparex-minecore-persisted';

export function broadcastMinecoreExternalPersist(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(MINECORE_EXTERNAL_PERSIST_EVENT));
}

/**
 * Subtract refinement points from persisted Minecore save (wallet-scoped).
 * Used when hub rewards spends unified redeemable: Minecore bucket is consumed before ledger remainder.
 */
export function deductMinecoreRefinementPointsPersisted(kaspaAddress: string, deduct: number): number {
  const addr = (kaspaAddress ?? '').trim();
  const d = Math.max(0, Math.floor(deduct));
  if (!addr || d <= 0 || typeof window === 'undefined') return 0;
  const key = `${MINECORE_STORAGE_PREFIX}:${addr}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return 0;
    const state = hydrateMinecoreState(JSON.parse(raw));
    const cur = Math.max(0, Math.floor(state.refinementPointsTotal ?? 0));
    const apply = Math.min(d, cur);
    if (apply <= 0) return 0;
    const next = {
      ...state,
      version: (state.version ?? 0) + 1,
      refinementPointsTotal: cur - apply,
    };
    localStorage.setItem(key, JSON.stringify(next));
    broadcastMinecoreExternalPersist();
    return apply;
  } catch {
    return 0;
  }
}
