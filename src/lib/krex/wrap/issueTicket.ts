/**
 * Server-side (Vercel Node runtime) MigrateTicket genesis + 2-of-3 issue.
 *
 * Ports the signing/broadcast section of
 * tools/tn10-migrate/scripts/broadcast-tkrex-migrate-ticket-issue.mjs, minus silverc:
 * the ticket redeem script is spliced from `tip.ticketTemplate` (already compiled
 * once during the v3 deploy) instead of recompiling with silverc, so this can run
 * inside a Next.js API route without the Silverscript toolchain.
 *
 * Requires on Vercel (set as project env vars):
 *   TKREX_WALLET3_PRIVKEY        - funds the ticket genesis UTXO
 *   TKREX_ATTESTOR1_PRIVKEY      - at least 2 of these 3 are required
 *   TKREX_ATTESTOR2_PRIVKEY
 *   TKREX_ATTESTOR3_PRIVKEY
 * Optional:
 *   TKREX_ATTESTOR_ROSTER_JSON   - JSON array of the 3 roster x-only pubkeys
 *                                  (defaults to the deployed TN10 roster below)
 *   TKREX_RPC_URL                - explicit TN10 RPC url (else public Resolver)
 *   TKREX_TICKET_FUNDING_SOMPI   - default 50_000_000
 *   TKREX_PRIORITY_FEE_SOMPI     - default 15_000_000
 */

import {
  encodeInactiveTicketState,
  encodeMigrateTicketState,
  spliceTemplateScript,
  hexToBytes,
  type ScriptTemplateParts,
} from './migrateStateEncode';
import { loadMigrateMintTip } from './mintReceiptStore';

const NETWORK_ID = 'testnet-10';
const ATTESTOR_THRESHOLD = 2;
const ISSUE_SELECTOR = 0n;
const TN10_UTXOS = (address: string) =>
  `https://api-tn10.kaspa.org/addresses/${encodeURIComponent(address)}/utxos`;

/** Public x-only pubkeys baked into the deployed MigrateTicket contract (not secrets). */
const DEFAULT_ATTESTOR_ROSTER = [
  '26a8d6aec04830c5d5918edc684d7ee6adfea8fa267af12e67b3b53f8d4aa051',
  '0c60dc1322d89aee6fdd8d1f0b445a189473b23b41c2a68db8d5ce570ff0f910',
  'eb4c84fa5e018fe9e819b4fc05e217f73805e624f5fe5662ee44f1f14513277a',
];

function attestorRoster(): string[] {
  const raw = process.env.TKREX_ATTESTOR_ROSTER_JSON?.trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === 3) {
        return parsed.map((p) => String(p).trim().toLowerCase().replace(/^0x/i, ''));
      }
    } catch {
      /* fall through to default roster */
    }
  }
  return DEFAULT_ATTESTOR_ROSTER;
}

function envPrivHex(name: string): string {
  const v = process.env[name]?.trim().replace(/^0x/i, '').replace(/\s+/g, '') || '';
  return /^[0-9a-fA-F]{64}$/.test(v) ? v : '';
}

function fundingPrivHex(): string {
  return envPrivHex('TKREX_WALLET3_PRIVKEY');
}

function attestorPrivHex(id: 1 | 2 | 3): string {
  return envPrivHex(`TKREX_ATTESTOR${id}_PRIVKEY`);
}

/** True when Hub has enough secrets configured to issue tickets automatically. */
export function canIssueTicketsOnHub(): boolean {
  if (!fundingPrivHex()) return false;
  const attestorCount = ([1, 2, 3] as const).filter((id) => attestorPrivHex(id)).length;
  return attestorCount >= ATTESTOR_THRESHOLD;
}

// --- Server-side Kaspa WASM loader (public/kaspa-sdk, Node runtime only) ---

type KaspaModule = Record<string, unknown> & {
  default: (input: { module_or_path: Uint8Array }) => Promise<unknown>;
};

let cachedKaspa: KaspaModule | null = null;
let loadingKaspa: Promise<KaspaModule> | null = null;

