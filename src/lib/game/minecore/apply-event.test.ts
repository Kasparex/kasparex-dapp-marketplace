/**
 * Run: npx tsx src/lib/game/minecore/apply-event.test.ts
 */
import assert from 'node:assert/strict';
import { createInitialMinecoreState } from './initial-state';
import { applyMinecoreEvent } from './apply-event';
import { normalizePlantSetup } from './asset-usage';
import { sumChargeMs, hasInstalledBattery, normalizeBatteryIds } from './battery-utils';
import { MINECORE_DAY_MS } from './config';

function minecoreWithWorkerDeployed() {
  const s = createInitialMinecoreState();
  const nftSlots = [...(s.nftSlots ?? [])];
  if (nftSlots[0]) nftSlots[0] = { ...nftSlots[0], type: 'worker', nftId: 1, collection: 'KREXPRIME' };
  return { ...s, nftSlots };
}

function unlockedPlantStandard(chargeMs: number, batteryId: 'energy-cell' | null = 'energy-cell') {
  const base = minecoreWithWorkerDeployed();
  const slot = base.plantSlots[0]!;
  slot.unlocked = true;
  slot.type = 'standard';
  slot.powerRemaining = 1;
  slot.rollingCapWindowStartMs = Date.now();
  slot.plantLastServicedAtMs = Date.now();
  slot.setup = normalizePlantSetup('standard', {
    machineId: 'pulse-drill',
    batteryIds: batteryId ? [batteryId] : [null],
    workerNftDeckSlotIndices: [0],
    moduleIds: [],
    boostId: 'none',
    powerNodeIds: [null],
  });
  slot.batterySlotChargeMs = [chargeMs];
  slot.batterySnapshotAt = Date.now();
  slot.cycle = null;
  return {
    ...base,
    owned: {
      ...base.owned,
      machines: { ...base.owned.machines, 'pulse-drill': 6 },
      batteries: { ...base.owned.batteries, 'energy-cell': 6 },
    },
  };
}

// Re-installing the same battery must not refill charge for free
{
  const charge = 400_000;
  let s = unlockedPlantStandard(charge);
  const at = Date.now();
  const beforeTotal = sumChargeMs(s.plantSlots[0]!.batterySlotChargeMs);
  s = applyMinecoreEvent(s, {
    type: 'InstallPart',
    slotIndex: 0,
    at,
    part: { kind: 'battery', id: 'energy-cell', batterySlotIndex: 0 },
  });
  const afterTotal = sumChargeMs(s.plantSlots[0]!.batterySlotChargeMs);
  assert.ok(Math.abs(afterTotal - beforeTotal) <= 1, `same battery reinstall preserves charge (${beforeTotal} vs ${afterTotal})`);
}

// First battery install into empty pillar starts empty until paid recharge (no free implicit fill)
{
  let s = unlockedPlantStandard(0, null);
  const at = Date.now();
  s = applyMinecoreEvent(s, {
    type: 'InstallPart',
    slotIndex: 0,
    at,
    part: { kind: 'battery', id: 'energy-cell', batterySlotIndex: 0 },
  });
  assert.equal(sumChargeMs(s.plantSlots[0]!.batterySlotChargeMs), 0, 'equip into empty pillar starts at zero charge');
}

// Remove → reinstall: only after pillar is drained (0 ms)
{
  let s = unlockedPlantStandard(0);
  const at = Date.now();
  assert.ok(hasInstalledBattery(s.plantSlots[0]!.setup, 'standard'));
  s = applyMinecoreEvent(s, { type: 'InstallPart', slotIndex: 0, at, part: { kind: 'battery', id: null, batterySlotIndex: 0 } });
  assert.ok(!hasInstalledBattery(s.plantSlots[0]!.setup, 'standard'));
  s = applyMinecoreEvent(s, {
    type: 'InstallPart',
    slotIndex: 0,
    at: at + 1,
    part: { kind: 'battery', id: 'energy-cell', batterySlotIndex: 0 },
  });
  assert.equal(sumChargeMs(s.plantSlots[0]!.batterySlotChargeMs), 0, 'reinstall after remove stays empty until recharge');
}

