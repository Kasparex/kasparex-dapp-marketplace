/**
 * Run: npx tsx src/lib/game/minecore/apply-event.test.ts
 */
import assert from 'node:assert/strict';
import { createInitialMinecoreState } from './initial-state';
import { applyMinecoreEvent } from './apply-event';
import { normalizePlantSetup } from './asset-usage';
import { sumChargeMs, getMaxChargePerSlotMs } from './battery-utils';
import { computeMinecoreBatteryBonusMsPerSlot } from './nft-deck-benefits';

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

// First battery install into empty pillar receives full slot capacity
{
  let s = unlockedPlantStandard(0, null);
  const bonus = computeMinecoreBatteryBonusMsPerSlot(s);
  const setup = normalizePlantSetup('standard', {
    machineId: 'pulse-drill',
    batteryIds: ['energy-cell'],
    workerNftDeckSlotIndices: [0],
    moduleIds: [],
    boostId: 'none',
    powerNodeIds: [null],
  });
  const expectedCap = sumChargeMs(getMaxChargePerSlotMs(setup, 'standard', bonus));
  const at = Date.now();
  s = applyMinecoreEvent(s, {
    type: 'InstallPart',
    slotIndex: 0,
    at,
    part: { kind: 'battery', id: 'energy-cell', batterySlotIndex: 0 },
  });
  const got = sumChargeMs(s.plantSlots[0]!.batterySlotChargeMs);
  assert.equal(got, expectedCap, 'first battery equip fills pillar to max capacity');
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
