import type { MiningSlot } from '@/lib/game/engine';
import type { MinecoreRedeemBudget, MinecoreState, PlantSlotState, PlantSetup, PlantCardStatus } from './types';
import { MINECORE_POWER_NODE_IDS } from './types';
import { MINECORE_INGREDIENT_KEYS } from './types';
import { createInitialMinecoreState } from './initial-state';
import { deriveState } from './compute';
import { minecoreUtcDayKey } from './plant-economy';
import { ensureBatterySlotChargeLength, getPlantBatterySlotCount } from './battery-utils';
import { enforcePlantInventoryInvariants } from './inventory-invariants';
import { normalizeWorkerDeckIndices } from './asset-usage';

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

/** Merge saved inventory maps into defaults - avoids wiping entire categories when persisted JSON only patches one rig type. */
function mergeOwnedInventory(input: unknown, base: MinecoreState['owned']): MinecoreState['owned'] {
  if (!isRecord(input)) return base;
  return {
    machines: { ...base.machines, ...(isRecord((input as Record<string, unknown>).machines) ? (input as any).machines : {}) },
    batteries: { ...base.batteries, ...(isRecord((input as Record<string, unknown>).batteries) ? (input as any).batteries : {}) },
    workers: { ...base.workers, ...(isRecord((input as Record<string, unknown>).workers) ? (input as any).workers : {}) },
    modules: { ...base.modules, ...(isRecord((input as Record<string, unknown>).modules) ? (input as any).modules : {}) },
    nodes: { ...base.nodes, ...(isRecord((input as Record<string, unknown>).nodes) ? (input as any).nodes : {}) },
  };
}

/**
 * Persist full NFT deck arrays (supports AddNftDeckSlot); legacy engineer → worker; booster cleared to empty worker row.
 * Always returns at least the default three rows; length is max(saved, defaults) so extras survive reload.
 */
export function normalizeMinecoreNftSlots(raw: unknown[]): MiningSlot[] {
  const defaults = createInitialMinecoreState().nftSlots;
  const fallbackExtra: MiningSlot = { type: 'worker', nftId: null, collection: null };

  const coerceRole = (t: string): 'worker' | 'operator' | 'foreman' => {
    if (t === 'engineer') return 'worker';
    if (t === 'worker' || t === 'operator' || t === 'foreman') return t;
    return 'worker';
  };

  if (!Array.isArray(raw) || raw.length === 0) return [...defaults];

  const len = Math.max(raw.length, defaults.length);
  const out: MiningSlot[] = [];
  for (let i = 0; i < len; i++) {
    const def = defaults[i] ?? fallbackExtra;
    const row = raw[i];
    if (!isRecord(row)) {
      out.push({ ...def });
      continue;
    }
    if (typeof row.type === 'string' && row.type === 'booster') {
      out.push({
        type: def.type,
        nftId: null,
        collection: null,
      });
      continue;
    }
    const role = typeof row.type === 'string' ? coerceRole(row.type) : 'worker';
    const nftId = typeof row.nftId === 'number' ? row.nftId : null;
    const collection = typeof row.collection === 'string' ? row.collection : null;
    const pr = row.minecorePerkTier;
    const minecorePerkTier =
      pr === 'regular' || pr === 'diamond' || pr === 'rarest' ? pr : undefined;
    const slot: MiningSlot = { type: role, nftId, collection };
    if (nftId != null && collection != null && minecorePerkTier) slot.minecorePerkTier = minecorePerkTier;
    out.push(slot);
  }
  return out;
}

/** Clear plant NFT deck pointers if persisted index is outside `nftSlots` after hydrate. */
function clampPlantSlotsNftDeckIndices(slots: PlantSlotState[], nftSlotCount: number): PlantSlotState[] {
  return slots.map((p) => {
    const raw = p.setup.workerNftDeckSlotIndices ?? [];
    const next = raw.map((idx) => {
      if (idx == null) return null;
      return idx >= nftSlotCount ? null : idx;
    });
    return {
      ...p,
      setup: { ...p.setup, workerNftDeckSlotIndices: next },
    };
  });
}

