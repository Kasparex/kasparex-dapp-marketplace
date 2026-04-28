import {
  MINECORE_DEFAULT_NEXT_SLOT_COST_KAS,
  MINECORE_DEFAULT_PLANT_SLOTS,
  MINECORE_DEFAULT_SLOT_UNLOCK_COST_KAS,
  MINECORE_STARTER_INGREDIENTS,
  MINECORE_STARTER_OWNED,
} from './config';
import { minecoreUtcDayKey } from './plant-economy';
import type { MinecoreState, PlantSlotState } from './types';
import type { MiningSlot } from '@/lib/game/engine';

function createEmptySlot(index: number): PlantSlotState {
  return {
    id: `slot-${index + 1}`,
    index,
    unlocked: false,
    unlockCostKas: MINECORE_DEFAULT_SLOT_UNLOCK_COST_KAS,
    type: 'standard',
    status: 'EmptySlot',
    setup: {
      machineId: null,
      batteryIds: [null],
      workerId: null,
      moduleIds: [],
      boostId: 'none',
    },
    cycle: null,
    powerRemaining: 0,
    needsRepair: false,
    batterySlotChargeMs: [0],
    batterySnapshotAt: 0,
    diamondsAccumulated: 0,
    rollingCapWindowStartMs: 0,
    dailyCapMinedDiamonds: 0,
  };
}

export function createInitialMinecoreState(): MinecoreState {
  const nftSlots: MiningSlot[] = [
    { type: 'worker', nftId: null, collection: null },
    { type: 'operator', nftId: null, collection: null },
    { type: 'foreman', nftId: null, collection: null },
    { type: 'engineer', nftId: null, collection: null },
  ];
  return {
    version: 1,
    diamondsBalance: 0,
    refinementPointsTotal: 0,
    refinementPointsEarnedLifetime: 0,
    gridRedeemableTotal: 0,
    krexRedeemableTotal: 0,
    ingredients: { ...MINECORE_STARTER_INGREDIENTS },
    owned: {
      machines: { ...MINECORE_STARTER_OWNED.machines },
      batteries: { ...MINECORE_STARTER_OWNED.batteries },
      workers: { ...MINECORE_STARTER_OWNED.workers },
      modules: { ...MINECORE_STARTER_OWNED.modules },
    },
    plantSlots: (() => {
      const slots = Array.from({ length: MINECORE_DEFAULT_PLANT_SLOTS }, (_, i) => createEmptySlot(i));
      const first = slots[0];
      if (first) {
        first.unlocked = true;
        first.rollingCapWindowStartMs = Date.now();
      }
      return slots;
    })(),
    nextSlotCostKas: MINECORE_DEFAULT_NEXT_SLOT_COST_KAS,
    nftSlots,
    gridLedger: [],
    automation: { autoRestart: false, foremanActive: false },
    lastConnectedAt: null,
    lastConnectedAddress: null,
    redeemBudget: {
      dayKey: minecoreUtcDayKey(Date.now()),
      refinementPointsSpentOnGrid: 0,
      refinementPointsSpentOnKrex: 0,
    },
  };
}

