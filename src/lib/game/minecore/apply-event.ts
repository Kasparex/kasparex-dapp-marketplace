import {
  MINECORE_DEFAULT_NEXT_SLOT_COST_KAS,
  MINECORE_DEFAULT_SLOT_UNLOCK_COST_KAS,
  MINECORE_BATTERIES,
  MINECORE_DAY_MS,
  MINECORE_RECIPES,
  MINECORE_MAX_MODULES_BY_PLANT,
  MINECORE_REFINE_POINTS_PER_DIAMOND,
  MINECORE_GRID_PER_REFINEMENT_POINT,
  MINECORE_KREX_PER_REFINEMENT_POINT,
  MINECORE_DAILY_GRID_POINTS_CAP,
  MINECORE_DAILY_KREX_POINTS_CAP,
  MINECORE_STARTER_OWNED,
  MINECORE_MAINTENANCE_EARLY_REPAIR_WEAR,
  MINECORE_KREX_BOOST_DURATION_MS,
  MINECORE_KAS_OVERCLOCK_BONUS_WINDOW_MS,
  MINECORE_KAS_OVERCLOCK_NEXT_CYCLE_FLAT,
} from './config';
import {
  computePlantDurationMs,
  computePlantExpectedDiamonds,
  computePlantReady,
  computeLiveDiamonds,
  computeRawLiveDiamonds,
  computeLiveBatteryChargeMs,
  computeLiveBatterySlotChargeMs,
  computeMinecoreDiamondsDisplayTotal,
  getPowerUnitCap,
  deriveSlotStatus,
  plantDailyCapPreventsNewCycle,
  syncPlantPowerUnitsToCapacity,
} from './compute';
import {
  distributeWaterfallToMax,
  ensureBatterySlotChargeLength,
  getMaxChargePerSlotMs,
  getPlantBatterySlotCount,
  hasInstalledBattery,
  normalizeBatteryIds,
  sumChargeMs,
} from './battery-utils';
import { computeMinecoreBatteryBonusMsPerSlot } from './nft-deck-benefits';
import { getNFTTier } from '@/lib/game/diamond-bonuses';
import type { GridLedgerEntry } from '@/lib/game/engine';
import type { IngredientBag } from './types';
import type { MinecoreBatteryId, MinecoreEvent, MinecoreMachineId, MinecoreModuleId, MinecorePowerNodeId, MinecoreState, PlantSlotState } from './types';
import {
  canStartMiningByEfficiency,
  computeGlobalRefineBonusFraction,
  computeMaintenanceWearRatio,
  minecoreUtcDayKey,
} from './plant-economy';
import { creditPlantDailyCap, normalizeAllPlantRollingDailyCaps } from './daily-cap';
import {
  inventoryAllowsPlantSetup,
  nextPlantSetupAfterInstallPart,
  normalizePlantSetup,
  normalizeWorkerDeckIndices,
} from './asset-usage';

function slotMaxMs(state: MinecoreState, slot: PlantSlotState): number[] {
  const bonus = computeMinecoreBatteryBonusMsPerSlot(state);
  return getMaxChargePerSlotMs(slot.setup, slot.type, bonus);
}

/** When Workers NFT perks change max battery capacity, clamp stored charge without resetting cycles. */
function clampAllPlantBatteryChargesToCaps(state: MinecoreState, now: number) {
  for (const slot of state.plantSlots) {
    if (!slot.unlocked) continue;
    const maxArr = slotMaxMs(state, slot);
    const n = maxArr.length;
    let arr =
      slot.cycle && slot.cycle.pauseBeganAtMs == null
        ? computeLiveBatterySlotChargeMs(slot, now)
        : ensureBatterySlotChargeLength(slot.batterySlotChargeMs, n, 0);
    arr = ensureBatterySlotChargeLength(arr, n, 0).map((c, i) => Math.min(c, maxArr[i] ?? 0));
    slot.batterySlotChargeMs = arr;
    slot.batterySnapshotAt = now;
  }
}

