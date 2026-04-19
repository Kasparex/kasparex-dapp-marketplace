import type { CipherVaultsState } from '@/lib/game/cipher-vaults-types';
import { createInitialCipherVaultsState } from '@/lib/game/cipher-vaults-types';

export interface StoredCipherPlayer {
  address: string;
  state: CipherVaultsState;
  updatedAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __cipherVaultsPlayerStore: Map<string, StoredCipherPlayer> | undefined;
}

function getStore(): Map<string, StoredCipherPlayer> {
  if (!globalThis.__cipherVaultsPlayerStore) {
    globalThis.__cipherVaultsPlayerStore = new Map();
  }
  return globalThis.__cipherVaultsPlayerStore;
}

function normalizeAddress(addr: string): string {
  return addr.trim().toLowerCase();
}

export function getCipherPlayerState(address: string): CipherVaultsState {
  const key = normalizeAddress(address);
  const row = getStore().get(key);
  return row?.state ?? createInitialCipherVaultsState();
}

export function replaceCipherPlayerState(address: string, state: CipherVaultsState): CipherVaultsState {
  const key = normalizeAddress(address);
  getStore().set(key, {
    address: key,
    state,
    updatedAt: Date.now(),
  });
  return state;
}

