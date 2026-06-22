import { COVENANT_LAB_CONFIG } from './config';
import type { CovenantRuntime } from './runtime';
import type { SplitPaymentRuntime } from './split-runtime';
import { getCovenantSimulatorRuntime } from './simulator';
import { getSplitPaymentSimulatorRuntime } from './split-simulator';

export * from './types';
export * from './split-types';
export * from './config';
export * from './runtime';
export * from './split-runtime';
export { getCovenantSimulatorRuntime } from './simulator';
export { getSplitPaymentSimulatorRuntime } from './split-simulator';
export { buildLockboxCommitNote, buildSplitCommitNote } from './payload';

/** Active runtime (simulator until Silverscript adapter ships). */
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
