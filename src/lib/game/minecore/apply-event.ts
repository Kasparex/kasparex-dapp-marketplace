import {
  MINECORE_DEFAULT_NEXT_SLOT_COST_KAS,
  MINECORE_DEFAULT_SLOT_UNLOCK_COST_KAS,
  MINECORE_BATTERIES,
  MINECORE_RECIPES,
  MINECORE_MAX_MODULES_BY_PLANT,
  MINECORE_REFINE_POINTS_PER_DIAMOND,
  MINECORE_GRID_PER_REFINEMENT_POINT,
  MINECORE_KREX_PER_REFINEMENT_POINT,
  MINECORE_DAILY_GRID_POINTS_CAP,
  MINECORE_DAILY_KREX_POINTS_CAP,
} from './config';
import {
  computePlantDurationMs,
  computePlantExpectedDiamonds,
  computePlantReady,
  computeLiveDiamonds,
  computeRawLiveDiamonds,
  computeLiveBatteryChargeMs,
  computeMinecoreDiamondsDisplayTotal,
  getBatteryCapacityMs,
  getPowerUnitCap,
  deriveSlotStatus,
  plantDailyCapPreventsNewCycle,
  syncPlantPowerUnitsToCapacity,
} from './compute';
import type { GridLedgerEntry } from '@/lib/game/engine';
import type { IngredientBag } from './types';
import type { MinecoreBatteryId, MinecoreEvent, MinecoreMachineId, MinecoreModuleId, MinecoreState, PlantSlotState } from './types';
import {
  canStartMiningByEfficiency,
  computeGlobalRefineBonusFraction,
  minecoreUtcDayKey,
} from './plant-economy';
import { creditPlantDailyCap, normalizeAllPlantRollingDailyCaps } from './daily-cap';

/** Preserve charge ratio when machine (charge budget) or battery changes. */
function rescaleBatteryToNewCapacity(slot: PlantSlotState, oldCapMs: number, at: number, now: number) {
  let liveMs: number;
  if (!slot.cycle) {
    liveMs = oldCapMs > 0 ? Math.min(slot.batteryChargeMs, oldCapMs) : slot.batteryChargeMs;
  } else if (slot.cycle.pauseBeganAtMs != null) {
    liveMs = slot.batteryChargeMs;
  } else {
    liveMs = computeLiveBatteryChargeMs(slot, now);
  }
  const newCap = getBatteryCapacityMs(slot);
  if (newCap <= 0) {
    slot.batteryChargeMs = 0;
  } else if (oldCapMs <= 0) {
    slot.batteryChargeMs = newCap;
  } else {
    const ratio = Math.min(1, Math.max(0, liveMs / oldCapMs));
    slot.batteryChargeMs = Math.max(0, Math.min(newCap, Math.floor(ratio * newCap)));
  }
  slot.batterySnapshotAt = at;
  slot.powerRemaining = Math.min(slot.powerRemaining, getPowerUnitCap(slot));
}

function cloneSlot(slot: PlantSlotState): PlantSlotState {
  return {
    ...slot,
    setup: { ...slot.setup, moduleIds: [...slot.setup.moduleIds] },
    cycle: slot.cycle ? { ...slot.cycle } : null,
  };
}

function nextVersion(state: MinecoreState): number {
  return (state.version ?? 0) + 1;
}

function rederive(state: MinecoreState, at: number): MinecoreState {
  const slots = state.plantSlots.map((s) => {
    const synced = syncPlantPowerUnitsToCapacity(s);
    return { ...synced, status: deriveSlotStatus(state, synced, at) };
  });
  return { ...state, plantSlots: slots };
}

