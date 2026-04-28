import type { MinecoreRedeemBudget, MinecoreState, PlantSlotState } from './types';
import { MINECORE_INGREDIENT_KEYS } from './types';
import { createInitialMinecoreState } from './initial-state';
import { deriveState } from './compute';
import { minecoreUtcDayKey } from './plant-economy';
import { ensureBatterySlotChargeLength, getPlantBatterySlotCount } from './battery-utils';

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object';
}

function sanitizeIngredientBag(input: unknown, base: MinecoreState['ingredients']): MinecoreState['ingredients'] {
  if (!isRecord(input)) return { ...base };
  const next = { ...base };
  for (const k of MINECORE_INGREDIENT_KEYS) {
    const v = input[k];
    if (typeof v === 'number' && Number.isFinite(v)) next[k] = Math.max(0, Math.floor(v));
  }
  return next;
}

function hydrateSlot(input: unknown, index: number): PlantSlotState {
  const base = createInitialMinecoreState().plantSlots[index] ?? createInitialMinecoreState().plantSlots[0]!;
  if (!isRecord(input)) return { ...base, index };

  const setup = isRecord(input.setup) ? input.setup : {};
  const cycle = isRecord(input.cycle) ? input.cycle : null;
  const plantType = typeof input.type === 'string' ? (input.type as PlantSlotState['type']) : base.type;
  const nBat = getPlantBatterySlotCount(plantType);
  const legacyBattery = typeof setup.batteryId === 'string' ? (setup.batteryId as any) : null;
  const rawIds = Array.isArray(setup.batteryIds) ? (setup.batteryIds as unknown[]).map((x) => (typeof x === 'string' ? x : null)) : null;
  const batteryIds = Array.from({ length: nBat }, (_, i) => {
    if (rawIds && i < rawIds.length) return rawIds[i] as any;
    if (i === 0 && legacyBattery) return legacyBattery;
    return null;
  });

  const legacyCharge = typeof input.batteryChargeMs === 'number' ? input.batteryChargeMs : null;
  const rawSlotCh = Array.isArray((input as any).batterySlotChargeMs) ? (input as any).batterySlotChargeMs as number[] : null;
  let batterySlotChargeMs: number[];
  if (rawSlotCh && rawSlotCh.length > 0) {
    batterySlotChargeMs = ensureBatterySlotChargeLength(rawSlotCh, nBat, 0);
  } else if (legacyCharge != null && legacyCharge > 0) {
    batterySlotChargeMs = Array.from({ length: nBat }, (_, i) => (i === 0 ? legacyCharge : 0));
  } else {
    batterySlotChargeMs = Array.from({ length: nBat }, () => 0);
  }

  return {
    ...base,
    id: typeof input.id === 'string' ? input.id : base.id,
    index,
    unlocked: typeof input.unlocked === 'boolean' ? input.unlocked : base.unlocked,
    unlockCostKas: typeof input.unlockCostKas === 'number' ? input.unlockCostKas : base.unlockCostKas,
    type: plantType,
    status: typeof input.status === 'string' ? (input.status as any) : base.status,
    setup: {
      machineId: typeof setup.machineId === 'string' ? (setup.machineId as any) : null,
      batteryIds,
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
            mintedOffset: typeof cycle.mintedOffset === 'number' ? cycle.mintedOffset : 0,
            pauseBeganAtMs:
              cycle.pauseBeganAtMs != null && typeof cycle.pauseBeganAtMs === 'number' ? cycle.pauseBeganAtMs : null,
          }
        : null,
    powerRemaining: typeof input.powerRemaining === 'number' ? input.powerRemaining : base.powerRemaining,
    needsRepair: typeof input.needsRepair === 'boolean' ? input.needsRepair : base.needsRepair,
    batterySlotChargeMs,
    batterySnapshotAt: typeof input.batterySnapshotAt === 'number' ? input.batterySnapshotAt : base.batterySnapshotAt,
    diamondsAccumulated: typeof input.diamondsAccumulated === 'number' ? input.diamondsAccumulated : base.diamondsAccumulated,
    rollingCapWindowStartMs: (() => {
      const raw = input.rollingCapWindowStartMs;
      const n = typeof raw === 'number' && raw > 0 ? raw : 0;
      const unlocked = typeof input.unlocked === 'boolean' ? input.unlocked : base.unlocked;
      if (n > 0) return n;
      if (unlocked) return Date.now();
      return 0;
    })(),
    dailyCapMinedDiamonds:
      typeof input.dailyCapMinedDiamonds === 'number' ? input.dailyCapMinedDiamonds : base.dailyCapMinedDiamonds,
  };
}

export function hydrateMinecoreState(input: unknown): MinecoreState {
  const base = createInitialMinecoreState();
  if (!isRecord(input)) return base;

  const plantSlotsRaw = Array.isArray(input.plantSlots) ? input.plantSlots : [];
  const plantSlots = plantSlotsRaw.length
    ? plantSlotsRaw.map((s, i) => hydrateSlot(s, i))
    : base.plantSlots;

  const rawBudget = isRecord(input.redeemBudget) ? input.redeemBudget : null;
  const redeemBudget: MinecoreRedeemBudget = rawBudget
    ? {
        dayKey:
          typeof rawBudget.dayKey === 'string' && rawBudget.dayKey.length >= 8
            ? rawBudget.dayKey
            : minecoreUtcDayKey(Date.now()),
        refinementPointsSpentOnGrid:
          typeof rawBudget.refinementPointsSpentOnGrid === 'number'
            ? rawBudget.refinementPointsSpentOnGrid
            : 0,
        refinementPointsSpentOnKrex:
          typeof rawBudget.refinementPointsSpentOnKrex === 'number'
            ? rawBudget.refinementPointsSpentOnKrex
            : 0,
      }
    : base.redeemBudget;

  const out: MinecoreState = {
    ...base,
    version: typeof input.version === 'number' ? input.version : base.version,
    diamondsBalance: typeof input.diamondsBalance === 'number' ? input.diamondsBalance : base.diamondsBalance,
    refinementPointsTotal: typeof input.refinementPointsTotal === 'number' ? input.refinementPointsTotal : base.refinementPointsTotal,
    gridRedeemableTotal: typeof input.gridRedeemableTotal === 'number' ? input.gridRedeemableTotal : base.gridRedeemableTotal,
    krexRedeemableTotal:
      typeof input.krexRedeemableTotal === 'number' ? input.krexRedeemableTotal : base.krexRedeemableTotal,
    redeemBudget,
    ingredients: sanitizeIngredientBag(input.ingredients, base.ingredients),
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

