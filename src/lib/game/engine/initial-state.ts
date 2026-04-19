import type { TyconGameState } from './types';

export const DEFAULT_POWER_CAP_MW = 12;

export function createInitialTyconState(overrides?: Partial<TyconGameState>): TyconGameState {
  const base: TyconGameState = {
    version: 1,
    diamonds: 0,
    diamondInventory: {
      chronoShard: 0,
      auroraCore: 0,
      cipherPrism: 0,
      eonCore: 0,
      eclipticFlame: 0,
      rubble: 0,
    },
    slots: [
      { type: 'worker', nftId: null, collection: 'KREXPRIME' },
      { type: 'operator', nftId: null, collection: 'PIXELKREX' },
      { type: 'booster', nftId: null, collection: null },
      { type: 'foreman', nftId: null, collection: 'PIXELKREX' },
      { type: 'engineer', nftId: null, collection: 'KREXPRIME' },
    ],
    lastRefinedAt: Date.now(),
    refinementPointsTotal: 0,
    miningRunEndTime: 0,
    miningRunMultiplier: 1,
    miningRunOptionIndex: null,
    activeBoosts: [],
    lastConnectedAt: null,
    lastConnectedAddress: null,
    machines: [{ id: 'surface-drill-mk1', count: 1, powerPerUnit: 2, yieldPerUnit: 1 }],
    powerCapMw: DEFAULT_POWER_CAP_MW,
    automation: {
      autoRestartMiningRun: false,
      autoRestartRunsCapPerDay: 0,
      autoRestartRunsUsedToday: 0,
      autoRestartLastUtcDate: null,
      foremanActive: false,
    },
    gridLedger: [],
    appliedReceiptIds: [],
  };
  return { ...base, ...overrides, diamondInventory: { ...base.diamondInventory, ...overrides?.diamondInventory } };
}
