/**
 * Run: npx tsx src/lib/game/minecore/asset-usage.test.ts
 */
import assert from 'node:assert/strict';
import { createInitialMinecoreState } from './initial-state';
import { applyMinecoreEvent } from './apply-event';
import { hydrateMinecoreState } from './hydrate';
import {
  countMachinesAssignedExcept,
  countWorkerNftDeckAssignmentsExcept,
  explainPlantSetupBlock,
  nextPlantSetupAfterInstallPart,
} from './asset-usage';
import { enforcePlantInventoryInvariants } from './inventory-invariants';

const now = Date.now();

let s = createInitialMinecoreState();
s.owned.machines['pulse-drill'] = 1;
if (s.nftSlots[0]) s.nftSlots[0] = { type: 'worker', nftId: 501, collection: 'KREXPRIME' };
if (s.nftSlots[1]) s.nftSlots[1] = { type: 'operator', nftId: 502, collection: 'PIXELKREX' };
s.plantSlots[0]!.setup.workerNftDeckSlotIndices = [0];
s.plantSlots[1]!.setup.workerNftDeckSlotIndices = [1];
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
  base.plantSlots[0].unlocked = true;
  base.plantSlots[1].unlocked = true;
  base.plantSlots[0].rollingCapWindowStartMs = now;
  base.plantSlots[1].rollingCapWindowStartMs = now;
  base.plantSlots[0].setup.workerNftDeckSlotIndices = [0];
  base.plantSlots[1].setup.workerNftDeckSlotIndices = [0];
  base.plantSlots[1].index = 777;
  if (base.nftSlots[0]) {
    base.nftSlots[0] = { type: 'worker', nftId: 100, collection: 'KREXPRIME' };
  }

  assert.equal(countWorkerNftDeckAssignmentsExcept(base.plantSlots, 0, 1), 1);
}

// ── Multi-plant: two rigs owned → both slots can equip pulse-drill ────────────

{
  let mc = createInitialMinecoreState();
  mc.owned.machines['pulse-drill'] = 2;
  mc.plantSlots[0].unlocked = true;
  mc.plantSlots[1].unlocked = true;
  mc.plantSlots[0].rollingCapWindowStartMs = now;
  mc.plantSlots[1].rollingCapWindowStartMs = now;
  if (mc.nftSlots[0]) mc.nftSlots[0] = { type: 'worker', nftId: 201, collection: 'KREXPRIME' };
  if (mc.nftSlots[1]) mc.nftSlots[1] = { type: 'operator', nftId: 202, collection: 'PIXELKREX' };
  mc.plantSlots[0].setup.workerNftDeckSlotIndices = [0];
  mc.plantSlots[1].setup.workerNftDeckSlotIndices = [1];

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
  if (mc.nftSlots[0]) mc.nftSlots[0] = { type: 'worker', nftId: 301, collection: 'KREXPRIME' };
  if (mc.nftSlots[1]) mc.nftSlots[1] = { type: 'operator', nftId: 302, collection: 'PIXELKREX' };
  mc.plantSlots[0].setup.workerNftDeckSlotIndices = [0];
  mc.plantSlots[1].setup.workerNftDeckSlotIndices = [1];

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

// ── Hydrate preserves extra nft deck rows and clamps stale plant NFT deck pointers ──

{
  const base = createInitialMinecoreState();
  const persisted = JSON.parse(JSON.stringify(base)) as typeof base;
  persisted.nftSlots = [...persisted.nftSlots, { type: 'worker', nftId: 999, collection: 'KREXPRIME' }];
  const ps = persisted.plantSlots[0]?.setup as Record<string, unknown>;
  delete ps.workerNftDeckSlotIndices;
  ps.workerNftDeckSlotIndex = 3;
  const h = hydrateMinecoreState(persisted);
  assert.equal(h.nftSlots.length, 4);
  assert.equal(h.plantSlots[0]?.setup.workerNftDeckSlotIndices?.[0], 3);
}

{
  const base = createInitialMinecoreState();
  const persisted = JSON.parse(JSON.stringify(base)) as typeof base;
  const ps = persisted.plantSlots[0]?.setup as Record<string, unknown>;
  delete ps.workerNftDeckSlotIndices;
  ps.workerNftDeckSlotIndex = 99;
  const h = hydrateMinecoreState(persisted);
  assert.equal(h.nftSlots.length, 3);
  assert.equal(h.plantSlots[0]?.setup.workerNftDeckSlotIndices?.[0], null);
}

console.log('asset-usage.test.ts OK');
