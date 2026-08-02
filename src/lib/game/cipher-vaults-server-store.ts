import type { CipherVaultsState } from '@/lib/game/cipher-vaults-types';
import { createInitialCipherVaultsState } from '@/lib/game/cipher-vaults-types';

type StoredCipherPlayer = {
  address: string;
  state: CipherVaultsState;
  updatedAt: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __cipherVaultsPlayerStore: Map<string, StoredCipherPlayer> | undefined;
}

function store(): Map<string, StoredCipherPlayer> {
  if (!globalThis.__cipherVaultsPlayerStore) {
    globalThis.__cipherVaultsPlayerStore = new Map();
  }
  return globalThis.__cipherVaultsPlayerStore;
}

function key(address: string) {
  return address.trim().toLowerCase();
}

export function getCipherPlayerState(address: string): CipherVaultsState {
  const row = store().get(key(address));
  return row?.state ?? createInitialCipherVaultsState(address);
}

export function replaceCipherPlayerState(address: string, state: CipherVaultsState): CipherVaultsState {
  const next = { ...state, walletAddress: address, updatedAt: Date.now() };
  store().set(key(address), { address, state: next, updatedAt: Date.now() });
  return next;
}
