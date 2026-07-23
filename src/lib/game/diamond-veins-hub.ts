import { hydrateTyconState } from '@/lib/game/engine/hydrate-shim';

export const DIAMOND_VEINS_STORAGE_PREFIX = 'diamond-veins-state';
export const DIAMOND_VEINS_EXTERNAL_PERSIST_EVENT = 'kasparex-diamond-veins-persisted';

export function diamondVeinsStorageKey(kaspaAddress: string): string {
  return `${DIAMOND_VEINS_STORAGE_PREFIX}:${(kaspaAddress ?? '').trim()}`;
}

export function broadcastDiamondVeinsExternalPersist(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(DIAMOND_VEINS_EXTERNAL_PERSIST_EVENT));
  window.dispatchEvent(new Event('kasparex-redeemable-breakdown-refresh'));
}

/**
 * Lightweight read of Diamond Veins refinement points from wallet-scoped save.
 * These points feed Hub /rewards totals; they are not a separate spendable in-game currency.
 */
export function readDiamondVeinsRefinementPointsTotal(kaspaAddress: string): number {
  if (typeof window === 'undefined') return 0;
  const addr = (kaspaAddress ?? '').trim();
  if (!addr) return 0;
  try {
    const raw = localStorage.getItem(diamondVeinsStorageKey(addr));
    if (!raw) return 0;
    const state = hydrateTyconState(JSON.parse(raw));
    const n = state.refinementPointsTotal;
    return typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  } catch {
    return 0;
  }
}

/**
 * Subtract refinement points from persisted Diamond Veins save (wallet-scoped).
 * Used when Hub catalog spends unified redeemable after Minecore bucket.
 */
export function deductDiamondVeinsRefinementPointsPersisted(kaspaAddress: string, deduct: number): number {
  const addr = (kaspaAddress ?? '').trim();
  const d = Math.max(0, Math.floor(deduct));
  if (!addr || d <= 0 || typeof window === 'undefined') return 0;
  const key = diamondVeinsStorageKey(addr);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return 0;
    const state = hydrateTyconState(JSON.parse(raw));
    const cur = Math.max(0, Math.floor(state.refinementPointsTotal ?? 0));
    const apply = Math.min(d, cur);
    if (apply <= 0) return 0;
    const next = {
      ...state,
      version: (state.version ?? 0) + 1,
      refinementPointsTotal: cur - apply,
    };
    localStorage.setItem(key, JSON.stringify(next));
    broadcastDiamondVeinsExternalPersist();
    return apply;
  } catch {
    return 0;
  }
}
