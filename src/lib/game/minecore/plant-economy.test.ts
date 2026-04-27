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
import type { PlantSlotState } from './types';

const initial = createInitialMinecoreState();
const template = initial.plantSlots[0]!;

function makeSlot(partial: Partial<PlantSlotState> & { setup: PlantSlotState['setup'] }): PlantSlotState {
  return {
    ...template,
    unlocked: true,
    powerRemaining: 5,
    needsRepair: false,
    batteryChargeMs: 30 * 60_000,
    batterySnapshotAt: 0,
    diamondsAccumulated: 0,
    cycle: null,
    ...partial,
    setup: partial.setup,
  };
}

// Efficiency: more production should not yield lower efficiency when consumption fixed
{
  const a = makeSlot({ type: 'standard', setup: { machineId: 'pulse-drill', batteryId: 'energy-cell', workerId: 'worker', moduleIds: [], boostId: 'none' } });
  const b = makeSlot({ type: 'advanced', setup: { machineId: 'pulse-drill', batteryId: 'energy-cell', workerId: 'worker', moduleIds: [], boostId: 'none' } });
  assert.ok(computeProductionKw(b) >= computeProductionKw(a));
  assert.ok(computeMiningEfficiencyPct(b) >= computeMiningEfficiencyPct(a) - 1e-6);
}

// Diamonds / 24h scales with plant tier (same rig)
{
  const std = makeSlot({ type: 'standard', setup: { machineId: 'pulse-drill', batteryId: 'energy-cell', workerId: 'worker', moduleIds: [], boostId: 'none' } });
  const adv = makeSlot({ type: 'advanced', setup: { machineId: 'pulse-drill', batteryId: 'energy-cell', workerId: 'worker', moduleIds: [], boostId: 'none' } });
  const dStd = computePlantDiamondsPer24h(initial, std);
  const dAdv = computePlantDiamondsPer24h(initial, adv);
  assert.ok(dAdv > dStd);
}

// Cooling module reduces consumption vs baseline
{
  const plain = makeSlot({
    type: 'premium',
    setup: { machineId: 'pulse-drill', batteryId: 'energy-cell', workerId: 'worker', moduleIds: [], boostId: 'none' },
  });
  const cooled = makeSlot({
    type: 'premium',
    setup: { machineId: 'pulse-drill', batteryId: 'energy-cell', workerId: 'worker', moduleIds: ['cooling-module'], boostId: 'none' },
  });
  assert.ok(computeConsumptionKw(cooled) < computeConsumptionKw(plain));
}

// Offline: after battery depletes, diamond accrual does not keep growing
{
  const start = 10_000;
  const durationMs = 600_000;
  const expectedDiamonds = 100;
  const slot = makeSlot({
    setup: { machineId: 'pulse-drill', batteryId: 'energy-cell', workerId: 'worker', moduleIds: [], boostId: 'none' },
    batteryChargeMs: 60_000,
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
