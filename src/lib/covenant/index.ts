import { COVENANT_LAB_CONFIG } from './config';
import type { CovenantRuntime } from './runtime';
import type { SplitPaymentRuntime } from './split-runtime';
import { getCovenantSimulatorRuntime } from './simulator';
import { getSplitPaymentSimulatorRuntime } from './split-simulator';
import { getMilestoneSimulator } from './milestone-simulator';
import { getCrowdfundSimulator } from './crowdfund-simulator';
import { getVoucherSimulator } from './voucher-simulator';

export * from './types';
export * from './split-types';
export * from './milestone-types';
export * from './crowdfund-types';
export * from './voucher-types';
export * from './config';
export * from './runtime';
export * from './split-runtime';
export { getCovenantSimulatorRuntime } from './simulator';
export { getSplitPaymentSimulatorRuntime } from './split-simulator';
export { getMilestoneSimulator } from './milestone-simulator';
export { getCrowdfundSimulator } from './crowdfund-simulator';
export { getVoucherSimulator } from './voucher-simulator';
export {
  buildLockboxCommitNote,
  buildSplitCommitNote,
  buildMilestoneCommitNote,
  buildCrowdfundPledgeNote,
  buildVoucherCommitNote,
} from './payload';
export { payCovenantTreasury } from './treasury';
export { sha256Hex, sompiToKasNumber, kasToSompiString, randomHex } from './utils';

export function getCovenantRuntime(): CovenantRuntime {
  switch (COVENANT_LAB_CONFIG.runtimeMode) {
    case 'simulator':
    default:
      return getCovenantSimulatorRuntime();
  }
}

export function getSplitPaymentRuntime(): SplitPaymentRuntime {
  switch (COVENANT_LAB_CONFIG.runtimeMode) {
    case 'simulator':
    default:
      return getSplitPaymentSimulatorRuntime();
  }
}
