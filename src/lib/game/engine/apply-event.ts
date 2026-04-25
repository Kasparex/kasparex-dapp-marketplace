import { REFINE_MIN_DIAMONDS } from '@/lib/game/diamond-veins-config';
import type { DiamondCommodity, GameEvent, GridLedgerEntry, TyconGameState } from './types';
import { createInitialTyconState } from './initial-state';
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

/**
 * Deterministic state transition for Diamond Veins Tycoon (client + server).
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
      next.slots[event.slotIndex] = { ...s, nftId: event.nftId, collection: event.collection };
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
      const defaultCollection =
        s.type === 'worker' || s.type === 'engineer'
          ? 'KREXPRIME'
          : s.type === 'operator' || s.type === 'foreman'
            ? 'PIXELKREX'
            : null;
      next.slots[event.slotIndex] = { ...s, nftId: null, collection: defaultCollection };
      if (s.type === 'foreman') {
        next.automation.foremanActive = false;
        next.automation.autoRestartRunsCapPerDay = 0;
      }
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
      next.version = state.version + 1;
      return next;
    }
    case 'DistributeDiamondDelta': {
      if (event.delta <= 0) return state;
      next.diamonds = state.diamonds + event.delta;
      (Object.keys(event.weights) as DiamondCommodity[]).forEach((k) => {
        const portion = event.delta * (event.weights[k] ?? 0);
        next.diamondInventory[k] = (next.diamondInventory[k] ?? 0) + portion;
      });
      next.version = state.version + 1;
      return next;
    }
    case 'Refine': {
      if (state.diamonds < REFINE_MIN_DIAMONDS) return state;
      const amount = Math.floor(state.diamonds);
      const timeSinceLastRefine = (event.at - state.lastRefinedAt) / 1000;
      const refinementPoints = Math.floor(amount * (1 + Math.min(timeSinceLastRefine / 3600, 0.5)));
      const gridCheckpointScore = refinementPoints;
      const entry: GridLedgerEntry = {
        id: `refine_${event.at}_${Math.random().toString(36).slice(2, 9)}`,
        at: event.at,
        refinementPoints,
        diamondsRefined: amount,
        gridCheckpointScore,
        note: 'Refine checkpoint — claim GRID on L2 via Rewards & Points when your pool route is live.',
      };
      next.diamonds = 0;
      next.diamondInventory = {
        chronoShard: 0,
        auroraCore: 0,
        cipherPrism: 0,
        eonCore: 0,
        eclipticFlame: 0,
        rubble: 0,
      };
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
    case 'RedeemGrid': {
      if (state.refinementPointsTotal < event.points) return state;
      next.refinementPointsTotal = state.refinementPointsTotal - event.points;
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
    diamondInventory: { ...initial.diamondInventory, ...partial.diamondInventory },
    machines: partial.machines?.length ? partial.machines.map((m) => ({ ...m })) : initial.machines,
    automation: { ...initial.automation, ...partial.automation },
    activeBoosts: partial.activeBoosts?.length ? partial.activeBoosts.map((b) => ({ ...b })) : [],
    gridLedger: partial.gridLedger?.length ? partial.gridLedger.map((g) => ({ ...g })) : [],
    appliedReceiptIds: partial.appliedReceiptIds?.length ? [...partial.appliedReceiptIds] : [],
  };
}
