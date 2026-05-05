import { MINECORE_STORAGE_PREFIX } from '@/lib/game/minecore/config';
import { hydrateMinecoreState } from '@/lib/game/minecore/hydrate';

/**
 * Lightweight read of refinement points balance from persisted Minecore state (no hooks).
 */
export function readMinecoreRefinementPointsTotal(kaspaAddress: string): number {
  if (typeof window === 'undefined') return 0;
  const addr = (kaspaAddress ?? '').trim();
  if (!addr) return 0;
  const key = `${MINECORE_STORAGE_PREFIX}:${addr}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return 0;
    const state = hydrateMinecoreState(JSON.parse(raw));
    const n = state.refinementPointsTotal;
    return typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  } catch {
    return 0;
  }
}