function mapLegacyPlantStatus(raw: string): PlantCardStatus {
  if (raw === 'ExtractionReady') return 'CreditingReady';
  return raw as PlantCardStatus;
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

  const rawWorkerArr = Array.isArray(setup.workerNftDeckSlotIndices)
    ? (setup.workerNftDeckSlotIndices as unknown[]).map((x) =>
        typeof x === 'number' && Number.isFinite(x) ? Math.max(0, Math.floor(x)) : null,
      )
    : undefined;
  const legacyOne =
    typeof setup.workerNftDeckSlotIndex === 'number' && Number.isFinite(setup.workerNftDeckSlotIndex)
      ? Math.max(0, Math.floor(setup.workerNftDeckSlotIndex as number))
      : undefined;
  const rawPowerNode = typeof setup.powerNodeId === 'string' ? setup.powerNodeId : null;
  const powerNodeId =
    rawPowerNode && (MINECORE_POWER_NODE_IDS as readonly string[]).includes(rawPowerNode) ? rawPowerNode : null;

  const workerNftDeckSlotIndices = normalizeWorkerDeckIndices(plantType, {
    machineId: null,
    powerNodeId: null,
    batteryIds: [],
    moduleIds: [],
    boostId: 'none',
    ...(rawWorkerArr != null ? { workerNftDeckSlotIndices: rawWorkerArr as (number | null)[] } : {}),
    ...(legacyOne !== undefined ? { workerNftDeckSlotIndex: legacyOne } : {}),
  } as PlantSetup & { workerNftDeckSlotIndex?: number });

  return {
    ...base,
    id: typeof input.id === 'string' ? input.id : base.id,
    index,
    unlocked: typeof input.unlocked === 'boolean' ? input.unlocked : base.unlocked,
    unlockCostKas: typeof input.unlockCostKas === 'number' ? input.unlockCostKas : base.unlockCostKas,
    type: plantType,
    status: typeof input.status === 'string' ? mapLegacyPlantStatus(input.status as string) : base.status,
    setup: {
      machineId: typeof setup.machineId === 'string' ? (setup.machineId as any) : null,
      powerNodeId,
      batteryIds,
      /* LEGACY saves may contain setup.workerId / fabricated workforce - ignored; use NFT decks only. */
      workerNftDeckSlotIndices,
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
    plantLastServicedAtMs: (() => {
      const raw = (input as Record<string, unknown>).plantLastServicedAtMs;
      if (typeof raw === 'number' && raw > 0) return raw;
      const unlocked = typeof input.unlocked === 'boolean' ? input.unlocked : base.unlocked;
      const roll = typeof input.rollingCapWindowStartMs === 'number' ? input.rollingCapWindowStartMs : 0;
      if (unlocked && roll > 0) return roll;
      return base.plantLastServicedAtMs;
    })(),
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

  const nftSlots = Array.isArray(input.nftSlots) ? normalizeMinecoreNftSlots(input.nftSlots as unknown[]) : base.nftSlots;
  const plantSlotsHydrated = clampPlantSlotsNftDeckIndices(plantSlots, nftSlots.length);

  const out: MinecoreState = {
    ...base,
    version: typeof input.version === 'number' ? input.version : base.version,
    diamondsBalance: typeof input.diamondsBalance === 'number' ? input.diamondsBalance : base.diamondsBalance,
    refinementPointsTotal: typeof input.refinementPointsTotal === 'number' ? input.refinementPointsTotal : base.refinementPointsTotal,
    refinementPointsEarnedLifetime: (() => {
      if (typeof (input as any).refinementPointsEarnedLifetime === 'number') {
        return (input as any).refinementPointsEarnedLifetime as number;
      }
      const ledger = Array.isArray(input.gridLedger) ? input.gridLedger : [];
      return ledger.reduce(
        (acc, e: any) => acc + (typeof e?.refinementPoints === 'number' ? e.refinementPoints : 0),
        0,
      );
    })(),
    gridRedeemableTotal: typeof input.gridRedeemableTotal === 'number' ? input.gridRedeemableTotal : base.gridRedeemableTotal,
    krexRedeemableTotal:
      typeof input.krexRedeemableTotal === 'number' ? input.krexRedeemableTotal : base.krexRedeemableTotal,
    redeemBudget,
    ingredients: sanitizeIngredientBag(input.ingredients, base.ingredients),
    owned: mergeOwnedInventory(input.owned, base.owned),
    plantSlots: plantSlotsHydrated,
    nextSlotCostKas: typeof input.nextSlotCostKas === 'number' ? input.nextSlotCostKas : base.nextSlotCostKas,
    nftSlots,
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

  const repaired = enforcePlantInventoryInvariants(out);
  return deriveState(repaired, Date.now());
}

