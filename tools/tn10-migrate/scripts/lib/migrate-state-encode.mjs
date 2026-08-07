/**
 * Silverscript redeem-script state splice helpers (KCC20 / MigrateTicket / KCC20Migrate).
 * State lives between templatePrefix and templateSuffix (see state_layout from silverc).
 */

export function hexToBytes(hex) {
  const body = String(hex).replace(/^0x/i, '');
  if (body.length % 2) throw new Error(`Odd hex length: ${body.length}`);
  const out = new Uint8Array(body.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(body.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function bytesToHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function i64leBytes(n) {
  const buf = Buffer.alloc(8);
  buf.writeBigInt64LE(BigInt(n));
  return buf;
}

/** Push opcode + payload as it appears inside redeem-script state blobs. */
export function encodePushBytes(payload) {
  const data = payload instanceof Uint8Array ? payload : Buffer.from(payload);
  if (data.length === 0) return Buffer.from([0x00]);
  if (data.length <= 0x4b) return Buffer.concat([Buffer.from([data.length]), data]);
  if (data.length <= 0xff) return Buffer.concat([Buffer.from([0x4c, data.length]), data]);
  throw new Error(`State push too large: ${data.length}`);
}

export function encodePushI64(n) {
  return encodePushBytes(i64leBytes(n));
}

export function encodePushBool(v) {
  return encodePushBytes(Buffer.from([v ? 1 : 0]));
}

export function encodePushByte32(hex32) {
  const b = hexToBytes(hex32);
  if (b.length !== 32) throw new Error(`Expected 32 bytes, got ${b.length}`);
  return encodePushBytes(b);
}

export function encodePushU8(n) {
  return encodePushBytes(Buffer.from([Number(n) & 0xff]));
}

/** MigrateTicket state: threshold, burnTxId, amountRaw, claimantXOnly, active */
export function encodeMigrateTicketState({
  threshold,
  burnTxId,
  amountRaw,
  claimantXOnly,
  active,
}) {
  return Buffer.concat([
    encodePushI64(threshold),
    encodePushByte32(burnTxId),
    encodePushI64(amountRaw),
    encodePushByte32(claimantXOnly),
    encodePushBool(active),
  ]);
}

/** Inactive genesis ticket state (zeros + active=false). */
export function encodeInactiveTicketState(threshold) {
  return encodeMigrateTicketState({
    threshold,
    burnTxId: '00'.repeat(32),
    amountRaw: 0n,
    claimantXOnly: '00'.repeat(32),
    active: false,
  });
}

/** KCC20 asset state: ownerIdentifier, identifierType, amount, isMinter */
export function encodeKcc20State({ ownerIdentifier, identifierType, amount, isMinter }) {
  return Buffer.concat([
    encodePushByte32(ownerIdentifier),
    encodePushU8(identifierType),
    encodePushI64(amount),
    encodePushBool(isMinter),
  ]);
}

/** KCC20Migrate controller state: covid, totalCap, remaining, initialized, adminRenounced */
export function encodeMigrateControllerState({
  assetCovenantId,
  totalCap,
  remainingAllowance,
  initialized,
  adminRenounced,
}) {
  return Buffer.concat([
    encodePushByte32(assetCovenantId),
    encodePushI64(totalCap),
    encodePushI64(remainingAllowance),
    encodePushBool(initialized),
    encodePushBool(adminRenounced),
  ]);
}

export function spliceTemplateScript(template, stateBytes) {
  const prefix = hexToBytes(template.templatePrefix);
  const suffix = hexToBytes(template.templateSuffix);
  const state = stateBytes instanceof Uint8Array ? stateBytes : Buffer.from(stateBytes);
  const expectedLen = Number(template.prefixLength ?? prefix.length);
  const expectedSuffix = Number(template.suffixLength ?? suffix.length);
  if (prefix.length !== expectedLen || suffix.length !== expectedSuffix) {
    throw new Error(
      `Template length mismatch: prefix ${prefix.length}/${expectedLen} suffix ${suffix.length}/${expectedSuffix}`,
    );
  }
  return Buffer.concat([Buffer.from(prefix), Buffer.from(state), Buffer.from(suffix)]);
}
