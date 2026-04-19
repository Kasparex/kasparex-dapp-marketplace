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
]);
assert.ok(s.appliedReceiptIds.includes('KAS:testhash123456789012345678901234567890123456789012345678901234'));
assert.equal(s.activeBoosts.length, 1);

console.log('apply-event tests OK');