export function applyMinecoreEvent(state: MinecoreState, ev: MinecoreEvent): MinecoreState {
  const now = 'at' in ev ? ev.at : Date.now();

  let s: MinecoreState = {
    ...state,
    version: nextVersion(state),
    ingredients: { ...state.ingredients },
    owned: {
      machines:  { ...state.owned.machines },
      batteries: { ...state.owned.batteries },
      workers:   { ...state.owned.workers },
      modules:   { ...state.owned.modules },
    },
    plantSlots: state.plantSlots.map(cloneSlot),
    nftSlots:   state.nftSlots ? state.nftSlots.map((x) => ({ ...x })) : [],
    gridLedger: [...(state.gridLedger ?? [])],
    automation: state.automation
      ? { ...state.automation }
      : { autoRestart: false, foremanActive: false },
    krexRedeemableTotal: state.krexRedeemableTotal ?? 0,
    redeemBudget: state.redeemBudget
      ? { ...state.redeemBudget }
      : { dayKey: minecoreUtcDayKey(now), refinementPointsSpentOnGrid: 0, refinementPointsSpentOnKrex: 0 },
  };

  normalizeAllPlantRollingDailyCaps(s.plantSlots, now);
  for (const slot of s.plantSlots) {
    if (slot.unlocked && slot.rollingCapWindowStartMs <= 0) {
      slot.rollingCapWindowStartMs = now;
    }
  }

  switch (ev.type) {
    case 'ConnectWallet': {
      s.lastConnectedAt      = ev.at;
      s.lastConnectedAddress = ev.address;
      return rederive(s, ev.at);
    }

    case 'AddIngredients': {
      const amt = Math.max(0, Math.floor(ev.amount));
      if (amt <= 0) return rederive(s, now);
      s.ingredients[ev.ingredient] = Math.max(0, (s.ingredients[ev.ingredient] ?? 0) + amt);
      return rederive(s, now);
    }

    case 'DeployNFT': {
      const slot = s.nftSlots?.[ev.slotIndex];
      if (!slot) return rederive(s, now);
      slot.nftId      = ev.nftId;
      slot.collection = ev.collection;
      s.automation.foremanActive = Boolean(s.nftSlots?.some((x) => x.type === 'foreman' && x.nftId != null));
      return rederive(s, now);
    }

    case 'RemoveNFT': {
      const slot = s.nftSlots?.[ev.slotIndex];
      if (!slot) return rederive(s, now);
      slot.nftId      = null;
      slot.collection = null;
      s.automation.foremanActive = Boolean(s.nftSlots?.some((x) => x.type === 'foreman' && x.nftId != null));
      return rederive(s, now);
    }

    case 'SetAutomation': {
      s.automation = { ...s.automation, ...ev.patch };
      return rederive(s, now);
    }

    case 'CraftRecipe': {
      const recipe = MINECORE_RECIPES.find((r) => r.id === ev.recipeId);
      if (!recipe) return rederive(s, now);

      for (const [k, v] of Object.entries(recipe.requires)) {
        const need = typeof v === 'number' ? v : 0;
        const have = s.ingredients[k as keyof typeof s.ingredients] ?? 0;
        if (have < need) return rederive(s, now);
      }
      for (const [k, v] of Object.entries(recipe.requires)) {
        const need = typeof v === 'number' ? v : 0;
        s.ingredients[k as keyof typeof s.ingredients] = Math.max(0, (s.ingredients[k as keyof typeof s.ingredients] ?? 0) - need);
      }

      if (recipe.kind === 'machine') s.owned.machines[recipe.outputId as MinecoreMachineId] = (s.owned.machines[recipe.outputId as MinecoreMachineId] ?? 0) + 1;
      if (recipe.kind === 'battery') s.owned.batteries[recipe.outputId as MinecoreBatteryId] = (s.owned.batteries[recipe.outputId as MinecoreBatteryId] ?? 0) + 1;
      if (recipe.kind === 'module')  s.owned.modules[recipe.outputId as MinecoreModuleId] = (s.owned.modules[recipe.outputId as MinecoreModuleId] ?? 0) + 1;

      return rederive(s, now);
    }

    case 'UnlockSlot': {
      const slot = s.plantSlots[ev.slotIndex];
      if (!slot) return rederive(s, now);
      slot.unlocked       = true;
      slot.unlockCostKas  = MINECORE_DEFAULT_SLOT_UNLOCK_COST_KAS;
      slot.rollingCapWindowStartMs = now;
      slot.dailyCapMinedDiamonds = 0;
      slot.powerRemaining = Math.max(slot.powerRemaining, 1);
      slot.needsRepair    = false;
      slot.cycle          = null;
      slot.batteryChargeMs  = getBatteryCapacityMs(slot);
      slot.batterySnapshotAt = now;
      slot.status = deriveSlotStatus(s, slot, now);
      return rederive(s, now);
    }

    case 'AddSlot': {
      const idx = s.plantSlots.length;
      const newSlot: PlantSlotState = {
        id:               `slot-${idx + 1}`,
        index:            idx,
        unlocked:         false,
        unlockCostKas:    MINECORE_DEFAULT_SLOT_UNLOCK_COST_KAS,
        status:           'EmptySlot',
        type:             'standard',
        setup:            { machineId: null, batteryId: null, workerId: null, moduleIds: [], boostId: 'none' },
        cycle:            null,
        powerRemaining:   0,
        needsRepair:      false,
        batteryChargeMs:  0,
        batterySnapshotAt: now,
        diamondsAccumulated: 0,
        rollingCapWindowStartMs: 0,
        dailyCapMinedDiamonds: 0,
      };
      s.plantSlots.push(newSlot);
      s.nextSlotCostKas = Math.max(MINECORE_DEFAULT_NEXT_SLOT_COST_KAS, s.nextSlotCostKas);
      return rederive(s, now);
    }

    case 'ChangePlantType': {
      const slot = s.plantSlots[ev.slotIndex];
      if (!slot || !slot.unlocked) return rederive(s, now);
      slot.type = ev.plantType;
      if (ev.plantType === 'standard') {
        slot.setup.moduleIds = [];
      } else {
        const max = MINECORE_MAX_MODULES_BY_PLANT[ev.plantType];
        slot.setup.moduleIds = slot.setup.moduleIds.slice(0, max);
      }
      slot.status = deriveSlotStatus(s, slot, now);
      return rederive(s, now);
    }

    case 'InstallPart': {
      const slot = s.plantSlots[ev.slotIndex];
      if (!slot || !slot.unlocked) return rederive(s, now);
      if (slot.cycle && slot.cycle.pauseBeganAtMs == null) {
        return rederive(s, now);
      }
      if (slot.cycle && slot.cycle.pauseBeganAtMs != null) {
        slot.diamondsAccumulated += computeLiveDiamonds(slot, now);
        slot.batteryChargeMs = computeLiveBatteryChargeMs(slot, now);
        slot.batterySnapshotAt = now;
        slot.cycle = null;
      }
      if (ev.part.kind === 'machine') {
        const oldCap = getBatteryCapacityMs(slot);
        slot.setup.machineId = ev.part.id;
        rescaleBatteryToNewCapacity(slot, oldCap, now, now);
      }
      if (ev.part.kind === 'battery') {
        const oldCap = getBatteryCapacityMs(slot);
        slot.setup.batteryId = ev.part.id;
        const b = ev.part.id ? MINECORE_BATTERIES[ev.part.id] : null;
        if (b) {
          rescaleBatteryToNewCapacity(slot, oldCap, now, now);
        } else {
          slot.batteryChargeMs = 0;
          slot.batterySnapshotAt = now;
        }
        slot.powerRemaining = Math.min(slot.powerRemaining, getPowerUnitCap(slot));
      }
      if (ev.part.kind === 'worker') slot.setup.workerId = ev.part.id;
      if (ev.part.kind === 'modules') {
        const max = MINECORE_MAX_MODULES_BY_PLANT[slot.type];
        const ids = slot.type === 'standard' ? [] : [...ev.part.ids].slice(0, max);
        slot.setup.moduleIds = ids;
      }
      if (ev.part.kind === 'boost') slot.setup.boostId = ev.part.id;
      slot.status = deriveSlotStatus(s, slot, now);
      return rederive(s, now);
    }

    case 'StartMining': {
      const slot = s.plantSlots[ev.slotIndex];
      if (!slot || !slot.unlocked) return rederive(s, now);
      if (slot.cycle) {
        return rederive(s, now);
      }
      if (!computePlantReady(slot)) return rederive(s, now);
      if (plantDailyCapPreventsNewCycle(s, slot, ev.at)) return rederive(s, now);
      if (slot.needsRepair) return rederive(s, now);
      if (!canStartMiningByEfficiency(slot)) return rederive(s, now);

      const durationMs       = computePlantDurationMs(slot);
      const expectedDiamonds = computePlantExpectedDiamonds(s, slot);
      if (durationMs <= 0 || expectedDiamonds <= 0) return rederive(s, now);

      slot.batteryChargeMs   = computeLiveBatteryChargeMs(slot, ev.at);
      slot.batterySnapshotAt = ev.at;

      if (slot.batteryChargeMs <= 0) return rederive(s, now);

      slot.powerRemaining = getPowerUnitCap(slot);

      slot.cycle = {
        startAtMs:        ev.at,
        endAtMs:          ev.at + durationMs,
        durationMs,
        expectedDiamonds,
        mintedOffset:     0,
        pauseBeganAtMs:   null,
      };
      slot.status = deriveSlotStatus(s, slot, now);
      return rederive(s, now);
    }

    case 'StopMining': {
      const slot = s.plantSlots[ev.slotIndex];
      if (!slot || !slot.unlocked || !slot.cycle) return rederive(s, now);
      if (slot.cycle.pauseBeganAtMs != null) return rederive(s, now);
      slot.batteryChargeMs = computeLiveBatteryChargeMs(slot, ev.at);
      slot.batterySnapshotAt = ev.at;
      slot.cycle = { ...slot.cycle, pauseBeganAtMs: ev.at };
      slot.status = deriveSlotStatus(s, slot, now);
      return rederive(s, now);
    }

    case 'ResumeMining': {
      const slot = s.plantSlots[ev.slotIndex];
      if (!slot || !slot.unlocked || !slot.cycle?.pauseBeganAtMs) return rederive(s, now);
      const p = slot.cycle.pauseBeganAtMs;
      const c = { ...slot.cycle, pauseBeganAtMs: null as number | null };
      c.endAtMs += ev.at - p;
      slot.cycle = c;
      slot.batterySnapshotAt = ev.at;
      slot.status = deriveSlotStatus(s, slot, now);
      return rederive(s, now);
    }

    case 'RefillBattery': {
      const slot = s.plantSlots[ev.slotIndex];
      if (!slot || !slot.unlocked || !slot.setup.batteryId) return rederive(s, now);
      slot.batteryChargeMs  = getBatteryCapacityMs(slot);
      slot.batterySnapshotAt = ev.at;
      slot.status = deriveSlotStatus(s, slot, now);
      return rederive(s, now);
    }

    case 'Extract': {
      const slot = s.plantSlots[ev.slotIndex];
      if (!slot || !slot.unlocked) return rederive(s, now);
      
      const liveStatus = deriveSlotStatus(s, slot, ev.at);
      const hasSomething = slot.diamondsAccumulated > 0 || (slot.cycle && (liveStatus === 'ExtractionReady' || liveStatus === 'BatteryEmpty'));
      if (!hasSomething) return rederive(s, now);

      // Proportional extraction — sum accumulated + current live
      const currentCycleDiamonds = computeLiveDiamonds(slot, ev.at);
      const totalToExtract = slot.diamondsAccumulated + currentCycleDiamonds;
      
      s.diamondsBalance += totalToExtract;
      creditPlantDailyCap(slot, totalToExtract, now);
      slot.diamondsAccumulated = 0;
      slot.cycle = null;

      // PERSISTENCE: Update battery charge to exactly what is left now
      slot.batteryChargeMs   = computeLiveBatteryChargeMs(slot, ev.at);
      slot.batterySnapshotAt = ev.at;

      // Small random repair chance
      if (Math.random() < 0.02) slot.needsRepair = true;

      slot.status = deriveSlotStatus(s, slot, now);
      return rederive(s, now);
    }

    case 'TopUpPower': {
      const slot = s.plantSlots[ev.slotIndex];
      if (!slot || !slot.unlocked) return rederive(s, now);
      slot.powerRemaining = getPowerUnitCap(slot);
      slot.status = deriveSlotStatus(s, slot, now);
      return rederive(s, now);
    }

    case 'RechargePlant': {
      const slot = s.plantSlots[ev.slotIndex];
      if (!slot || !slot.unlocked || !slot.setup.batteryId) return rederive(s, now);
      const cap = getPowerUnitCap(slot);
      slot.powerRemaining = cap;
      slot.batteryChargeMs = getBatteryCapacityMs(slot);
      slot.batterySnapshotAt = now;
      slot.status = deriveSlotStatus(s, slot, now);
      return rederive(s, now);
    }

    case 'Repair': {
      const slot = s.plantSlots[ev.slotIndex];
      if (!slot || !slot.unlocked) return rederive(s, now);
      slot.needsRepair = false;
      slot.status = deriveSlotStatus(s, slot, now);
      return rederive(s, now);
    }

    case 'Refine': {
      if (!ev.walletAddress || ev.walletAddress !== (s.lastConnectedAddress ?? '')) {
        return rederive(s, now);
      }
      const amt = Math.max(0, Math.floor(ev.amount));
      if (amt <= 0) return rederive(s, now);
      const at = now;
      const maxRefine = Math.floor(computeMinecoreDiamondsDisplayTotal(s, at));
      if (amt > maxRefine) return rederive(s, now);

      let r = amt;
      const fromBal = Math.min(r, s.diamondsBalance);
      s.diamondsBalance -= fromBal;
      r -= fromBal;

      for (const slot of s.plantSlots) {
        if (r <= 0) break;
        if (slot.diamondsAccumulated > 0) {
          const t = Math.min(r, slot.diamondsAccumulated);
          slot.diamondsAccumulated -= t;
          creditPlantDailyCap(slot, t, at);
          r -= t;
        }
        if (r <= 0) break;
        if (!slot.cycle) continue;
        const live = computeLiveDiamonds(slot, at);
        if (live <= 0) continue;
        const takeL = Math.min(r, live);
        const c = slot.cycle;
        c.mintedOffset = (c.mintedOffset ?? 0) + takeL;
        creditPlantDailyCap(slot, takeL, at);
        r -= takeL;
      }
      if (r > 0) return rederive(s, now);

      for (const slot of s.plantSlots) {
        if (!slot.cycle) continue;
        const rawR = computeRawLiveDiamonds(slot, at);
        if (rawR > 0 && (slot.cycle.mintedOffset ?? 0) >= rawR) {
          // Run is fully siphoned from live production via refine — end this cycle the same as clearing the in-progress run.
          slot.diamondsAccumulated += computeLiveDiamonds(slot, at);
          slot.batteryChargeMs = computeLiveBatteryChargeMs(slot, at);
          slot.batterySnapshotAt = at;
          slot.cycle = null;
        }
      }

      const refineMul = 1 + computeGlobalRefineBonusFraction(s);
      const points = Math.floor(amt * MINECORE_REFINE_POINTS_PER_DIAMOND * refineMul);
      s.refinementPointsTotal += points;
      const entry: GridLedgerEntry = {
        id:                 `minecore_refine_${now}_${Math.random().toString(36).slice(2, 9)}`,
        at:                 now,
        refinementPoints:   points,
        diamondsRefined:    amt,
        gridCheckpointScore: points,
        note:               'Minecore refine checkpoint.',
      };
      s.gridLedger = [...s.gridLedger, entry].slice(-200);
      return rederive(s, now);
    }

    case 'RedeemGrid': {
      if (!ev.walletAddress || ev.walletAddress !== (s.lastConnectedAddress ?? '')) {
        return rederive(s, now);
      }
      const pts = Math.max(0, Math.floor(ev.points));
      if (pts <= 0 || s.refinementPointsTotal < pts) return rederive(s, now);

      let rb = { ...s.redeemBudget };
      const today = minecoreUtcDayKey(now);
      if (rb.dayKey !== today) {
        rb = { dayKey: today, refinementPointsSpentOnGrid: 0, refinementPointsSpentOnKrex: 0 };
      }
      if (ev.token === 'GRID') {
        if (rb.refinementPointsSpentOnGrid + pts > MINECORE_DAILY_GRID_POINTS_CAP) return rederive(s, now);
        rb.refinementPointsSpentOnGrid += pts;
        s.gridRedeemableTotal += pts * MINECORE_GRID_PER_REFINEMENT_POINT;
      } else {
        if (rb.refinementPointsSpentOnKrex + pts > MINECORE_DAILY_KREX_POINTS_CAP) return rederive(s, now);
        rb.refinementPointsSpentOnKrex += pts;
        s.krexRedeemableTotal += pts * MINECORE_KREX_PER_REFINEMENT_POINT;
      }
      s.redeemBudget = rb;
      s.refinementPointsTotal -= pts;
      return rederive(s, now);
    }

    default:
      return rederive(s, now);
  }
}

export function applyMinecoreEvents(state: MinecoreState, events: MinecoreEvent[]): MinecoreState {
  return events.reduce((acc, e) => applyMinecoreEvent(acc, e), state);
}
