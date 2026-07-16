import { loadKaspaWasm } from './kaspa-wasm';
import type { ProgrammableNetworkId } from '@/lib/programmable/config';

function hexToBytes(hex: string): Uint8Array {
  const normalized = hex.trim().replace(/^0x/i, '');
  if (!normalized || normalized.length % 2 !== 0) {
    throw new Error('Invalid scriptHex');
  }
  const out = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    out[i / 2] = Number.parseInt(normalized.slice(i, i + 2), 16);
  }
  return out;
}

function scriptArrayToBytes(script: number[]): Uint8Array {
  return Uint8Array.from(script);
}

/** Derive P2SH covenant address from compiled script bytes / hex. */
export async function getCovenantP2shAddress(
  script: number[] | string,
  networkId: ProgrammableNetworkId | string,
): Promise<string> {
  const kaspa = await loadKaspaWasm();
  const bytes = typeof script === 'string' ? hexToBytes(script) : scriptArrayToBytes(script);
  const spk = kaspa.payToScriptHashScript(bytes);
  const addr = kaspa.addressFromScriptPublicKey(spk, String(networkId));
  const s = addr?.toString?.() ?? String(addr);
  if (!s || !s.includes(':')) {
    throw new Error('Failed to derive covenant P2SH address from script');
  }
  return s;
}

export function payloadHexToBytes(payloadHex?: string): Uint8Array | undefined {
  if (!payloadHex?.trim()) return undefined;
  return hexToBytes(payloadHex);
}

export { hexToBytes, scriptArrayToBytes };