/** Preserve total charge energy when machine (charge budget) or per-slot battery changes. */
function rescaleBatteryToNewCapacity(state: MinecoreState, slot: PlantSlotState, oldMaxSlots: number[], at: number, now: number) {
  const nOld = oldMaxSlots.length;
  const oldTotalCap = sumChargeMs(oldMaxSlots);
  let live: number[];
  if (!slot.cycle) {
    const raw = ensureBatterySlotChargeLength(slot.batterySlotChargeMs, nOld, 0);
    live = raw.map((c, i) => Math.min(c, oldMaxSlots[i] ?? 0));
  } else if (slot.cycle.pauseBeganAtMs != null) {
    const raw = ensureBatterySlotChargeLength(slot.batterySlotChargeMs, nOld, 0);
    live = raw.map((c, i) => Math.min(c, oldMaxSlots[i] ?? 0));
  } else {
    live = computeLiveBatterySlotChargeMs(slot, now);
    live = live.map((c, i) => Math.min(c, oldMaxSlots[i] ?? 0));
  }
  if (live.length < nOld) {
    live = ensureBatterySlotChargeLength(live, nOld, 0).map((c, i) => Math.min(c, oldMaxSlots[i] ?? 0));
  } else if (live.length > nOld) {
    live = live.slice(0, nOld);
  }
  const liveTotal = sumChargeMs(live);
  const newMaxSlots = slotMaxMs(state, slot);
  const newTotalCap = sumChargeMs(newMaxSlots);
  if (newTotalCap <= 0) {
    slot.batterySlotChargeMs = ensureBatterySlotChargeLength([], getPlantBatterySlotCount(slot.type), 0);
  } else if (oldTotalCap <= 0) {
    slot.batterySlotChargeMs = [...newMaxSlots];
  } else {
    const ratio = Math.min(1, Math.max(0, liveTotal / oldTotalCap));
    const target = Math.max(0, Math.min(newTotalCap, Math.floor(ratio * newTotalCap)));
    slot.batterySlotChargeMs = distributeWaterfallToMax(target, newMaxSlots);
  }
  slot.batterySnapshotAt = at;
  slot.powerRemaining = Math.min(slot.powerRemaining, getPowerUnitCap(slot));
}

function cloneSlot(slot: PlantSlotState): PlantSlotState {
  return {
    ...slot,
    krexBoostUntilMs: slot.krexBoostUntilMs ?? 0,
    kasOverclockDailyBonusUntilMs: slot.kasOverclockDailyBonusUntilMs ?? 0,
    kasOverclockNextCycleExtraDiamonds: slot.kasOverclockNextCycleExtraDiamonds ?? 0,
    setup: {
      ...slot.setup,
      moduleIds: [...slot.setup.moduleIds],
      batteryIds: [...(slot.setup.batteryIds ?? [])],
      workerNftDeckSlotIndices: [...(slot.setup.workerNftDeckSlotIndices ?? [])],
    },
    cycle: slot.cycle ? { ...slot.cycle } : null,
    batterySlotChargeMs: [...(slot.batterySlotChargeMs ?? [])],
  };
}

function nextVersion(state: MinecoreState): number {
  return (state.version ?? 0) + 1;
}

