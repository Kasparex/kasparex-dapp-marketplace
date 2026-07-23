import { DIAMOND_VEINS_REFINE_POINTS_PER_DIAMOND, IDLE_ENERGY_DURATION_MS, REFINE_MIN_DIAMONDS } from '@/lib/game/diamond-veins-config';
import type { DiamondCommodity, DiamondVeinsConsumableId, GameEvent, GridLedgerEntry, TyconGameState } from './types';
import { createInitialTyconState, EMPTY_CONSUMABLES } from './initial-state';
import { migrateSlotsToTycon } from './compute-yield';

function clampReceipts(ids: string[]): string[] {
  const max = 500;
  if (ids.length <= max) return ids;
  return ids.slice(ids.length - max);
}

function clampLedger(ledger: GridLedgerEntry[]): GridLedgerEntry[] {
  const max = 200;
  if (ledger.length <= max) return ledger;
  return ledger.slice(ledger.length - max);
}

function defaultCollectionForRole(type: string): string {
  return type === 'worker' ? 'KREXPRIME' : 'PIXELKREX';
}

/**
 * Deterministic state transition for Diamond Veins idle mining (client + server).
 */
export function applyEvent(state: TyconGameState, event: GameEvent): TyconGameState {
  const next: TyconGameState = {
    ...state,
    slots: state.slots.map((s) => ({ ...s })),
    machines: state.machines.map((m) => ({ ...m })),
    activeBoosts: state.activeBoosts.map((b) => ({ ...b })),
    diamondInventory: { ...state.diamondInventory },
    automation: { ...state.automation },
    gridLedger: [...state.gridLedger],
    appliedReceiptIds: [...state.appliedReceiptIds],
    consumables: { ...EMPTY_CONSUMABLES, ...state.consumables },
  };

  switch (event.type) {
    case 'HeartbeatConnect': {
      next.lastConnectedAt = event.at;
      next.lastConnectedAddress = event.address;
      next.version = state.version + 1;
      return next;
    }
    case 'DeployNFT': {
      const s = next.slots[event.slotIndex];
      if (!s) return state;
      const energyMax = Math.max(
        1,
        Math.floor(event.energyMax ?? IDLE_ENERGY_DURATION_MS[s.type]?.regular ?? 20 * 60_000),
      );
      next.slots[event.slotIndex] = {
        ...s,
        nftId: event.nftId,
        collection: event.collection,
        energy: energyMax,
        energyMax,
      };
      if (s.type === 'foreman') {
        next.automation.foremanActive = true;
        next.automation.autoRestartRunsCapPerDay = Math.max(next.automation.autoRestartRunsCapPerDay, 3);
      }
      next.version = state.version + 1;
      return next;
    }
    case 'RemoveSlot': {
      const s = next.slots[event.slotIndex];
      if (!s) return state;
      next.slots[event.slotIndex] = {
        ...s,
        nftId: null,
        collection: defaultCollectionForRole(s.type),
        energy: 0,
        energyMax: 0,
      };
      if (s.type === 'foreman') {
        next.automation.foremanActive = false;
        next.automation.autoRestartRunsCapPerDay = 0;
      }
      next.version = state.version + 1;
      return next;
    }
    case 'AddNftDeckSlot': {
      next.slots = [
        ...next.slots,
        {
          type: event.slotType,
          nftId: null,
          collection: defaultCollectionForRole(event.slotType),
          energy: 0,
          energyMax: 0,
        },
      ];
      next.version = state.version + 1;
      return next;
    }
    case 'AddBoost': {
      next.activeBoosts = [...next.activeBoosts, event.boost];
      next.version = state.version + 1;
      return next;
    }
    case 'StartMiningRun': {
      next.miningRunEndTime = event.at + event.durationMs;
      next.miningRunMultiplier = event.mult;
      next.miningRunOptionIndex = event.optionIndex;
      next.version = state.version + 1;
      return next;
    }
    case 'AccumulateDiamonds': {
      if (event.delta <= 0) return state;
      next.diamonds = state.diamonds + event.delta;
      next.diamondsEarnedLifetime = (state.diamondsEarnedLifetime ?? 0) + event.delta;
      next.version = state.version + 1;
      return next;
    }
    case 'DistributeDiamondDelta': {
      if (event.delta <= 0) return state;
      next.diamonds = state.diamonds + event.delta;
      next.diamondsEarnedLifetime = (state.diamondsEarnedLifetime ?? 0) + event.delta;
      (Object.keys(event.weights) as DiamondCommodity[]).forEach((k) => {
        const portion = event.delta * (event.weights[k] ?? 0);
        next.diamondInventory[k] = (next.diamondInventory[k] ?? 0) + portion;
      });
      next.version = state.version + 1;
      return next;
    }
    case 'TickIdleMining': {
      if (event.deltaSeconds <= 0) return state;
      let totalDelta = 0;
      for (let i = 0; i < next.slots.length; i++) {
        const slot = next.slots[i]!;
        const dps = event.slotDeltas[i] ?? 0;
        const drain = event.energyDrains[i] ?? 0;
        if (dps > 0) {
          const gained = dps * event.deltaSeconds;
          totalDelta += gained;
        }
        if (drain > 0 && slot.nftId != null) {
          const energy = Math.max(0, (slot.energy ?? 0) - drain * event.deltaSeconds);
          next.slots[i] = { ...slot, energy };
        }
      }
      if (totalDelta <= 0 && event.energyDrains.every((d) => d <= 0)) return state;
      if (totalDelta > 0) {
        next.diamonds = state.diamonds + totalDelta;
        next.diamondsEarnedLifetime = (state.diamondsEarnedLifetime ?? 0) + totalDelta;
      }
      next.lastIdleTickAt = event.at;
      next.version = state.version + 1;
      return next;
    }
    case 'Refine': {
      const bag = Math.floor(state.diamonds);
      const amount =
        typeof event.amount === 'number' && Number.isFinite(event.amount)
          ? Math.max(0, Math.min(bag, Math.floor(event.amount)))
          : bag;
      if (amount < REFINE_MIN_DIAMONDS) return state;
      const timeSinceLastRefine = (event.at - state.lastRefinedAt) / 1000;
      const timeBonus = 1 + Math.min(timeSinceLastRefine / 3600, 0.5);
      const refinementPoints = Math.floor(
        amount * DIAMOND_VEINS_REFINE_POINTS_PER_DIAMOND * timeBonus,
      );
      const entry: GridLedgerEntry = {
        id: `refine_${event.at}_${Math.random().toString(36).slice(2, 9)}`,
        at: event.at,
        refinementPoints,
        diamondsRefined: amount,
        gridCheckpointScore: refinementPoints,
        note: 'Refine checkpoint. Redeem points toward Hub Rewards.',
      };
      next.diamonds = Math.max(0, state.diamonds - amount);
      if (next.diamonds < 0.0001) {
        next.diamonds = 0;
        next.diamondInventory = {
          chronoShard: 0,
          auroraCore: 0,
          cipherPrism: 0,
          eonCore: 0,
          eclipticFlame: 0,
          rubble: 0,
        };
      }
      next.lastRefinedAt = event.at;
      next.refinementPointsTotal = state.refinementPointsTotal + refinementPoints;
      next.gridLedger = clampLedger([...next.gridLedger, entry]);
      next.version = state.version + 1;
      return next;
    }
    case 'AddMachine': {
      const idx = next.machines.findIndex((m) => m.id === event.machine.id);
      if (idx >= 0) {
        next.machines[idx] = {
          ...next.machines[idx]!,
          count: next.machines[idx]!.count + event.machine.count,
          powerPerUnit: event.machine.powerPerUnit,
          yieldPerUnit: event.machine.yieldPerUnit,
        };
      } else {
        next.machines = [...next.machines, { ...event.machine }];
      }
      next.version = state.version + 1;
      return next;
    }
    case 'UpgradePower': {
      next.powerCapMw = state.powerCapMw + event.addedMw;
      next.version = state.version + 1;
      return next;
    }
    case 'SetAutomation': {
      next.automation = { ...next.automation, ...event.patch };
      next.version = state.version + 1;
      return next;
    }
    case 'RegisterReceipt': {
      if (state.appliedReceiptIds.includes(event.receiptId)) return state;
      next.appliedReceiptIds = clampReceipts([...next.appliedReceiptIds, event.receiptId]);
      next.version = state.version + 1;
      return next;
    }
    case 'RedeemGrid':
    case 'RedeemPoints': {
      if (state.refinementPointsTotal < event.points) return state;
      next.refinementPointsTotal = state.refinementPointsTotal - event.points;
      next.version = state.version + 1;
      return next;
    }
    case 'AddConsumables': {
      const id = event.itemId as DiamondVeinsConsumableId;
      const cur = next.consumables[id] ?? 0;
      next.consumables = { ...next.consumables, [id]: cur + Math.max(1, Math.floor(event.count)) };
      next.version = state.version + 1;
      return next;
    }
    case 'FeedWorker': {
      const slot = next.slots[event.slotIndex];
      if (!slot || slot.nftId == null) return state;
      const id = event.itemId as DiamondVeinsConsumableId;
      const have = next.consumables[id] ?? 0;
      if (have < 1) return state;
      const energyMax = Math.max(slot.energyMax ?? 0, 1);
      const restore = Math.max(0, event.energyRestore);
      const energy = Math.min(energyMax, (slot.energy ?? 0) + restore);
      next.consumables = { ...next.consumables, [id]: have - 1 };
      next.slots[event.slotIndex] = { ...slot, energy, energyMax };
      next.version = state.version + 1;
      return next;
    }
    case 'SyncVersion': {
      next.version = Math.max(state.version, event.version);
      return next;
    }
    default:
      return state;
  }
}

