import type { CovenantLabConfig } from './types';

const MIN_LOCK_KAS = 0.05;

export const COVENANT_LAB_CONFIG: CovenantLabConfig = {
  minLockSompi: String(Math.round(MIN_LOCK_KAS * 100_000_000)),
  maxMemoLength: 120,
  storageKey: 'covenant_lockbox_v1',
  splitStorageKey: 'covenant_split_v1',
  treasuryAddress:
    process.env.NEXT_PUBLIC_COVENANT_LAB_TREASURY?.trim() ||
    process.env.NEXT_PUBLIC_GAME_TREASURY_ADDRESS?.trim() ||
    '',
  runtimeMode: 'simulator',
};
