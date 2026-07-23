/**
 * Run manually: npx tsx src/lib/game/engine/apply-event.test.ts
 */
import assert from 'node:assert/strict';
import { createInitialTyconState } from './initial-state';
import { applyEvent, applyEvents } from './apply-event';

let s = createInitialTyconState();
s = applyEvent(s, { type: 'AccumulateDiamonds', delta: 150, at: Date.now() });
assert.equal(Math.floor(s.diamonds), 150);

s = applyEvent(s, { type: 'Refine', at: Date.now() });
assert.equal(s.diamonds, 0);
assert.ok(s.gridLedger.length >= 1);
assert.ok(s.refinementPointsTotal > 0);

s = applyEvents(s, [
  { type: 'RegisterReceipt', receiptId: 'KAS:testhash123456789012345678901234567890123456789012345678901234', at: 1 },
  {
    type: 'AddBoost',
    boost: {
      id: 'b1',
      type: 'yield',
      multiplier: 0.1,
      endTime: Date.now() + 1000,
      name: 't',
    },
  },
  { type: 'AddNftDeckSlot', slotType: 'worker', at: Date.now() },
  {
    type: 'DeployNFT',
    slotIndex: 0,
    nftId: 1,
    collection: 'KREXPRIME',
    energyMax: 60_000,
  },
  { type: 'AddConsumables', itemId: 'field-ration', count: 2, at: Date.now() },
]);
assert.ok(s.appliedReceiptIds.includes('KAS:testhash123456789012345678901234567890123456789012345678901234'));
assert.equal(s.activeBoosts.length, 1);
assert.ok(s.slots.length >= 2);
assert.equal(s.slots[0]!.nftId, 1);
assert.equal(s.consumables['field-ration'], 2);

s = applyEvent(s, {
  type: 'TickIdleMining',
  deltaSeconds: 1,
  slotDeltas: s.slots.map((_, i) => (i === 0 ? 1.5 : 0)),
  energyDrains: s.slots.map((_, i) => (i === 0 ? 1000 : 0)),
  at: Date.now(),
});
assert.equal(s.diamonds, 1);
assert.ok((s.diamondDust ?? 0) >= 0.4);
assert.ok((s.slots[0]!.energy ?? 0) < 60_000);

console.log('apply-event tests OK');
