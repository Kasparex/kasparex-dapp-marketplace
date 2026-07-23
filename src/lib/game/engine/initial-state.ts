import type { TyconGameState, DiamondVeinsConsumableInventory } from './types';

export const DEFAULT_POWER_CAP_MW = 12;

export const EMPTY_CONSUMABLES: DiamondVeinsConsumableInventory = {
  'field-ration': 0,
  'energy-drink': 0,
  'repair-kit': 0,
};

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
      { type: 'worker', nftId: null, collection: 'KREXPRIME', energy: 0, energyMax: 0 },
    ],
    lastRefinedAt: Date.now(),
    refinementPointsTotal: 0,
    diamondsEarnedLifetime: 0,
    miningRunEndTime: 0,
    miningRunMultiplier: 1,
    miningRunOptionIndex: null,
    activeBoosts: [],
    lastConnectedAt: null,
    lastConnectedAddress: null,
    lastIdleTickAt: null,
    machines: [],
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
    consumables: { ...EMPTY_CONSUMABLES },
  };
  return {
    ...base,
    ...overrides,
    diamondInventory: { ...base.diamondInventory, ...overrides?.diamondInventory },
    consumables: { ...base.consumables, ...overrides?.consumables },
  };
}
