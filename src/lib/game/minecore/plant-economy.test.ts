/**
 * Run: npx tsx src/lib/game/minecore/plant-economy.test.ts
 */
import assert from 'node:assert/strict';
import { createInitialMinecoreState } from './initial-state';
import { hydrateMinecoreState } from './hydrate';
import {
  computeMiningEfficiencyPct,
  computePlantDiamondsPer24h,
  computeProductionKw,
  computeConsumptionKw,
} from './plant-economy';
import { computeRawLiveDiamonds } from './compute';
import { ensureBatterySlotChargeLength, getPlantBatterySlotCount } from './battery-utils';
import type { MinecoreState, PlantSlotState } from './types';

const initial = createInitialMinecoreState();
const template = initial.plantSlots[0]!;

function minecoreWithDeployedWorker(): MinecoreState {
  const s = createInitialMinecoreState();
  const slots = [...(s.nftSlots ?? [])];
  if (slots[0]) slots[0] = { ...slots[0], type: 'worker', nftId: 1, collection: 'KREXPRIME' };
  return { ...s, nftSlots: slots };
}

const mcWorker = minecoreWithDeployedWorker();

function makeSlot(partial: Partial<PlantSlotState> & { setup: PlantSlotState['setup'] }): PlantSlotState {
  const type = partial.type ?? template.type;
  const n = getPlantBatterySlotCount(type);
  const raw = partial.setup.batteryIds ?? template.setup.batteryIds;
  const batteryIds = Array.from({ length: n }, (_, i) => (i < (raw?.length ?? 0) ? raw[i]! : null)) as PlantSlotState['setup']['batteryIds'];
  const chargeDefault = Array.from({ length: n }, (_, i) => (i === 0 ? 10 * 60_000 : 0));
  const charge = partial.batterySlotChargeMs
    ? ensureBatterySlotChargeLength(partial.batterySlotChargeMs, n, 0)
    : chargeDefault;
  return {
    ...template,
    unlocked: true,
    powerRemaining: 5,
    needsRepair: false,
    batterySlotChargeMs: charge,
    batterySnapshotAt: 0,
    diamondsAccumulated: 0,
    cycle: null,
    ...partial,
    type,
    setup: { ...partial.setup, batteryIds, moduleIds: partial.setup.moduleIds ?? [] },
  };
}

// Efficiency: more production should not yield lower efficiency when consumption fixed
{
  const a = makeSlot({
    type: 'standard',
    setup: {
      machineId: 'pulse-drill',
      batteryIds: ['energy-cell'],
      workerNftDeckSlotIndex: null,
      moduleIds: [],
      boostId: 'none',
    },
  });
  const b = makeSlot({
    type: 'advanced',
    setup: {
      machineId: 'pulse-drill',
      batteryIds: ['energy-cell', null, null, null],
      workerNftDeckSlotIndex: null,
      moduleIds: [],
      boostId: 'none',
    },
  });
  assert.ok(computeProductionKw(b) >= computeProductionKw(a));
  assert.ok(computeMiningEfficiencyPct(b) >= computeMiningEfficiencyPct(a) - 1e-6);
}

// Diamonds / 24h scales with plant tier (same rig)
{
  const std = makeSlot({
    type: 'standard',
    setup: {
      machineId: 'pulse-drill',
      batteryIds: ['energy-cell'],
      workerNftDeckSlotIndex: 0,
      moduleIds: [],
      boostId: 'none',
    },
  });
  const adv = makeSlot({
    type: 'advanced',
    setup: {
      machineId: 'pulse-drill',
      batteryIds: ['energy-cell', null, null, null],
      workerNftDeckSlotIndex: 0,
      moduleIds: [],
      boostId: 'none',
    },
  });
  const dStd = computePlantDiamondsPer24h(mcWorker, std);
  const dAdv = computePlantDiamondsPer24h(mcWorker, adv);
  assert.ok(dAdv > dStd);
}

// Cooling module reduces consumption vs baseline
{
  const plain = makeSlot({
    type: 'premium',
    setup: {
      machineId: 'pulse-drill',
      batteryIds: ['energy-cell', null],
      workerNftDeckSlotIndex: 0,
      moduleIds: [],
      boostId: 'none',
    },
  });
  const cooled = makeSlot({
    type: 'premium',
    setup: {
      machineId: 'pulse-drill',
      batteryIds: ['energy-cell', null],
      workerNftDeckSlotIndex: 0,
      moduleIds: ['cooling-module'],
      boostId: 'none',
    },
  });
  assert.ok(computeConsumptionKw(cooled) < computeConsumptionKw(plain));
}

// Offline: after battery depletes, diamond accrual does not keep growing
{
  const start = 10_000;
  const durationMs = 600_000;
  const expectedDiamonds = 100;
  const slot = makeSlot({
    setup: {
      machineId: 'pulse-drill',
      batteryIds: ['energy-cell'],
      workerNftDeckSlotIndex: 0,
      moduleIds: [],
      boostId: 'none',
    },
    batterySlotChargeMs: [60_000],
    batterySnapshotAt: start,
    cycle: {
      startAtMs: start,
      endAtMs: start + durationMs,
      durationMs,
      expectedDiamonds,
      mintedOffset: 0,
      pauseBeganAtMs: null,
    },
  });
  const tAfterDead = start + 120_000;
  const tLater = start + 500_000;
  const rawAfter = computeRawLiveDiamonds(slot, tAfterDead);
  const rawLater = computeRawLiveDiamonds(slot, tLater);
  assert.ok(rawAfter > 0, 'partial yield before/at depletion');
  assert.equal(rawAfter, rawLater, 'diamonds must not grow after battery empty');
}

// Hydrate old save without krexRedeemableTotal / redeemBudget
{
  const raw = JSON.parse(JSON.stringify(createInitialMinecoreState())) as Record<string, unknown>;
  delete raw.krexRedeemableTotal;
  delete raw.redeemBudget;
  const h = hydrateMinecoreState(raw);
  assert.equal(typeof h.krexRedeemableTotal, 'number');
  assert.ok(h.redeemBudget && typeof h.redeemBudget.dayKey === 'string');
}

console.log('plant-economy tests OK');