// Cannot remove or swap pack while pillar still holds runtime charge
{
  let s = unlockedPlantStandard(400_000);
  const beforeBat = [...normalizeBatteryIds(s.plantSlots[0]!.setup, 'standard')];
  const beforeCharge = [...s.plantSlots[0]!.batterySlotChargeMs];
  const out = applyMinecoreEvent(s, {
    type: 'InstallPart',
    slotIndex: 0,
    at: Date.now(),
    part: { kind: 'battery', id: null, batterySlotIndex: 0 },
  });
  assert.deepEqual(normalizeBatteryIds(out.plantSlots[0]!.setup, 'standard'), beforeBat);
  assert.deepEqual(out.plantSlots[0]!.batterySlotChargeMs, beforeCharge);
}

// Identical machine InstallPart leaves battery charges unchanged (no-op path)
{
  let s = unlockedPlantStandard(123_456);
  const before = [...s.plantSlots[0]!.batterySlotChargeMs];
  const at = Date.now();
  s = applyMinecoreEvent(s, {
    type: 'InstallPart',
    slotIndex: 0,
    at,
    part: { kind: 'machine', id: 'pulse-drill' },
  });
  assert.deepEqual(s.plantSlots[0]!.batterySlotChargeMs, before);
}

// Removing battery from one pillar must not clear sibling pillar charge (premium / multi-slot)
{
  let s = minecoreWithWorkerDeployed();
  const slot = s.plantSlots[0]!;
  slot.unlocked = true;
  slot.type = 'premium';
  slot.powerRemaining = 2;
  slot.rollingCapWindowStartMs = Date.now();
  slot.plantLastServicedAtMs = Date.now();
  slot.setup = normalizePlantSetup('premium', {
    machineId: 'pulse-drill',
    batteryIds: ['energy-cell', 'energy-cell'],
    workerNftDeckSlotIndices: [0, null],
    moduleIds: [],
    boostId: 'none',
    powerNodeIds: [null, null],
  });
  slot.batterySlotChargeMs = [300_000, 0];
  slot.batterySnapshotAt = Date.now();
  slot.cycle = null;
  s = {
    ...s,
    owned: {
      ...s.owned,
      machines: { ...s.owned.machines, 'pulse-drill': 6 },
      batteries: { ...s.owned.batteries, 'energy-cell': 6 },
    },
  };
  const at = Date.now();
  const out = applyMinecoreEvent(s, {
    type: 'InstallPart',
    slotIndex: 0,
    at,
    part: { kind: 'battery', id: null, batterySlotIndex: 1 },
  });
  assert.equal(out.plantSlots[0]!.batterySlotChargeMs[0], 300_000, 'sibling pillar charge preserved when removing empty pillar pack');
  assert.equal(out.plantSlots[0]!.batterySlotChargeMs[1], 0);
  assert.equal(normalizeBatteryIds(out.plantSlots[0]!.setup, 'premium')[1], null);
}

// Extract after battery drained in an active run must persist empty pillars (no stale snapshot refill)
{
  const at0 = Date.now();
  let s = unlockedPlantStandard(3_600_000);
  const slot = s.plantSlots[0]!;
  slot.batterySnapshotAt = at0;
  slot.cycle = {
    startAtMs: at0,
    endAtMs: at0 + 100 * MINECORE_DAY_MS,
    durationMs: 60_000,
    expectedDiamonds: 10,
    mintedOffset: 0,
    pauseBeganAtMs: null,
  };
  const atExtract = at0 + 3_600_000 + 1_000;
  s = applyMinecoreEvent(s, { type: 'Extract', slotIndex: 0, at: atExtract });
  assert.equal(sumChargeMs(s.plantSlots[0]!.batterySlotChargeMs), 0, 'Extract keeps battery empty after drain (no full snapshot restore)');
}

console.log('apply-event tests OK');
