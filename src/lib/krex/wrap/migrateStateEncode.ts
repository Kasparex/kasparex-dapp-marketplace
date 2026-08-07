/**
 * Silverscript redeem-script state splice helpers for keyless migrate claim assembly.
 * Mirrors tools/tn10-migrate/scripts/lib/migrate-state-encode.mjs
 */

export type ScriptTemplateParts = {
  prefixLength: number;
  suffixLength: number;
  expectedTemplateHash: string;
  templatePrefix: string;
  templateSuffix: string;
};

export function hexToBytes(hex: string): Uint8Array {
  const body = String(hex).replace(/^0x/i, '');
  if (body.length % 2) throw new Error(`Odd hex length: ${body.length}`);
  const out = new Uint8Array(body.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(body.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function bytesToHex(bytes: Uint8Array | number[]): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function i64leBytes(n: bigint | number | string): Uint8Array {
  const v = BigInt(n);
  const out = new Uint8Array(8);
  const view = new DataView(out.buffer);
  view.setBigInt64(0, v, true);
  return out;
}

function encodePushBytes(payload: Uint8Array): Uint8Array {
  if (payload.length === 0) return new Uint8Array([0x00]);
  if (payload.length <= 0x4b) {
    const out = new Uint8Array(1 + payload.length);
    out[0] = payload.length;
    out.set(payload, 1);
    return out;
  }
  if (payload.length <= 0xff) {
    const out = new Uint8Array(2 + payload.length);
    out[0] = 0x4c;
    out[1] = payload.length;
    out.set(payload, 2);
    return out;
  }
  throw new Error(`State push too large: ${payload.length}`);
}

function encodePushI64(n: bigint | number | string): Uint8Array {
  return encodePushBytes(i64leBytes(n));
}

function encodePushBool(v: boolean): Uint8Array {
  return encodePushBytes(new Uint8Array([v ? 1 : 0]));
}

function encodePushByte32(hex32: string): Uint8Array {
  const b = hexToBytes(hex32);
  if (b.length !== 32) throw new Error(`Expected 32 bytes, got ${b.length}`);
  return encodePushBytes(b);
}

function encodePushU8(n: number): Uint8Array {
  return encodePushBytes(new Uint8Array([n & 0xff]));
}

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

export function encodeMigrateTicketState(input: {
  threshold: number;
  burnTxId: string;
  amountRaw: bigint | number | string;
  claimantXOnly: string;
  active: boolean;
}): Uint8Array {
  return concatBytes(
    encodePushI64(input.threshold),
    encodePushByte32(input.burnTxId),
    encodePushI64(input.amountRaw),
    encodePushByte32(input.claimantXOnly),
    encodePushBool(input.active),
  );
}

export function encodeKcc20State(input: {
  ownerIdentifier: string;
  identifierType: number;
  amount: bigint | number | string;
  isMinter: boolean;
}): Uint8Array {
  return concatBytes(
    encodePushByte32(input.ownerIdentifier),
    encodePushU8(input.identifierType),
    encodePushI64(input.amount),
    encodePushBool(input.isMinter),
  );
}

export function encodeMigrateControllerState(input: {
  assetCovenantId: string;
  totalCap: bigint | number | string;
  remainingAllowance: bigint | number | string;
  initialized: boolean;
  adminRenounced: boolean;
}): Uint8Array {
  return concatBytes(
    encodePushByte32(input.assetCovenantId),
    encodePushI64(input.totalCap),
    encodePushI64(input.remainingAllowance),
    encodePushBool(input.initialized),
    encodePushBool(input.adminRenounced),
  );
}

export function spliceTemplateScript(template: ScriptTemplateParts, stateBytes: Uint8Array): Uint8Array {
  const prefix = hexToBytes(template.templatePrefix);
  const suffix = hexToBytes(template.templateSuffix);
  if (prefix.length !== template.prefixLength || suffix.length !== template.suffixLength) {
    throw new Error(
      `Template length mismatch: prefix ${prefix.length}/${template.prefixLength} suffix ${suffix.length}/${template.suffixLength}`,
    );
  }
  return concatBytes(prefix, stateBytes, suffix);
}
