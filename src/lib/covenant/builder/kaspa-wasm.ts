/**
 * Lazy-load rusty-kaspa web WASM (public/kaspa-sdk) in the browser only.
 * Version: see public/kaspa-sdk/VERSION.txt / package.json (2.0.1+ Toccata).
 */

export interface KaspaWasmApi {
  createTransactions: (settings: Record<string, unknown>) => Promise<{
    transactions: Array<{
      transaction: KaspaWasmTransaction;
    }>;
    summary?: { finalTransactionId?: string };
  }>;
  payToScriptHashScript: (redeem: Uint8Array | string) => unknown;
  addressFromScriptPublicKey: (spk: unknown, network: string) => { toString(): string };
  Address?: new (address: string) => unknown;
}

export interface KaspaWasmTransaction {
  version: number;
  inputs: Array<{
    sigOpCount?: number;
    computeBudget?: number;
  }>;
  outputs: unknown[];
  populateGenesisCovenants: (groups: Array<{ authorizingInput: number; outputs: number[] }>) => void;
  finalize: () => void;
  serializeToSafeJSON: () => string;
  id?: string;
}

type KaspaModule = KaspaWasmApi & {
  default: (input?: RequestInfo | URL | BufferSource | WebAssembly.Module | { module_or_path?: unknown }) => Promise<unknown>;
};

let cached: KaspaWasmApi | null = null;
let loading: Promise<KaspaWasmApi> | null = null;

const SDK_BASE = '/kaspa-sdk';

export function isKaspaWasmAvailable(): boolean {
  return typeof window !== 'undefined';
}

export async function loadKaspaWasm(): Promise<KaspaWasmApi> {
  if (typeof window === 'undefined') {
    throw new Error('Kaspa WASM covenant builder runs in the browser only');
  }
  if (cached) return cached;
  if (loading) return loading;

  loading = (async () => {
    // Avoid Next/webpack rewriting the public SDK URL.
    const importSdk = new Function('u', 'return import(u)') as (u: string) => Promise<KaspaModule>;
    const mod = await importSdk(`${SDK_BASE}/kaspa.js`);
    await mod.default({ module_or_path: `${SDK_BASE}/kaspa_bg.wasm` });
    if (typeof mod.createTransactions !== 'function' || typeof mod.payToScriptHashScript !== 'function') {
      throw new Error('Kaspa WASM SDK missing createTransactions / payToScriptHashScript');
    }
    cached = mod;
    return mod;
  })();

  try {
    return await loading;
  } catch (err) {
    loading = null;
    throw err;
  }
}
