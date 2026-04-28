/**
 * Run: npx tsx src/lib/game/minecore/asset-usage.test.ts
 */
import assert from 'node:assert/strict';
import { createInitialMinecoreState } from './initial-state';
import { applyMinecoreEvent } from './apply-event';
import {
  countMachinesAssignedExcept,
  countWorkersAssignedExcept,
  explainPlantSetupBlock,
  nextPlantSetupAfterInstallPart,
} from './asset-usage';
import { enforcePlantInventoryInvariants } from './inventory-invariants';

const now = Date.now();

let s = createInitialMinecoreState();
s.owned.machines['pulse-drill'] = 1;
const slot1 = s.plantSlots[1];
if (slot1) {
  slot1.unlocked = true;
  slot1.rollingCapWindowStartMs = now;
}

s = applyMinecoreEvent(s, {
  type: 'InstallPart',
  slotIndex: 0,
  at: now,
  part: { kind: 'machine', id: 'pulse-drill' },
});

assert.equal(s.plantSlots[0]?.setup.machineId, 'pulse-drill');

const afterDup = applyMinecoreEvent(s, {
  type: 'InstallPart',
  slotIndex: 1,
  at: now,
  part: { kind: 'machine', id: 'pulse-drill' },
});

assert.equal(afterDup.plantSlots[1]?.setup.machineId, null);

// ── exceptSlotIndex uses plantSlots array position, not slot.index ───────────

{
  const base = createInitialMinecoreState();
  base.plantSlots[0].unlocked = true;
  base.plantSlots[1].unlocked = true;
  base.plantSlots[0].rollingCapWindowStartMs = now;
  base.plantSlots[1].rollingCapWindowStartMs = now;
  base.plantSlots[0].setup.machineId = 'pulse-drill';
  base.plantSlots[1].setup.machineId = 'pulse-drill';
  // Simulate drift: metadata index does not match array index (bug old exclude logic).
  base.plantSlots[1].index = 999;

  assert.equal(
    countMachinesAssignedExcept(base.plantSlots, 'pulse-drill', 1),
    1,
    'must exclude current slot by array index so wrong slot.index does not double-count',
  );
}

{
  const base = createInitialMinecoreState();
  base.owned.workers.worker = 2;
  base.plantSlots[0].unlocked = true;
  base.plantSlots[1].unlocked = true;
  base.plantSlots[0].rollingCapWindowStartMs = now;
  base.plantSlots[1].rollingCapWindowStartMs = now;
  base.plantSlots[0].setup.workerId = 'worker';
  base.plantSlots[1].setup.workerId = 'worker';
  base.plantSlots[1].index = 777;

  assert.equal(countWorkersAssignedExcept(base.plantSlots, 'worker', 1), 1);
}

// ── Multi-plant: two rigs owned → both slots can equip pulse-drill ────────────

{
  let mc = createInitialMinecoreState();
  mc.owned.machines['pulse-drill'] = 2;
  mc.plantSlots[0].unlocked = true;
  mc.plantSlots[1].unlocked = true;
  mc.plantSlots[0].rollingCapWindowStartMs = now;
  mc.plantSlots[1].rollingCapWindowStartMs = now;

  mc = applyMinecoreEvent(mc, {
    type: 'InstallPart',
    slotIndex: 0,
    at: now,
    part: { kind: 'machine', id: 'pulse-drill' },
  });
  mc = applyMinecoreEvent(mc, {
    type: 'InstallPart',
    slotIndex: 1,
    at: now,
    part: { kind: 'machine', id: 'pulse-drill' },
  });
  assert.equal(mc.plantSlots[0]?.setup.machineId, 'pulse-drill');
  assert.equal(mc.plantSlots[1]?.setup.machineId, 'pulse-drill');
}

// ── Swap-style nextSetup + explainPlantSetupBlock ───────────────────────────

{
  let mc = createInitialMinecoreState();
  mc.owned.machines['pulse-drill'] = 1;
  mc.plantSlots[0].unlocked = true;
  mc.plantSlots[1].unlocked = true;
  mc.plantSlots[0].rollingCapWindowStartMs = now;
  mc.plantSlots[1].rollingCapWindowStartMs = now;
  mc.plantSlots[0].setup.machineId = 'pulse-drill';

  const slot = mc.plantSlots[1];
  assert.ok(slot);
  const nextSetup = nextPlantSetupAfterInstallPart(slot, { kind: 'machine', id: 'pulse-drill' });
  const msg = explainPlantSetupBlock(mc, 1, nextSetup);
  assert.ok(typeof msg === 'string' && msg.length > 0);
}

{
  let mc = createInitialMinecoreState();
  mc.plantSlots[1].unlocked = true;
  mc.plantSlots[1].rollingCapWindowStartMs = now;
  mc.owned.machines['pulse-drill'] = 1;
  mc.plantSlots[0].setup.machineId = 'pulse-drill';
  mc.plantSlots[1].setup.machineId = 'pulse-drill';
  const fixed = enforcePlantInventoryInvariants(mc);
  const pulseCount = fixed.plantSlots.filter((p) => p.unlocked && p.setup.machineId === 'pulse-drill').length;
  assert.equal(pulseCount, 1);
}

console.log('asset-usage.test.ts OK');
