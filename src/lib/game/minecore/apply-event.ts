import {
  MINECORE_DEFAULT_NEXT_SLOT_COST_KAS,
  MINECORE_DEFAULT_SLOT_UNLOCK_COST_KAS,
  MINECORE_GRID_REDEEM_RATE,
  MINECORE_REFINE_RATE,
  MINECORE_BATTERIES,
  MINECORE_RECIPES,
} from './config';
import { computePlantDurationMs, computePlantExpectedDiamonds, computePlantReady, deriveSlotStatus } from './compute';
import type {
  MinecoreBatteryId,
  MinecoreEvent,
  MinecoreMachineId,
  MinecoreModuleId,
  MinecoreState,
  PlantSlotState,
} from './types';

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
  const slots = state.plantSlots.map((s) => ({ ...s, status: deriveSlotStatus(state, s, at) }));
  return { ...state, plantSlots: slots };
}

export function applyMinecoreEvent(state: MinecoreState, ev: MinecoreEvent): MinecoreState {
  let s: MinecoreState = {
    ...state,
    version: nextVersion(state),
    ingredients: { ...state.ingredients },
    owned: {
      machines: { ...state.owned.machines },
      batteries: { ...state.owned.batteries },
      workers: { ...state.owned.workers },
      modules: { ...state.owned.modules },
    },
    plantSlots: state.plantSlots.map(cloneSlot),
    nftSlots: state.nftSlots ? state.nftSlots.map((x) => ({ ...x })) : [],
    automation: state.automation ? { ...state.automation } : { autoRestart: false, foremanActive: false },
  };

  const now = 'at' in ev ? ev.at : Date.now();

  switch (ev.type) {
    case 'ConnectWallet': {
      s.lastConnectedAt = ev.at;
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
      slot.nftId = ev.nftId;
      slot.collection = ev.collection;
      s.automation.foremanActive = Boolean(s.nftSlots?.some((x) => x.type === 'foreman' && x.nftId != null));
      return rederive(s, now);
    }
    case 'RemoveNFT': {
      const slot = s.nftSlots?.[ev.slotIndex];
      if (!slot) return rederive(s, now);
      slot.nftId = null;
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

      if (recipe.kind === 'machine') {
        const id = recipe.outputId as MinecoreMachineId;
        s.owned.machines[id] = (s.owned.machines[id] ?? 0) + 1;
      }
      if (recipe.kind === 'battery') {
        const id = recipe.outputId as MinecoreBatteryId;
        s.owned.batteries[id] = (s.owned.batteries[id] ?? 0) + 1;
      }
      if (recipe.kind === 'module') {
        const id = recipe.outputId as MinecoreModuleId;
        s.owned.modules[id] = (s.owned.modules[id] ?? 0) + 1;
      }

      return rederive(s, now);
    }
    case 'UnlockSlot': {
      const slot = s.plantSlots[ev.slotIndex];
      if (!slot) return rederive(s, now);
      slot.unlocked = true;
      slot.unlockCostKas = MINECORE_DEFAULT_SLOT_UNLOCK_COST_KAS;
      slot.powerRemaining = Math.max(slot.powerRemaining, 1);
      slot.needsRepair = false;
      slot.cycle = null;
      slot.status = deriveSlotStatus(s, slot, now);
      return rederive(s, now);
    }
    case 'AddSlot': {
      const idx = s.plantSlots.length;
      const newSlot: PlantSlotState = {
        id: `slot-${idx + 1}`,
        index: idx,
        unlocked: false,
        unlockCostKas: MINECORE_DEFAULT_SLOT_UNLOCK_COST_KAS,
        status: 'EmptySlot',
        setup: { machineId: null, batteryId: null, workerId: null, moduleIds: [], boostId: 'none' },
        cycle: null,
        powerRemaining: 0,
        needsRepair: false,
      };
      s.plantSlots.push(newSlot);
      s.nextSlotCostKas = Math.max(MINECORE_DEFAULT_NEXT_SLOT_COST_KAS, s.nextSlotCostKas);
      return rederive(s, now);
    }
    case 'InstallPart': {
      const slot = s.plantSlots[ev.slotIndex];
      if (!slot || !slot.unlocked) return rederive(s, now);
      if (ev.part.kind === 'machine') slot.setup.machineId = ev.part.id;
      if (ev.part.kind === 'battery') {
        slot.setup.batteryId = ev.part.id;
        const b = ev.part.id ? MINECORE_BATTERIES[ev.part.id] : null;
        if (b) slot.powerRemaining = Math.max(slot.powerRemaining, b.powerCapacity);
      }
      if (ev.part.kind === 'worker') slot.setup.workerId = ev.part.id;
      if (ev.part.kind === 'modules') slot.setup.moduleIds = [...ev.part.ids];
      if (ev.part.kind === 'boost') slot.setup.boostId = ev.part.id;
      slot.status = deriveSlotStatus(s, slot, now);
      return rederive(s, now);
    }
    case 'StartMining': {
      const slot = s.plantSlots[ev.slotIndex];
      if (!slot || !slot.unlocked) return rederive(s, now);
      if (slot.cycle) return rederive(s, now);
      if (!computePlantReady(slot)) return rederive(s, now);
      if (slot.powerRemaining <= 0) return rederive(s, now);
      if (slot.needsRepair) return rederive(s, now);

      const durationMs = computePlantDurationMs(slot);
      const expectedDiamonds = computePlantExpectedDiamonds(s, slot);
      if (durationMs <= 0 || expectedDiamonds <= 0) return rederive(s, now);

      slot.powerRemaining = Math.max(0, slot.powerRemaining - 1);
      slot.cycle = {
        startAtMs: ev.at,
        endAtMs: ev.at + durationMs,
        durationMs,
        expectedDiamonds,
      };
      slot.status = deriveSlotStatus(s, slot, now);
      return rederive(s, now);
    }
    case 'Extract': {
      const slot = s.plantSlots[ev.slotIndex];
      if (!slot || !slot.unlocked || !slot.cycle) return rederive(s, now);
      if (ev.at < slot.cycle.endAtMs) return rederive(s, now);

      s.diamondsBalance += slot.cycle.expectedDiamonds;
      slot.cycle = null;

      // Simple V1 failure/repair hook: very low chance to require repair after extraction.
      const roll = Math.random();
      if (roll < 0.02) slot.needsRepair = true;

      slot.status = deriveSlotStatus(s, slot, now);
      return rederive(s, now);
    }
    case 'TopUpPower': {
      const slot = s.plantSlots[ev.slotIndex];
      if (!slot || !slot.unlocked) return rederive(s, now);
      slot.powerRemaining = Math.max(0, slot.powerRemaining + Math.max(0, ev.added));
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
      const amt = Math.max(0, Math.floor(ev.amount));
      if (amt <= 0) return rederive(s, now);
      if (s.diamondsBalance < amt) return rederive(s, now);
      s.diamondsBalance -= amt;
      const points = amt * MINECORE_REFINE_RATE;
      s.refinementPointsTotal += points;
      return rederive(s, now);
    }
    case 'RedeemGrid': {
      const pts = Math.max(0, Math.floor(ev.points));
      if (pts <= 0) return rederive(s, now);
      if (s.refinementPointsTotal < pts) return rederive(s, now);
      s.refinementPointsTotal -= pts;
      s.gridRedeemableTotal += pts * MINECORE_GRID_REDEEM_RATE;
      return rederive(s, now);
    }
    default:
      return rederive(s, now);
  }
}

export function applyMinecoreEvents(state: MinecoreState, events: MinecoreEvent[]): MinecoreState {
  return events.reduce((acc, e) => applyMinecoreEvent(acc, e), state);
}

