import {
  MINECORE_DAILY_GRID_POINTS_CAP,
  MINECORE_DAILY_KREX_POINTS_CAP,
  MINECORE_DISPLAY_POOL_GRID_REMAINING,
  MINECORE_DISPLAY_POOL_KREX_REMAINING,
  MINECORE_STORAGE_PREFIX,
} from '@/lib/game/minecore/config';
import { hydrateMinecoreState } from '@/lib/game/minecore/hydrate';
import { minecoreUtcDayKey } from '@/lib/game/minecore/plant-economy';

/** Display-only pool caps + today’s Minecore redeem headroom from persisted state (optional). */
export function readMinecorePoolAndDailyHeadroom(kaspaAddress: string): {
  poolGridRemaining: number;
  poolKrexRemaining: number;
  gridDailyCap: number;
  krexDailyCap: number;
  gridDailyRemainingPts: number;
  krexDailyRemainingPts: number;
} | null {
  const addr = (kaspaAddress ?? '').trim();
  if (!addr || typeof window === 'undefined') return null;
  const key = `${MINECORE_STORAGE_PREFIX}:${addr}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return {
        poolGridRemaining: MINECORE_DISPLAY_POOL_GRID_REMAINING,
        poolKrexRemaining: MINECORE_DISPLAY_POOL_KREX_REMAINING,
        gridDailyCap: MINECORE_DAILY_GRID_POINTS_CAP,
        krexDailyCap: MINECORE_DAILY_KREX_POINTS_CAP,
        gridDailyRemainingPts: MINECORE_DAILY_GRID_POINTS_CAP,
        krexDailyRemainingPts: MINECORE_DAILY_KREX_POINTS_CAP,
      };
    }
    const s = hydrateMinecoreState(JSON.parse(raw));
    const today = minecoreUtcDayKey(Date.now());
    const rb = s.redeemBudget;
    const gridSpent = rb?.dayKey === today ? Math.max(0, Math.floor(rb.refinementPointsSpentOnGrid ?? 0)) : 0;
    const krexSpent = rb?.dayKey === today ? Math.max(0, Math.floor(rb.refinementPointsSpentOnKrex ?? 0)) : 0;
    return {
      poolGridRemaining: MINECORE_DISPLAY_POOL_GRID_REMAINING,
      poolKrexRemaining: MINECORE_DISPLAY_POOL_KREX_REMAINING,
      gridDailyCap: MINECORE_DAILY_GRID_POINTS_CAP,
      krexDailyCap: MINECORE_DAILY_KREX_POINTS_CAP,
      gridDailyRemainingPts: Math.max(0, MINECORE_DAILY_GRID_POINTS_CAP - gridSpent),
      krexDailyRemainingPts: Math.max(0, MINECORE_DAILY_KREX_POINTS_CAP - krexSpent),
    };
  } catch {
    return null;
  }
}
