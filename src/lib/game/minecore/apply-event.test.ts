/**
 * Run: npx tsx src/lib/game/minecore/apply-event.test.ts
 */
import assert from 'node:assert/strict';
import { createInitialMinecoreState } from './initial-state';
import { applyMinecoreEvent } from './apply-event';
import { normalizePlantSetup } from './asset-usage';
import { sumChargeMs, hasInstalledBattery, normalizeBatteryIds } from './battery-utils';

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

console.log('apply-event tests OK');
