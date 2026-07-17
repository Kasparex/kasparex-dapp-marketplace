import { COVENANT_LAB_CONFIG } from './config';
import { getSilverscriptCovenantRuntime } from './silverscript-runtime';
import { getHybridCovenantRuntime } from './hybrid-runtime';
import {
  getSilverscriptSplitRuntime,
  getSilverscriptMilestoneRuntime,
  getSilverscriptCrowdfundRuntime,
  getSilverscriptVoucherRuntime,
} from './silverscript-extras';
import {
  getHybridSplitRuntime,
  getHybridMilestoneRuntime,
  getHybridCrowdfundRuntime,
  getHybridVoucherRuntime,
} from './hybrid-extras';
import type { CovenantRuntime } from './runtime';
import type { SplitPaymentRuntime } from './split-runtime';
import type { MilestoneRuntime } from './milestone-runtime';
import type { CrowdfundRuntime } from './crowdfund-runtime';
import type { VoucherRuntime } from './voucher-runtime';

function resolveMode() {
  return COVENANT_LAB_CONFIG.runtimeMode;
}

/** Prefer silverscript when env asks for removed simulator mode. */
function resolveL1Mode(): 'silverscript' | 'hybrid' {
  const mode = resolveMode();
  return mode === 'silverscript' ? 'silverscript' : 'hybrid';
}

export function getCovenantRuntime(): CovenantRuntime {
  return resolveL1Mode() === 'silverscript'
    ? getSilverscriptCovenantRuntime()
    : getHybridCovenantRuntime();
}

export function getSplitPaymentRuntime(): SplitPaymentRuntime {
  return resolveL1Mode() === 'silverscript'
    ? getSilverscriptSplitRuntime()
    : getHybridSplitRuntime();
}

export function getMilestoneRuntime(): MilestoneRuntime {
  return resolveL1Mode() === 'silverscript'
    ? getSilverscriptMilestoneRuntime()
    : getHybridMilestoneRuntime();
}

export function getCrowdfundRuntime(): CrowdfundRuntime {
  return resolveL1Mode() === 'silverscript'
    ? getSilverscriptCrowdfundRuntime()
    : getHybridCrowdfundRuntime();
}

export function getVoucherRuntime(): VoucherRuntime {
  return resolveL1Mode() === 'silverscript'
    ? getSilverscriptVoucherRuntime()
    : getHybridVoucherRuntime();
}

export function getActiveCovenantRuntimeMode() {
  return resolveL1Mode();
}
