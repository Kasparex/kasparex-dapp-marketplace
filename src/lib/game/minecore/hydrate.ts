import type { MinecoreState, PlantSlotState } from './types';
import { createInitialMinecoreState } from './initial-state';
import { deriveState } from './compute';

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object';
}

function hydrateSlot(input: unknown, index: number): PlantSlotState {
  const base = createInitialMinecoreState().plantSlots[index] ?? createInitialMinecoreState().plantSlots[0]!;
  if (!isRecord(input)) return { ...base, index };

  const setup = isRecord(input.setup) ? input.setup : {};
  const cycle = isRecord(input.cycle) ? input.cycle : null;

  return {
    ...base,
    id: typeof input.id === 'string' ? input.id : base.id,
    index,
    unlocked: typeof input.unlocked === 'boolean' ? input.unlocked : base.unlocked,
    unlockCostKas: typeof input.unlockCostKas === 'number' ? input.unlockCostKas : base.unlockCostKas,
    type: typeof input.type === 'string' ? (input.type as any) : base.type,
    status: typeof input.status === 'string' ? (input.status as any) : base.status,
    setup: {
      machineId: typeof setup.machineId === 'string' ? (setup.machineId as any) : null,
      batteryId: typeof setup.batteryId === 'string' ? (setup.batteryId as any) : null,
      workerId: typeof setup.workerId === 'string' ? (setup.workerId as any) : null,
      moduleIds: Array.isArray(setup.moduleIds) ? (setup.moduleIds.filter((x) => typeof x === 'string') as any) : [],
      boostId: typeof setup.boostId === 'string' ? (setup.boostId as any) : 'none',
    },
    cycle:
      cycle && typeof cycle.startAtMs === 'number' && typeof cycle.endAtMs === 'number'
        ? {
            startAtMs: cycle.startAtMs,
            endAtMs: cycle.endAtMs,
            durationMs: typeof cycle.durationMs === 'number' ? cycle.durationMs : Math.max(0, cycle.endAtMs - cycle.startAtMs),
            expectedDiamonds: typeof cycle.expectedDiamonds === 'number' ? cycle.expectedDiamonds : 0,
          }
        : null,
    powerRemaining: typeof input.powerRemaining === 'number' ? input.powerRemaining : base.powerRemaining,
    needsRepair: typeof input.needsRepair === 'boolean' ? input.needsRepair : base.needsRepair,
    batteryChargeMs: typeof input.batteryChargeMs === 'number' ? input.batteryChargeMs : base.batteryChargeMs,
    batterySnapshotAt: typeof input.batterySnapshotAt === 'number' ? input.batterySnapshotAt : base.batterySnapshotAt,
  };
}

export function hydrateMinecoreState(input: unknown): MinecoreState {
  const base = createInitialMinecoreState();
  if (!isRecord(input)) return base;

  const plantSlotsRaw = Array.isArray(input.plantSlots) ? input.plantSlots : [];
  const plantSlots = plantSlotsRaw.length
    ? plantSlotsRaw.map((s, i) => hydrateSlot(s, i))
    : base.plantSlots;

  const out: MinecoreState = {
    ...base,
    version: typeof input.version === 'number' ? input.version : base.version,
    diamondsBalance: typeof input.diamondsBalance === 'number' ? input.diamondsBalance : base.diamondsBalance,
    refinementPointsTotal: typeof input.refinementPointsTotal === 'number' ? input.refinementPointsTotal : base.refinementPointsTotal,
    gridRedeemableTotal: typeof input.gridRedeemableTotal === 'number' ? input.gridRedeemableTotal : base.gridRedeemableTotal,
    ingredients: isRecord(input.ingredients) ? ({ ...base.ingredients, ...(input.ingredients as any) } as any) : base.ingredients,
    owned: isRecord(input.owned) ? ({ ...base.owned, ...(input.owned as any) } as any) : base.owned,
    plantSlots,
    nextSlotCostKas: typeof input.nextSlotCostKas === 'number' ? input.nextSlotCostKas : base.nextSlotCostKas,
    nftSlots: Array.isArray(input.nftSlots)
      ? (input.nftSlots
          .filter((x) => isRecord(x))
          .map((x) => ({
            type: typeof x.type === 'string' ? (x.type as any) : 'worker',
            nftId: typeof x.nftId === 'number' ? x.nftId : null,
            collection: typeof x.collection === 'string' ? x.collection : null,
          })) as any)
      : base.nftSlots,
    automation: isRecord(input.automation)
      ? {
          autoRestart: typeof input.automation.autoRestart === 'boolean' ? input.automation.autoRestart : base.automation.autoRestart,
          foremanActive: typeof input.automation.foremanActive === 'boolean' ? input.automation.foremanActive : base.automation.foremanActive,
        }
      : base.automation,
    lastConnectedAt: typeof input.lastConnectedAt === 'number' ? input.lastConnectedAt : base.lastConnectedAt,
    lastConnectedAddress: typeof input.lastConnectedAddress === 'string' ? input.lastConnectedAddress : base.lastConnectedAddress,
    gridLedger: Array.isArray(input.gridLedger)
      ? (input.gridLedger.filter((e) => e && typeof e === 'object') as any[]).map((e) => ({
          id: typeof e.id === 'string' ? e.id : `ledger_${Math.random().toString(36).slice(2)}`,
          at: typeof e.at === 'number' ? e.at : 0,
          refinementPoints: typeof e.refinementPoints === 'number' ? e.refinementPoints : 0,
          diamondsRefined: typeof e.diamondsRefined === 'number' ? e.diamondsRefined : 0,
          gridCheckpointScore: typeof e.gridCheckpointScore === 'number' ? e.gridCheckpointScore : 0,
          note: typeof e.note === 'string' ? e.note : '',
        }))
      : base.gridLedger,
  };

  return deriveState(out, Date.now());
}