export function applyEvents(state: TyconGameState, events: GameEvent[]): TyconGameState {
  return events.reduce((s, e) => applyEvent(s, e), state);
}

/** Merge persisted legacy state into TyconGameState shape. */
export function hydrateTyconState(partial: Partial<TyconGameState> | null | undefined): TyconGameState {
  const initial = createInitialTyconState();
  if (!partial || typeof partial !== 'object') return initial;
  const slots = migrateSlotsToTycon((partial.slots as TyconGameState['slots']) ?? initial.slots);
  const version = typeof partial.version === 'number' && partial.version >= 1 ? partial.version : initial.version;
  return {
    ...initial,
    ...partial,
    version,
    slots,
    diamondsEarnedLifetime:
      typeof partial.diamondsEarnedLifetime === 'number' ? partial.diamondsEarnedLifetime : initial.diamondsEarnedLifetime,
    diamondInventory: { ...initial.diamondInventory, ...partial.diamondInventory },
    machines: partial.machines?.length ? partial.machines.map((m) => ({ ...m })) : initial.machines,
    automation: { ...initial.automation, ...partial.automation },
    activeBoosts: partial.activeBoosts?.length ? partial.activeBoosts.map((b) => ({ ...b })) : [],
    gridLedger: partial.gridLedger?.length ? partial.gridLedger.map((g) => ({ ...g })) : [],
    appliedReceiptIds: partial.appliedReceiptIds?.length ? [...partial.appliedReceiptIds] : [],
    consumables: { ...EMPTY_CONSUMABLES, ...partial.consumables },
    lastIdleTickAt:
      typeof partial.lastIdleTickAt === 'number' ? partial.lastIdleTickAt : initial.lastIdleTickAt,
  };
}
