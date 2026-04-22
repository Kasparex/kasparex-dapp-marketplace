import { useCallback, useEffect, useMemo, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';

export type KrexBoosterState = {
  version: 1;
  /**
   * Active boosters keyed by game id.
   * Each booster is a simple multiplier that expires at `until`.
   */
  byGame: Record<
    string,
    {
      mult: number;
      until: number;
      txHash: string;
    }
  >;
};

const STORAGE_KEY = 'kasparex:krex-boosters:v1';

function loadState(): KrexBoosterState {
  if (typeof window === 'undefined') return { version: 1, byGame: {} };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: 1, byGame: {} };
    const parsed = JSON.parse(raw) as Partial<KrexBoosterState>;
    if (!parsed || typeof parsed !== 'object') return { version: 1, byGame: {} };
    return {
      version: 1,
      byGame: (parsed.byGame && typeof parsed.byGame === 'object' ? (parsed.byGame as any) : {}) ?? {},
    };
  } catch {
    return { version: 1, byGame: {} };
  }
}

function saveState(state: KrexBoosterState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function useKrexBoosters(gameId: string) {
  const { state: kaspaState } = useKaspaWallet();
  const walletKey = (kaspaState.address ?? 'disconnected').toLowerCase();

  const [store, setStore] = useState<KrexBoosterState>(() => loadState());

  useEffect(() => saveState(store), [store]);

  // Prune expired boosters occasionally
  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now();
      setStore((s) => {
        const next: KrexBoosterState = { version: 1, byGame: { ...s.byGame } };
        let changed = false;
        for (const [gid, b] of Object.entries(next.byGame)) {
          if (!b || typeof b.until !== 'number') continue;
          if (b.until <= now) {
            delete next.byGame[gid];
            changed = true;
          }
        }
        return changed ? next : s;
      });
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const active = store.byGame[gameId];
  const now = Date.now();
  const isActive = Boolean(active && active.until > now && active.mult > 1);

  const multiplier = useMemo(() => (isActive ? active!.mult : 1), [isActive, active]);
  const until = useMemo(() => (isActive ? active!.until : null), [isActive, active]);
  const txHash = useMemo(() => (isActive ? active!.txHash : null), [isActive, active]);

  const activate = useCallback(
    (input: { mult: number; durationMs: number; txHash: string }) => {
      const mult = Number(input.mult);
      const durationMs = Math.floor(Number(input.durationMs));
      const txHash = String(input.txHash || '').trim();
      if (!Number.isFinite(mult) || mult <= 1) return;
      if (!Number.isFinite(durationMs) || durationMs <= 0) return;
      if (!txHash) return;

      const until = Date.now() + durationMs;
      setStore((s) => ({
        version: 1,
        byGame: {
          ...s.byGame,
          [gameId]: { mult, until, txHash },
        },
      }));

      // Broadcast to other tabs
      try {
        window.dispatchEvent(new CustomEvent('kasparex:krex-booster', { detail: { gameId, mult, until, txHash, walletKey } }));
      } catch {
        // ignore
      }
    },
    [gameId, walletKey]
  );

  const clear = useCallback(() => {
    setStore((s) => {
      if (!s.byGame[gameId]) return s;
      const next = { version: 1 as const, byGame: { ...s.byGame } };
      delete next.byGame[gameId];
      return next;
    });
  }, [gameId]);

  return { multiplier, isActive, until, txHash, activate, clear };
}

