/**
 * Run: npx tsx src/lib/game/minecore/asset-usage.test.ts
 */
import assert from 'node:assert/strict';
import { createInitialMinecoreState } from './initial-state';
import { applyMinecoreEvent } from './apply-event';

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

console.log('asset-usage.test.ts OK');
