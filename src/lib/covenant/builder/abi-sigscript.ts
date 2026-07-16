/**
 * SilverScript / KaspaCom ABI sigscript helpers (browser, no private keys).
 * Mirrors KaspaCom covenant-sdk buildSigScript + P2SH wrap.
 */

import { hexToBytes } from './address';
import { loadKaspaWasm } from './kaspa-wasm';

export type AbiFunctionArg = Uint8Array | bigint;

export interface AbiEntry {
  name: string;
  inputs: Array<{ name: string; type_name: string }>;
}

export interface AbiCompiledLike {
  abi: AbiEntry[];
  without_selector?: boolean;
  script?: number[];
  scriptHex?: string;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function getAbiEntry(compiled: AbiCompiledLike, functionName: string): AbiEntry {
  const entry = compiled.abi.find((c) => c.name === functionName);
  if (!entry) {
    throw new Error(`Function "${functionName}" not found in compiled ABI`);
  }
  return entry;
}

function getFunctionSelector(
  compiled: AbiCompiledLike,
  functionName: string,
): bigint | undefined {
  if (compiled.without_selector) return undefined;
  const selector = compiled.abi.findIndex((c) => c.name === functionName);
  if (selector === -1) {
    throw new Error(`Function "${functionName}" not found in compiled ABI`);
  }
  return BigInt(selector);
}

function encodeFixedByteArray(typeName: string, value: Uint8Array): Uint8Array {
  const match = /^byte\[(\d+)\]$/.exec(typeName);
  if (!match) return value;
  const expected = Number.parseInt(match[1], 10);
  if (value.length !== expected) {
    throw new Error(`Expected ${typeName} but received ${value.length} bytes`);
  }
  return value;
}

/** Build ABI argument prefix (pushes only; redeem appended separately for P2SH). */
export async function buildSigScript(
  compiled: AbiCompiledLike,
  functionName: string,
  functionArgs: AbiFunctionArg[],
): Promise<string> {
  const abiEntry = getAbiEntry(compiled, functionName);
  if (abiEntry.inputs.length !== functionArgs.length) {
    throw new Error(
      `Function "${functionName}" expects ${abiEntry.inputs.length} arguments`,
    );
  }

  const kaspa = await loadKaspaWasm();
  const builder = new kaspa.ScriptBuilder();

  for (let i = 0; i < abiEntry.inputs.length; i++) {
    const input = abiEntry.inputs[i];
    const arg = functionArgs[i];

    if (input.type_name === 'int' || input.type_name === 'bool') {
      if (typeof arg !== 'bigint') {
        throw new Error(
          `Function "${functionName}" param "${input.name}:${input.type_name}" requires a bigint`,
        );
      }
      builder.addI64(arg);
      continue;
    }

    if (input.type_name === 'sig') {
      if (!(arg instanceof Uint8Array) || arg.length !== 65) {
        throw new Error(`Expected sig argument "${input.name}" to be 65 bytes`);
      }
      builder.addData(arg);
      continue;
    }

    if (input.type_name === 'pubkey') {
      if (!(arg instanceof Uint8Array) || arg.length !== 32) {
        throw new Error(`Expected pubkey argument "${input.name}" to be 32 bytes`);
      }
      builder.addData(arg);
      continue;
    }

    if (input.type_name === 'byte' || /^byte\[\d+\]$/.test(input.type_name)) {
      if (!(arg instanceof Uint8Array)) {
        throw new Error(`Expected byte argument "${input.name}" to be Uint8Array`);
      }
      builder.addData(encodeFixedByteArray(input.type_name, arg));
      continue;
    }

    throw new Error(
      `Unsupported ABI argument type "${input.type_name}" for "${functionName}"`,
    );
  }

  const selector = getFunctionSelector(compiled, functionName);
  if (selector !== undefined) {
    builder.addI64(selector);
  }

  return builder.drain();
}

/** P2SH unlock: ABI prefix + redeem script. */
export async function encodeP2shUnlockScript(
  redeemScript: Uint8Array | string,
  abiPrefixHexOrBytes: string | Uint8Array,
): Promise<string> {
  const kaspa = await loadKaspaWasm();
  return kaspa.ScriptBuilder.fromScript(redeemScript).encodePayToScriptHashSignatureScript(
    abiPrefixHexOrBytes,
  );
}

/** Normalize wallet pubkey hex to 32-byte x-only. */
export function toXOnlyPubkeyBytes(publicKeyHex: string): Uint8Array {
  let bytes = hexToBytes(publicKeyHex.trim().replace(/^0x/i, ''));
  if (bytes.length === 33 && (bytes[0] === 0x02 || bytes[0] === 0x03)) {
    bytes = bytes.slice(1);
  }
  if (bytes.length !== 32) {
    throw new Error(
      `Expected 32-byte x-only pubkey (or 33-byte compressed); got ${bytes.length} bytes`,
    );
  }
  return bytes;
}

/**
 * Strip optional length prefix from createInputSignature / wallet output.
 * Accepts 65 (sig+sighash) or 66 (0x41 + sig+sighash).
 */
export function normalizeSchnorrSignature(raw: Uint8Array | string): Uint8Array {
  let signature = typeof raw === 'string' ? hexToBytes(raw) : raw;
  if (signature.length === 66 && signature[0] === 65) {
    signature = signature.slice(1);
  }
  if (signature.length === 64) {
    const withType = new Uint8Array(65);
    withType.set(signature);
    withType[64] = 0x01; // SIGHASH_ALL wire byte used by KasWare / KasCoven
    return withType;
  }
  if (signature.length !== 65) {
    throw new Error(`Expected 65-byte schnorr+sighash signature; got ${signature.length}`);
  }
  return signature;
}

/** Walk a signatureScript and return the first 64/65-byte data push as a normalized sig. */
export function extractSchnorrSigFromSignatureScript(signatureScriptHex: string): Uint8Array {
  const bytes = hexToBytes(signatureScriptHex);
  let i = 0;
  while (i < bytes.length) {
    const op = bytes[i++];
    let len = 0;
    if (op === 0) continue;
    if (op >= 1 && op <= 75) {
      len = op;
    } else if (op === 0x4c) {
      if (i >= bytes.length) break;
      len = bytes[i++];
    } else if (op === 0x4d) {
      if (i + 1 >= bytes.length) break;
      len = bytes[i] | (bytes[i + 1] << 8);
      i += 2;
    } else {
      continue;
    }
    if (i + len > bytes.length) break;
    const data = bytes.slice(i, i + len);
    i += len;
    if (data.length === 64 || data.length === 65 || data.length === 66) {
      return normalizeSchnorrSignature(data);
    }
  }
  throw new Error(
    'Could not extract a schnorr signature from the wallet signatureScript. The wallet must sign the covenant input with the redeem script (scripts option).',
  );
}

export function redeemScriptBytes(compiled: AbiCompiledLike): Uint8Array {
  if (Array.isArray(compiled.script) && compiled.script.length > 0) {
    return Uint8Array.from(compiled.script);
  }
  const hex = String(compiled.scriptHex ?? '');
  if (!hex) throw new Error('Compiled contract is missing script / scriptHex');
  return hexToBytes(hex);
}

export { bytesToHex };