async function loadServerKaspaWasm(): Promise<KaspaModule> {
  if (typeof window !== 'undefined') {
    throw new Error('issueTicket: server-only module loaded in the browser');
  }
  if (cachedKaspa) return cachedKaspa;
  if (loadingKaspa) return loadingKaspa;

  loadingKaspa = (async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const { pathToFileURL } = await import('node:url');
    const sdkDir = join(process.cwd(), 'public', 'kaspa-sdk');
    const kaspaJsUrl = pathToFileURL(join(sdkDir, 'kaspa.js')).href;
    const wasmBytes = readFileSync(join(sdkDir, 'kaspa_bg.wasm'));
    // Avoid Next/webpack rewriting this dynamic import to a bundled asset path.
    const importSdk = new Function('u', 'return import(u)') as (u: string) => Promise<KaspaModule>;
    const mod = await importSdk(kaspaJsUrl);
    await mod.default({ module_or_path: wasmBytes });
    cachedKaspa = mod;
    return mod;
  })();

  try {
    return await loadingKaspa;
  } catch (err) {
    loadingKaspa = null;
    throw err;
  }
}

function normalizeSchnorrSignature(raw: unknown): Uint8Array {
  let signature = typeof raw === 'string' ? hexToBytes(raw) : (raw as Uint8Array);
  if (signature.length === 66 && signature[0] === 65) signature = signature.slice(1);
  if (signature.length === 64) {
    const withType = new Uint8Array(65);
    withType.set(signature);
    withType[64] = 0x01;
    return withType;
  }
  if (signature.length !== 65) {
    throw new Error(`Expected 65-byte schnorr+sighash; got ${signature.length}`);
  }
  return signature;
}

type FetchedUtxo = {
  address: unknown;
  outpoint: { transactionId: string; index: number };
  amount: bigint;
  scriptHex: string;
  blockDaaScore: bigint;
  isCoinbase: boolean;
};

