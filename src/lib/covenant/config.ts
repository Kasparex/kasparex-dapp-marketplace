import type { CovenantLabConfig, CovenantRuntimeMode } from './types';

const MIN_LOCK_KAS = 5;

function readRuntimeMode(): CovenantRuntimeMode {
  const raw = process.env.NEXT_PUBLIC_COVENANT_RUNTIME?.trim().toLowerCase();
  if (raw === 'silverscript' || raw === 'hybrid' || raw === 'simulator') {
    return raw;
  }
  return 'hybrid';
}

export const COVENANT_LAB_CONFIG: CovenantLabConfig = {
  minLockSompi: String(Math.round(MIN_LOCK_KAS * 100_000_000)),
  maxMemoLength: 120,
  storageKey: 'covenant_lockbox_v1',
  splitStorageKey: 'covenant_split_v1',
  milestoneStorageKey: 'covenant_milestone_v1',
  crowdfundStorageKey: 'covenant_crowdfund_v1',
  voucherStorageKey: 'covenant_voucher_v1',
  treasuryAddress:
    process.env.NEXT_PUBLIC_COVENANT_LAB_TREASURY?.trim() ||
    process.env.NEXT_PUBLIC_GAME_TREASURY_ADDRESS?.trim() ||
    '',
  runtimeMode: readRuntimeMode(),
};
