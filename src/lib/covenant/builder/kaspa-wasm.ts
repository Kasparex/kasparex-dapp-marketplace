/**
 * Lazy-load rusty-kaspa web WASM (public/kaspa-sdk) in the browser only.
 * Version: see public/kaspa-sdk/VERSION.txt / package.json (2.0.1+ Toccata).
 */

export interface KaspaWasmScriptBuilder {
  addData: (data: Uint8Array | string) => KaspaWasmScriptBuilder;
  addI64: (value: bigint) => KaspaWasmScriptBuilder;
  drain: () => string;
  encodePayToScriptHashSignatureScript: (signature: Uint8Array | string) => string;
}

export interface KaspaWasmTransactionInput {
  sigOpCount?: number;
  computeBudget?: number;
  signatureScript?: string;
  utxo?: { amount?: bigint };
  sequence?: bigint;
}

export interface KaspaWasmTransactionOutput {
  value: bigint;
  scriptPublicKey?: unknown;
}

export interface KaspaWasmTransaction {
  version: number;
  lockTime?: bigint;
  inputs: KaspaWasmTransactionInput[];
  outputs: KaspaWasmTransactionOutput[];
  populateGenesisCovenants: (groups: Array<{ authorizingInput: number; outputs: number[] }>) => void;
  finalize: () => void;
  serializeToSafeJSON: () => string;
  id?: string;
}

export interface KaspaWasmApi {
  createTransactions: (settings: Record<string, unknown>) => Promise<{
    transactions: Array<{
      transaction: KaspaWasmTransaction;
    }>;
    summary?: { finalTransactionId?: string };
  }>;
  /**
   * Ordered inputs, no mass-chaining. Prefer for covenant spends so the
   * P2SH UTXO stays at a fixed input index.
   */
  createTransaction: (
    utxoEntrySource: Record<string, unknown>[],
    outputs: Array<{ address: string; amount: bigint }>,
    priorityFee: bigint,
    payload?: Uint8Array | string | null,
    sigOpCount?: number | null,
  ) => KaspaWasmTransaction;
  payToScriptHashScript: (redeem: Uint8Array | string) => unknown;
  payToAddressScript: (address: string) => unknown;
  payToScriptHashSignatureScript: (
    redeem: Uint8Array | string,
    signature: Uint8Array | string,
  ) => string;
  addressFromScriptPublicKey: (spk: unknown, network: string) => { toString(): string };
  calculateTransactionFee: (
    networkId: string,
    tx: KaspaWasmTransaction | Record<string, unknown>,
    minimumSignatures?: number | null,
  ) => bigint | undefined;
  ScriptBuilder: {
    new (): KaspaWasmScriptBuilder;
    fromScript: (
      script: Uint8Array | string,
      options?: Record<string, unknown> | null,
    ) => KaspaWasmScriptBuilder;
  };
  Transaction: {
    new (value: Record<string, unknown>): KaspaWasmTransaction;
    deserializeFromSafeJSON: (json: string) => KaspaWasmTransaction;
  };
  TransactionInput: new (value: Record<string, unknown>) => KaspaWasmTransactionInput;
  Address?: new (address: string) => unknown;
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
    if (typeof mod.createTransaction !== 'function') {
      throw new Error('Kaspa WASM SDK missing createTransaction');
    }
    if (typeof mod.ScriptBuilder !== 'function' || typeof mod.Transaction !== 'function') {
      throw new Error('Kaspa WASM SDK missing ScriptBuilder / Transaction');
    }
    if (typeof mod.calculateTransactionFee !== 'function' || typeof mod.payToAddressScript !== 'function') {
      throw new Error('Kaspa WASM SDK missing calculateTransactionFee / payToAddressScript');
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
