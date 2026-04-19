import type { TyconGameState } from '@/lib/game/engine';
import { hydrateTyconState } from '@/lib/game/engine';

export interface StoredPlayer {
  address: string;
  state: TyconGameState;
  updatedAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __diamondVeinsPlayerStore: Map<string, StoredPlayer> | undefined;
}

function getStore(): Map<string, StoredPlayer> {
  if (!globalThis.__diamondVeinsPlayerStore) {
    globalThis.__diamondVeinsPlayerStore = new Map();
  }
  return globalThis.__diamondVeinsPlayerStore;
}

function normalizeAddress(addr: string): string {
  return addr.trim().toLowerCase();
}

export function getPlayerState(address: string): TyconGameState | null {
  const key = normalizeAddress(address);
  const row = getStore().get(key);
  return row ? hydrateTyconState(row.state) : null;
}

export function replacePlayerState(address: string, state: TyconGameState): TyconGameState {
  const key = normalizeAddress(address);
  const s = hydrateTyconState(state);
  getStore().set(key, {
    address: key,
    state: s,
    updatedAt: Date.now(),
  });
  return s;
}
