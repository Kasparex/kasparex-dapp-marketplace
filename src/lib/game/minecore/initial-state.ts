import {
  MINECORE_DEFAULT_NEXT_SLOT_COST_KAS,
  MINECORE_DEFAULT_PLANT_SLOTS,
  MINECORE_DEFAULT_SLOT_UNLOCK_COST_KAS,
  MINECORE_STARTER_INGREDIENTS,
  MINECORE_STARTER_OWNED,
} from './config';
import type { MinecoreState, PlantSlotState } from './types';

function createEmptySlot(index: number): PlantSlotState {
  return {
    id: `slot-${index + 1}`,
    index,
    unlocked: false,
    unlockCostKas: MINECORE_DEFAULT_SLOT_UNLOCK_COST_KAS,
    status: 'EmptySlot',
    setup: {
      machineId: null,
      batteryId: null,
      workerId: null,
      moduleIds: [],
      boostId: 'none',
    },
    cycle: null,
    powerRemaining: 0,
    needsRepair: false,
  };
}

export function createInitialMinecoreState(): MinecoreState {
  return {
    version: 1,
    diamondsBalance: 0,
    refinementPointsTotal: 0,
    gridRedeemableTotal: 0,
    ingredients: { ...MINECORE_STARTER_INGREDIENTS },
    owned: {
      machines: { ...MINECORE_STARTER_OWNED.machines },
      batteries: { ...MINECORE_STARTER_OWNED.batteries },
      workers: { ...MINECORE_STARTER_OWNED.workers },
      modules: { ...MINECORE_STARTER_OWNED.modules },
    },
    plantSlots: Array.from({ length: MINECORE_DEFAULT_PLANT_SLOTS }, (_, i) => createEmptySlot(i)),
    nextSlotCostKas: MINECORE_DEFAULT_NEXT_SLOT_COST_KAS,
    lastConnectedAt: null,
    lastConnectedAddress: null,
  };
}