async function fetchUtxos(
  address: string,
  AddressCtor: new (a: string) => unknown,
): Promise<FetchedUtxo[]> {
  const res = await fetch(TN10_UTXOS(address), {
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`UTXO fetch failed: ${res.status}`);
  const raw = (await res.json()) as unknown;
  const list = Array.isArray(raw)
    ? raw
    : ((raw as { utxos?: unknown[]; result?: unknown[] }).utxos ??
      (raw as { result?: unknown[] }).result ??
      []);
  return (list as Array<Record<string, unknown>>).map((u) => {
    const outpoint = (u.outpoint || u.previousOutpoint || {}) as Record<string, unknown>;
    const entry = (u.utxoEntry || u.entry || u) as Record<string, unknown>;
    const amount = BigInt(String((entry.amount as string | number | undefined) ?? u.amount ?? 0));
    const spkEntry = entry.scriptPublicKey as
      | string
      | { scriptPublicKey?: unknown; script?: unknown }
      | undefined;
    const spkRaw =
      (typeof spkEntry === 'object' && spkEntry
        ? (spkEntry.scriptPublicKey ?? spkEntry.script)
        : spkEntry) ??
      u.scriptPublicKey ??
      '';
    const script =
      typeof spkRaw === 'string'
        ? spkRaw.replace(/^0x/i, '')
        : Buffer.from(spkRaw as Uint8Array | number[]).toString('hex');
    return {
      address: new AddressCtor(address),
      outpoint: {
        transactionId: String(outpoint.transactionId || outpoint.transaction_id || ''),
        index: Number(outpoint.index ?? outpoint.outpointIndex ?? 0),
      },
      amount,
      scriptHex: script,
      blockDaaScore: BigInt(String((entry.blockDaaScore as string | number | undefined) ?? entry.block_daa_score ?? 0)),
      isCoinbase: Boolean(entry.isCoinbase ?? entry.is_coinbase ?? false),
    };
  });
}

function toEntry(u: FetchedUtxo, ScriptPublicKeyCtor: new (version: number, hex: string) => unknown) {
  return {
    address: u.address,
    outpoint: u.outpoint,
    amount: u.amount,
    scriptPublicKey: new ScriptPublicKeyCtor(0, u.scriptHex),
    blockDaaScore: u.blockDaaScore,
    isCoinbase: u.isCoinbase,
  };
}

async function resolveClaimantXOnly(
  kaspa: KaspaModule,
  address: string,
  publicKeyHex?: string | null,
): Promise<string> {
  if (publicKeyHex) {
    const body = publicKeyHex.replace(/^0x/i, '').toLowerCase();
    if (/^[0-9a-f]{64}$/.test(body)) return body;
    if (/^[0-9a-f]{66}$/.test(body)) return body.slice(2);
  }
  const XOnly = kaspa.XOnlyPublicKey as { fromAddress: (a: unknown) => unknown } | undefined;
  const AddressCtor = kaspa.Address as (new (a: string) => unknown) | undefined;
  if (!XOnly || !AddressCtor) throw new Error('Kaspa WASM missing XOnlyPublicKey.fromAddress');
  const x = XOnly.fromAddress(new AddressCtor(address));
  return String(x).replace(/^0x/i, '').toLowerCase();
}

export type IssueTicketInput = {
  burnTxHash: string;
  amountRaw: string;
  claimantAddress: string;
  claimantPublicKeyHex?: string | null;
};

export type IssueTicketResult = {
  ok: boolean;
  ticketId?: string;
  ticketTxId?: string;
  ticketIndex?: number;
  genesisTxId?: string;
  error?: string;
};

/** Issue a MigrateTicket (genesis + 2-of-3 activate) for an accepted burn. TN10 only. */
export async function issueMigrateTicket(input: IssueTicketInput): Promise<IssueTicketResult> {
  const burnTxId = String(input.burnTxHash || '').trim().toLowerCase().replace(/^0x/i, '');
  if (!/^[a-f0-9]{64}$/.test(burnTxId)) return { ok: false, error: 'burnTxHash must be 64-char hex' };
  let amountRaw: bigint;
  try {
    amountRaw = BigInt(input.amountRaw || '0');
  } catch {
    return { ok: false, error: 'amountRaw must be numeric' };
  }
  if (amountRaw <= 0n) return { ok: false, error: 'amountRaw must be > 0' };
  if (!input.claimantAddress) return { ok: false, error: 'claimantAddress required' };

  const fundPriv = fundingPrivHex();
  if (!fundPriv) return { ok: false, error: 'TKREX_WALLET3_PRIVKEY not set' };

  const roster = attestorRoster();
  const attestorKeys = ([1, 2, 3] as const).map((id) => ({
    id,
    pubkey: roster[id - 1],
    priv: attestorPrivHex(id),
  }));
  const signers = attestorKeys.filter((a) => a.priv);
  if (signers.length < ATTESTOR_THRESHOLD) {
    return {
      ok: false,
      error: `Need >=${ATTESTOR_THRESHOLD} attestor privkeys (have ${signers.length})`,
    };
  }

  const tip = await loadMigrateMintTip();
  if (!tip) return { ok: false, error: 'Migrate tip not loaded' };
  if (Number(tip.migrateVersion || 0) < 3) return { ok: false, error: 'Tip migrateVersion < 3' };
  const ticketTemplate = tip.ticketTemplate as ScriptTemplateParts | undefined;
  if (!ticketTemplate) return { ok: false, error: 'Tip missing ticketTemplate' };

  const fundingSompi = BigInt(process.env.TKREX_TICKET_FUNDING_SOMPI || '50000000');
  const priorityFeeSompi = BigInt(process.env.TKREX_PRIORITY_FEE_SOMPI || '15000000');
  const computeBudget = Number(process.env.TKREX_COMPUTE_BUDGET || '200');

  type Rpc = {
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    submitTransaction: (
      opts: Record<string, unknown>,
    ) => Promise<{ transactionId?: string; transaction_id?: string }>;
  };

  let rpc: Rpc | null = null;
  try {
    const kaspa = await loadServerKaspaWasm();
    const Address = kaspa.Address as new (a: string) => unknown;
    const PrivateKey = kaspa.PrivateKey as new (hex: string) => {
      toAddress: (network: string) => { toString: () => string };
    };
    const CovenantBinding = kaspa.CovenantBinding as new (n: number, h: unknown) => unknown;
    const Hash = kaspa.Hash as new (hex: string) => unknown;
    const RpcClient = kaspa.RpcClient as new (opts: Record<string, unknown>) => Rpc;
    const Resolver = kaspa.Resolver as new () => unknown;
    const Encoding = kaspa.Encoding as Record<string, unknown>;
    const createTransactions = kaspa.createTransactions as (opts: Record<string, unknown>) => Promise<{
      transactions: Array<{
        transaction: {
          version: number;
          inputs: Array<{ sigOpCount: number; computeBudget: number; signatureScript?: unknown }>;
          outputs: Array<{ covenant?: { covenantId?: { toString: () => string }; covenant_id?: { toString: () => string } } }>;
          populateGenesisCovenants: (groups: Array<{ authorizingInput: number; outputs: number[] }>) => void;
          finalize: () => void;
          id?: { toString: () => string };
        };
      }>;
    }>;
    const createTransaction = kaspa.createTransaction as (
      entries: unknown[],
      outputs: Array<{ address: string; amount: bigint }>,
      priorityFee: bigint,
    ) => {
      version: number;
      inputs: Array<{ sigOpCount: number; computeBudget: number; signatureScript?: unknown }>;
      outputs: Array<{ covenant?: unknown }>;
      id?: { toString: () => string };
    };
    const createInputSignature = kaspa.createInputSignature as (
      tx: unknown,
      index: number,
      key: unknown,
      entries?: unknown[],
    ) => unknown;
    const payToScriptHashScript = kaspa.payToScriptHashScript as (script: Uint8Array) => unknown;
    const addressFromScriptPublicKey = kaspa.addressFromScriptPublicKey as (
      spk: unknown,
      network: string,
    ) => { toString: () => string };
    const ScriptBuilder = kaspa.ScriptBuilder as {
      new (): {
        addI64: (n: bigint) => unknown;
        addData: (d: Uint8Array) => unknown;
        drain: () => string;
      };
      fromScript: (
        script: Uint8Array,
        opts: { flags: { covenantsEnabled: boolean } },
      ) => { encodePayToScriptHashSignatureScript: (prefix: string) => string };
    };
    const ScriptPublicKey = kaspa.ScriptPublicKey as new (version: number, hex: string) => unknown;

    const claimantXOnly = await resolveClaimantXOnly(kaspa, input.claimantAddress, input.claimantPublicKeyHex);

    const inactiveState = encodeInactiveTicketState(ATTESTOR_THRESHOLD);
    const activeState = encodeMigrateTicketState({
      threshold: ATTESTOR_THRESHOLD,
      burnTxId,
      amountRaw,
      claimantXOnly,
      active: true,
    });
    const inactiveScript = spliceTemplateScript(ticketTemplate, inactiveState);
    const activeScript = spliceTemplateScript(ticketTemplate, activeState);

    const inactiveSpk = payToScriptHashScript(Uint8Array.from(inactiveScript));
    const inactiveAddress = addressFromScriptPublicKey(inactiveSpk, NETWORK_ID).toString();
    const activeSpk = payToScriptHashScript(Uint8Array.from(activeScript));
    const activeAddress = addressFromScriptPublicKey(activeSpk, NETWORK_ID).toString();

    const fundKey = new PrivateKey(fundPriv);
    const fundAddr = fundKey.toAddress(NETWORK_ID).toString();

    rpc = process.env.TKREX_RPC_URL
      ? new RpcClient({ url: process.env.TKREX_RPC_URL, encoding: Encoding.Borsh, networkId: NETWORK_ID })
      : new RpcClient({ resolver: new Resolver(), encoding: Encoding.Borsh, networkId: NETWORK_ID });
    await rpc.connect();

    const utxos = await fetchUtxos(fundAddr, Address);
    const need = fundingSompi + priorityFeeSompi + 10_000_000n;
    const funding = utxos
      .filter((u) => u.amount >= need)
      .filter((u) => !u.scriptHex.startsWith('aa20'))
      .sort((a, b) => (a.amount < b.amount ? -1 : 1))[0];
    if (!funding) return { ok: false, error: `No funding UTXO >= ${need} sompi on ${fundAddr}` };

    const created = await createTransactions({
      version: 1,
      entries: [toEntry(funding, ScriptPublicKey)],
      outputs: [{ address: inactiveAddress, amount: fundingSompi }],
      changeAddress: fundAddr,
      priorityFee: priorityFeeSompi,
      networkId: NETWORK_ID,
    });
    if (!created.transactions?.length) return { ok: false, error: 'createTransactions returned no txs' };
    if (created.transactions.length > 1) {
      return { ok: false, error: `Generator produced ${created.transactions.length} txs; pick a smaller funding UTXO` };
    }

    const genesisTx = created.transactions[0].transaction;
    genesisTx.version = 1;
    for (const tin of genesisTx.inputs) {
      tin.sigOpCount = 0;
      tin.computeBudget = computeBudget;
    }
    genesisTx.populateGenesisCovenants([{ authorizingInput: 0, outputs: [0] }]);
    genesisTx.finalize();

    const fundSig = createInputSignature(genesisTx, 0, fundKey);
    genesisTx.inputs[0].signatureScript = fundSig;

    const g = await rpc.submitTransaction({ transaction: genesisTx, allowOrphan: false });
    const genesisTxId = String(g?.transactionId || g?.transaction_id || genesisTx.id?.toString?.() || '');
    if (!genesisTxId) return { ok: false, error: 'Genesis submit returned no txid' };

    let genesisUtxo: FetchedUtxo | undefined;
    for (let i = 0; i < 12; i++) {
      const list = await fetchUtxos(inactiveAddress, Address);
      genesisUtxo = list.find(
        (u) => u.outpoint.transactionId.toLowerCase() === genesisTxId && u.outpoint.index === 0,
      );
      if (genesisUtxo) break;
      await new Promise((r) => setTimeout(r, 2500));
    }
    if (!genesisUtxo) {
      return { ok: false, genesisTxId, error: `Genesis UTXO ${genesisTxId}:0 not found on ${inactiveAddress}` };
    }

    const covenantId =
      genesisTx.outputs?.[0]?.covenant?.covenantId?.toString?.() ||
      genesisTx.outputs?.[0]?.covenant?.covenant_id?.toString?.() ||
      '';
    if (!covenantId) return { ok: false, genesisTxId, error: 'Missing genesis covenant id' };

    const ticketAmount = genesisUtxo.amount;
    const ticketEntry = {
      address: new Address(inactiveAddress),
      outpoint: { transactionId: genesisTxId, index: 0 },
      amount: ticketAmount,
      scriptPublicKey: inactiveSpk,
      blockDaaScore: genesisUtxo.blockDaaScore,
      isCoinbase: false,
      covenantId: String(covenantId),
    };

    const keep = ticketAmount - priorityFeeSompi;
    if (keep <= 0n) return { ok: false, genesisTxId, error: 'Ticket UTXO too small for issue fee' };

    const issueTx = createTransaction([ticketEntry], [{ address: activeAddress, amount: keep }], priorityFeeSompi);
    issueTx.version = 1;
    for (const tin of issueTx.inputs) {
      tin.sigOpCount = 0;
      tin.computeBudget = computeBudget;
    }
    issueTx.outputs[0].covenant = new CovenantBinding(0, new Hash(ticketEntry.covenantId));

    const s1 = signers[0];
    const s2 = signers[1];
    const s3 =
      signers.find((s) => s.pubkey !== s1.pubkey && s.pubkey !== s2.pubkey) ||
      attestorKeys.find((a) => a.pubkey !== s1.pubkey && a.pubkey !== s2.pubkey);
    if (!s3) return { ok: false, genesisTxId, error: 'Could not pick distinct third signer pubkey' };

    const key1 = new PrivateKey(s1.priv);
    const key2 = new PrivateKey(s2.priv);
    const raw1 = createInputSignature(issueTx, 0, key1, [ticketEntry]);
    const raw2 = createInputSignature(issueTx, 0, key2, [ticketEntry]);
    const sig1 = normalizeSchnorrSignature(raw1);
    const sig2 = normalizeSchnorrSignature(raw2);
    const dummySig = new Uint8Array(65);
    dummySig[64] = 0x01;

    const prefix = new ScriptBuilder();
    prefix.addI64(BigInt(ATTESTOR_THRESHOLD));
    prefix.addData(hexToBytes(burnTxId));
    prefix.addI64(amountRaw);
    prefix.addData(hexToBytes(claimantXOnly));
    prefix.addI64(1n);
    prefix.addData(hexToBytes(s1.pubkey));
    prefix.addData(sig1);
    prefix.addData(hexToBytes(s2.pubkey));
    prefix.addData(sig2);
    prefix.addData(hexToBytes(s3.pubkey));
    prefix.addData(
      s3.priv ? normalizeSchnorrSignature(createInputSignature(issueTx, 0, new PrivateKey(s3.priv), [ticketEntry])) : dummySig,
    );
    prefix.addI64(ISSUE_SELECTOR);
    const prefixHex = prefix.drain();

    const unlockHex = ScriptBuilder.fromScript(Uint8Array.from(inactiveScript), {
      flags: { covenantsEnabled: true },
    }).encodePayToScriptHashSignatureScript(prefixHex);
    issueTx.inputs[0].signatureScript = unlockHex;

    const issued = await rpc.submitTransaction({ transaction: issueTx, allowOrphan: false });
    const issueTxId = String(issued?.transactionId || issued?.transaction_id || issueTx.id?.toString?.() || '');
    if (!issueTxId) return { ok: false, genesisTxId, error: 'Issue submit returned no txid' };

    return {
      ok: true,
      ticketId: `${issueTxId}:0`,
      ticketTxId: issueTxId,
      ticketIndex: 0,
      genesisTxId,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'issueTicket failed' };
  } finally {
    if (rpc) {
      try {
        await rpc.disconnect();
      } catch {
        /* ignore */
      }
    }
  }
}