function rederive(state: MinecoreState, at: number): MinecoreState {
  const slots = state.plantSlots.map((s) => {
    let working: PlantSlotState = s;
    const kUntil = working.krexBoostUntilMs ?? 0;
    if (kUntil > 0 && at >= kUntil) {
      const nextSetup = normalizePlantSetup(working.type, {
        ...working.setup,
        moduleIds: working.setup.moduleIds.filter((id) => id !== 'krex-boost'),
      });
      working = {
        ...working,
        setup: nextSetup,
        krexBoostUntilMs: 0,
      };
    }
    const synced = syncPlantPowerUnitsToCapacity(working);
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
      nodes:     { ...MINECORE_STARTER_OWNED.nodes, ...(state.owned.nodes ?? {}) },
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

    case 'BuyIngredientWithGrid': {
      const amt = Math.max(0, Math.floor(ev.amount));
      const cost = Math.max(0, ev.gridCost);
      if (amt <= 0 || cost <= 0) return rederive(s, now);
      const bal = s.gridRedeemableTotal ?? 0;
      if (bal + 1e-9 < cost) return rederive(s, now);
      s.gridRedeemableTotal = bal - cost;
      s.ingredients[ev.ingredient] = Math.max(0, (s.ingredients[ev.ingredient] ?? 0) + amt);
      return rederive(s, now);
    }

    case 'DeployNFT': {
      const slot = s.nftSlots?.[ev.slotIndex];
      if (!slot) return rederive(s, now);
      slot.nftId      = ev.nftId;
      slot.collection = ev.collection;
      slot.minecorePerkTier = getNFTTier(ev.collection, ev.nftId, null);
      s.automation.foremanActive = Boolean(s.nftSlots?.some((x) => x.type === 'foreman' && x.nftId != null));
      clampAllPlantBatteryChargesToCaps(s, now);
      return rederive(s, now);
    }

    case 'RemoveNFT': {
      const slot = s.nftSlots?.[ev.slotIndex];
      if (!slot) return rederive(s, now);
      slot.nftId      = null;
      slot.collection = null;
      delete slot.minecorePerkTier;
      for (const ps of s.plantSlots) {
        const idxs = ps.setup.workerNftDeckSlotIndices ?? [];
        if (idxs.some((x) => x === ev.slotIndex)) {
          ps.setup.workerNftDeckSlotIndices = idxs.map((x) => (x === ev.slotIndex ? null : x));
        }
      }
      s.automation.foremanActive = Boolean(s.nftSlots?.some((x) => x.type === 'foreman' && x.nftId != null));
      clampAllPlantBatteryChargesToCaps(s, now);
      return rederive(s, now);
    }

    case 'SyncMinecoreNftPerkTier': {
      const slot = s.nftSlots?.[ev.slotIndex];
      if (!slot) return rederive(s, now);
      if (ev.tier == null) delete slot.minecorePerkTier;
      else slot.minecorePerkTier = ev.tier;
      clampAllPlantBatteryChargesToCaps(s, now);
      return rederive(s, now);
    }

    case 'AddNftDeckSlot': {
      s.nftSlots = [...(s.nftSlots ?? []), { type: ev.slotType, nftId: null, collection: null }];
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
      if (recipe.kind === 'powerNode') {
        const pid = recipe.outputId as MinecorePowerNodeId;
        s.owned.nodes[pid] = (s.owned.nodes[pid] ?? 0) + 1;
      }

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
      slot.batterySlotChargeMs = slotMaxMs(s, slot);
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
        setup: {
          machineId: null,
          powerNodeId: null,
          batteryIds: [null],
          workerNftDeckSlotIndices: [null],
          moduleIds: [],
          boostId: 'none',
        },
        cycle:            null,
        powerRemaining:   0,
        needsRepair:      false,
        plantLastServicedAtMs: 0,
        batterySlotChargeMs: [0],
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
      const oldMax = slotMaxMs(s, slot);
      const live =
        slot.cycle && slot.cycle.pauseBeganAtMs == null
          ? computeLiveBatterySlotChargeMs(slot, now)
          : ensureBatterySlotChargeLength(slot.batterySlotChargeMs, oldMax.length, 0);
      const liveTotal = sumChargeMs(live);
      const oldTotal = sumChargeMs(oldMax);
      slot.type = ev.plantType;
      slot.setup.workerNftDeckSlotIndices = normalizeWorkerDeckIndices(ev.plantType, slot.setup);
      if (ev.plantType === 'standard') {
        slot.setup.moduleIds = [];
      } else {
        const max = MINECORE_MAX_MODULES_BY_PLANT[ev.plantType];
        slot.setup.moduleIds = slot.setup.moduleIds.slice(0, max);
      }
      slot.setup = { ...slot.setup, batteryIds: normalizeBatteryIds({ ...slot.setup, batteryIds: slot.setup.batteryIds }, ev.plantType) };
      const newMax = slotMaxMs(s, slot);
      const newTotal = sumChargeMs(newMax);
      if (newTotal <= 0) {
        slot.batterySlotChargeMs = ensureBatterySlotChargeLength([], getPlantBatterySlotCount(ev.plantType), 0);
      } else if (oldTotal <= 0) {
        slot.batterySlotChargeMs = [...newMax];
      } else {
        const ratio = Math.min(1, Math.max(0, liveTotal / oldTotal));
        const target = Math.min(newTotal, Math.floor(ratio * newTotal));
        slot.batterySlotChargeMs = distributeWaterfallToMax(target, newMax);
      }
      slot.batterySnapshotAt = now;
      slot.status = deriveSlotStatus(s, slot, now);
      return rederive(s, now);
    }

    case 'InstallPart': {
      const slot = s.plantSlots[ev.slotIndex];
      if (!slot || !slot.unlocked) return rederive(s, now);
      const nextSetup = nextPlantSetupAfterInstallPart(slot, ev.part);
      if (!inventoryAllowsPlantSetup(s, ev.slotIndex, nextSetup)) {
        return rederive(s, now);
      }
      // Finalize cycle only after inventory allows the edit (paused/stopped swaps; mid-run diamonds merge into accumulation).
      if (slot.cycle) {
        slot.diamondsAccumulated += computeLiveDiamonds(s, slot, now);
        slot.batterySlotChargeMs = computeLiveBatterySlotChargeMs(slot, now);
        slot.batterySnapshotAt = now;
        slot.cycle = null;
      }
      if (ev.part.kind === 'machine') {
        const oldMax = slotMaxMs(s, slot);
        slot.setup.machineId = ev.part.id;
        rescaleBatteryToNewCapacity(s, slot, oldMax, now, now);
      }
      if (ev.part.kind === 'battery') {
        const oldMax = slotMaxMs(s, slot);
        const n = getPlantBatterySlotCount(slot.type);
        const idx =
          ev.part.batterySlotIndex != null
            ? Math.max(0, Math.min(n - 1, Math.floor(ev.part.batterySlotIndex)))
            : 0;
        const nextIds = Array.from({ length: n }, (_, i) =>
          (i < (slot.setup.batteryIds?.length ?? 0) ? slot.setup.batteryIds![i] : null) as MinecoreBatteryId | null
        );
        nextIds[idx] = ev.part.id;
        slot.setup = { ...slot.setup, batteryIds: nextIds };
        if (ev.part.id && MINECORE_BATTERIES[ev.part.id]) {
          rescaleBatteryToNewCapacity(s, slot, oldMax, now, now);
        } else {
          slot.batterySlotChargeMs = Array.from({ length: n }, () => 0);
          slot.batterySnapshotAt = now;
        }
        slot.powerRemaining = Math.min(slot.powerRemaining, getPowerUnitCap(slot));
      }
      if (ev.part.kind === 'crewWorkerNftDeck') {
        const nx = nextPlantSetupAfterInstallPart(slot, ev.part);
        slot.setup = { ...slot.setup, workerNftDeckSlotIndices: nx.workerNftDeckSlotIndices };
      }
      if (ev.part.kind === 'powerNode') {
        slot.setup = { ...slot.setup, powerNodeId: ev.part.id };
      }
      if (ev.part.kind === 'modules') {
        const max = MINECORE_MAX_MODULES_BY_PLANT[slot.type];
        const prev = slot.setup.moduleIds;
        const hadKrex = prev.includes('krex-boost');
        const ids = slot.type === 'standard' ? [] : [...ev.part.ids].slice(0, max);
        const hasKrex = ids.includes('krex-boost');
        slot.setup.moduleIds = ids;
        if (hasKrex && !hadKrex) {
          slot.krexBoostUntilMs = ev.at + MINECORE_KREX_BOOST_DURATION_MS;
        } else if (!hasKrex && hadKrex) {
          slot.krexBoostUntilMs = 0;
        }
      }
      if (ev.part.kind === 'boost') slot.setup.boostId = ev.part.id;
      slot.setup = normalizePlantSetup(slot.type, slot.setup);
      slot.status = deriveSlotStatus(s, slot, now);
      return rederive(s, now);
    }

    case 'StartMining': {
      const slot = s.plantSlots[ev.slotIndex];
      if (!slot || !slot.unlocked) return rederive(s, now);
      if (slot.cycle) {
        return rederive(s, now);
      }
      if (!computePlantReady(s, slot)) return rederive(s, now);
      if (plantDailyCapPreventsNewCycle(s, slot, ev.at)) return rederive(s, now);
      if (slot.needsRepair) return rederive(s, now);
      if (!canStartMiningByEfficiency(slot)) return rederive(s, now);

      const durationMs = computePlantDurationMs(slot);
      const extra = Math.max(0, Math.floor(slot.kasOverclockNextCycleExtraDiamonds ?? 0));
      const baseExpected = computePlantExpectedDiamonds(s, slot, undefined, ev.at);
      const expectedDiamonds = baseExpected + extra;
      slot.kasOverclockNextCycleExtraDiamonds = 0;
      if (durationMs <= 0 || expectedDiamonds <= 0) return rederive(s, now);

      slot.batterySlotChargeMs = computeLiveBatterySlotChargeMs(slot, ev.at);
      slot.batterySnapshotAt = ev.at;

      if (computeLiveBatteryChargeMs(slot, ev.at) <= 0) return rederive(s, now);

      slot.powerRemaining = getPowerUnitCap(slot);

      /** Long nominal window — mining ends by battery or daily cap, not wall-clock cycle length. */
      const nominalEndMs = ev.at + 100 * MINECORE_DAY_MS;

      slot.cycle = {
        startAtMs:        ev.at,
        endAtMs:          nominalEndMs,
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
      slot.batterySlotChargeMs = computeLiveBatterySlotChargeMs(slot, ev.at);
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
      if (!slot || !slot.unlocked || !hasInstalledBattery(slot.setup, slot.type)) return rederive(s, now);
      slot.batterySlotChargeMs = slotMaxMs(s, slot);
      slot.batterySnapshotAt = ev.at;
      slot.status = deriveSlotStatus(s, slot, now);
      return rederive(s, now);
    }

    case 'Extract': {
      const slot = s.plantSlots[ev.slotIndex];
      if (!slot || !slot.unlocked) return rederive(s, now);
      
      const liveStatus = deriveSlotStatus(s, slot, ev.at);
      const hasSomething =
        slot.diamondsAccumulated > 0 ||
        (slot.cycle && (liveStatus === 'CreditingReady' || liveStatus === 'BatteryEmpty'));
      if (!hasSomething) return rederive(s, now);

      // Proportional extraction - sum accumulated + current live
      const currentCycleDiamonds = computeLiveDiamonds(s, slot, ev.at);
      const totalToExtract = slot.diamondsAccumulated + currentCycleDiamonds;
      
      s.diamondsBalance += totalToExtract;
      creditPlantDailyCap(slot, totalToExtract, now);
      slot.diamondsAccumulated = 0;
      slot.cycle = null;

      // PERSISTENCE: Update battery charge to exactly what is left now
      slot.batterySlotChargeMs   = computeLiveBatterySlotChargeMs(slot, ev.at);
      slot.batterySnapshotAt = ev.at;

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
      if (!slot || !slot.unlocked || !hasInstalledBattery(slot.setup, slot.type)) return rederive(s, now);
      const n = getPlantBatterySlotCount(slot.type);
      const maxPerSlot = slotMaxMs(s, slot);
      const ids = normalizeBatteryIds(slot.setup, slot.type);

      let indexes: number[] = [];
      if (ev.batterySlotIndexes && ev.batterySlotIndexes.length > 0) {
        const uniq = [...new Set(ev.batterySlotIndexes.map((i) => Math.floor(i)))];
        indexes = uniq.filter((i) => i >= 0 && i < n && ids[i] != null);
      } else {
        const single =
          ev.batterySlotIndex != null ? Math.floor(ev.batterySlotIndex) : 0;
        const idx = Math.max(0, Math.min(n - 1, single));
        if (ids[idx]) indexes = [idx];
        else {
          const fi = ids.findIndex(Boolean);
          if (fi < 0) return rederive(s, now);
          indexes = [fi];
        }
      }
      if (indexes.length === 0) return rederive(s, now);

      let arr = [...computeLiveBatterySlotChargeMs(slot, now)];
      arr = ensureBatterySlotChargeLength(arr, n, 0);
      for (let i = 0; i < n; i++) {
        arr[i] = arr[i] ?? 0;
      }
      for (const idx of indexes) {
        if (!ids[idx]) continue;
        arr[idx] = maxPerSlot[idx] ?? 0;
      }
      slot.batterySlotChargeMs = arr;
      slot.batterySnapshotAt = now;
      slot.status = deriveSlotStatus(s, slot, now);
      return rederive(s, now);
    }

    case 'Repair': {
      const slot = s.plantSlots[ev.slotIndex];
      if (!slot || !slot.unlocked) return rederive(s, now);
      const wear = computeMaintenanceWearRatio(slot, now);
      const patches = Math.max(0, Math.floor(s.stabilityPatches ?? 0));
      if (ev.consumeStabilityPatch) {
        if (patches < 1) return rederive(s, now);
        if (wear < MINECORE_MAINTENANCE_EARLY_REPAIR_WEAR - 1e-9 || wear >= 1 - 1e-9) return rederive(s, now);
        s.stabilityPatches = patches - 1;
      } else {
        const due = slot.needsRepair || wear >= 1 - 1e-6;
        if (!due) return rederive(s, now);
      }
      slot.needsRepair = false;
      slot.plantLastServicedAtMs = now;
      slot.status = deriveSlotStatus(s, slot, now);
      return rederive(s, now);
    }

    case 'AddStabilityPatches': {
      const n = Math.max(0, Math.floor(ev.count));
      if (n <= 0) return rederive(s, now);
      s.stabilityPatches = Math.max(0, Math.floor(s.stabilityPatches ?? 0)) + n;
      return rederive(s, now);
    }

    case 'GrantModuleInventory': {
      const add = Math.max(0, Math.floor(ev.count));
      if (add <= 0) return rederive(s, now);
      const id = ev.moduleId;
      s.owned.modules[id] = Math.max(0, Math.floor(s.owned.modules[id] ?? 0)) + add;
      return rederive(s, now);
    }

    case 'ApplyKasOverclock': {
      const slot = s.plantSlots[ev.slotIndex];
      if (!slot || !slot.unlocked) return rederive(s, now);
      const c = Math.max(1, Math.floor(ev.count));
      slot.kasOverclockDailyBonusUntilMs = ev.at + MINECORE_KAS_OVERCLOCK_BONUS_WINDOW_MS;
      slot.kasOverclockNextCycleExtraDiamonds =
        Math.max(0, Math.floor(slot.kasOverclockNextCycleExtraDiamonds ?? 0)) +
        MINECORE_KAS_OVERCLOCK_NEXT_CYCLE_FLAT * c;
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
        const live = computeLiveDiamonds(s, slot, at);
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
        const rawR = computeRawLiveDiamonds(s, slot, at);
        if (rawR > 0 && (slot.cycle.mintedOffset ?? 0) >= rawR) {
          // Run is fully siphoned from live production via refine - end this cycle the same as clearing the in-progress run.
          slot.diamondsAccumulated += computeLiveDiamonds(s, slot, at);
          slot.batterySlotChargeMs = computeLiveBatterySlotChargeMs(slot, at);
          slot.batterySnapshotAt = at;
          slot.cycle = null;
        }
      }

      const refineMul = 1 + computeGlobalRefineBonusFraction(s);
      const points = Math.floor(amt * MINECORE_REFINE_POINTS_PER_DIAMOND * refineMul);
      s.refinementPointsTotal += points;
      s.refinementPointsEarnedLifetime = (s.refinementPointsEarnedLifetime ?? 0) + points;
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
