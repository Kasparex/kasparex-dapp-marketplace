import { COVENANT_LAB_CONFIG } from './config';
import { getCovenantSimulatorRuntime } from './simulator';
import { getSilverscriptCovenantRuntime } from './silverscript-runtime';
import { getHybridCovenantRuntime } from './hybrid-runtime';
import { getSplitPaymentSimulatorRuntime } from './split-simulator';
import { getSilverscriptSplitRuntime } from './silverscript-extras';
import { getHybridSplitRuntime } from './hybrid-extras';
import { getMilestoneSimulator } from './milestone-simulator';
import { getSilverscriptMilestoneRuntime } from './silverscript-extras';
import { getHybridMilestoneRuntime } from './hybrid-extras';
import { getCrowdfundSimulator } from './crowdfund-simulator';
import { getSilverscriptCrowdfundRuntime } from './silverscript-extras';
import { getHybridCrowdfundRuntime } from './hybrid-extras';
import { getVoucherSimulator } from './voucher-simulator';
import { getSilverscriptVoucherRuntime } from './silverscript-extras';
import { getHybridVoucherRuntime } from './hybrid-extras';
import type { CovenantRuntime } from './runtime';
import type { SplitPaymentRuntime } from './split-runtime';
import type { MilestoneRuntime } from './milestone-runtime';
import type { CrowdfundRuntime } from './crowdfund-runtime';
import type { VoucherRuntime } from './voucher-runtime';

function resolveMode() {
  return COVENANT_LAB_CONFIG.runtimeMode;
}

export function getCovenantRuntime(): CovenantRuntime {
  switch (resolveMode()) {
    case 'silverscript':
      return getSilverscriptCovenantRuntime();
    case 'hybrid':
      return getHybridCovenantRuntime();
    case 'simulator':
    default:
      return getCovenantSimulatorRuntime();
  }
}

export function getSplitPaymentRuntime(): SplitPaymentRuntime {
  switch (resolveMode()) {
    case 'silverscript':
      return getSilverscriptSplitRuntime();
    case 'hybrid':
      return getHybridSplitRuntime();
    case 'simulator':
    default:
      return getSplitPaymentSimulatorRuntime();
  }
}

export function getMilestoneRuntime(): MilestoneRuntime {
  switch (resolveMode()) {
    case 'silverscript':
      return getSilverscriptMilestoneRuntime();
    case 'hybrid':
      return getHybridMilestoneRuntime();
    case 'simulator':
    default:
      return getMilestoneSimulator();
  }
}

export function getCrowdfundRuntime(): CrowdfundRuntime {
  switch (resolveMode()) {
    case 'silverscript':
      return getSilverscriptCrowdfundRuntime();
    case 'hybrid':
      return getHybridCrowdfundRuntime();
    case 'simulator':
    default:
      return getCrowdfundSimulator();
  }
}

export function getVoucherRuntime(): VoucherRuntime {
  switch (resolveMode()) {
    case 'silverscript':
      return getSilverscriptVoucherRuntime();
    case 'hybrid':
      return getHybridVoucherRuntime();
    case 'simulator':
    default:
      return getVoucherSimulator();
  }
}

export function getActiveCovenantRuntimeMode() {
  return resolveMode();
}
