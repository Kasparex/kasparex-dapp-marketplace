import { getFullTransactionsForAddress, type KaspaRestTransaction } from '@/lib/kaspa/api';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { KPX_CM_RT_CODES_V1 } from '@/lib/kpx/constants';
import { parseKpxJson } from '@/lib/kpx/decode';
import { normalizeKpxNet, normalizeRid } from '@/lib/kpx/normalize';
import { resolveHighestSeq, type KpxRecordWithMeta } from '@/lib/kpx/resolve';
import type {
  KpxCmRecordV1,
  KpxLnkRecordV1,
  KpxPfRecordV1,
  KpxRecordV1,
  KpxVerRecordV1,
} from '@/lib/kpx/types';

export type KpxIndexerNet = 'mainnet' | 'testnet';

export function defaultKpxIndexerNet(): KpxIndexerNet {
  const n = normalizeKpxNet(process.env.KPX_INDEX_NET || 'mainnet');
  if (n === 'testnet') return 'testnet';
  return 'mainnet';
}

export function parseKpxIndexerNetParam(raw: string | null | undefined, fallback: KpxIndexerNet): KpxIndexerNet | null {
  const n = normalizeKpxNet(String(raw ?? '').trim() || fallback);
  if (n === 'testnet') return 'testnet';
  if (n === 'mainnet') return 'mainnet';
  return null;
}

export function defaultKpxIndexTxLimit(): number {
  const raw = Number(process.env.KPX_INDEX_TX_LIMIT ?? 250);
  if (!Number.isFinite(raw)) return 250;
  return Math.min(500, Math.max(20, Math.trunc(raw)));
}

/** REST `offset` into `/addresses/.../full-transactions` (kaspa-rest-server). */
export type KpxIndexedWindow = {
  txLookback: number;
  matches: number;
  truncated: boolean;
  offset: number;
};

export function parseKpxIndexOffsetParam(raw: string | null | undefined): number {
  const n = Number(String(raw ?? '').trim());
  if (!Number.isFinite(n)) return 0;
  return Math.min(50_000, Math.max(0, Math.trunc(n)));
}

function indexWindow(txFetched: number, matches: number, truncated: boolean, offset: number): KpxIndexedWindow {
  return { txLookback: txFetched, matches, truncated, offset };
}

export function parseKpxCmCatalogMaxResources(raw: string | null | undefined): number {
  const n = Number(String(raw ?? '').trim());
  if (!Number.isFinite(n)) return 100;
  return Math.min(500, Math.max(1, Math.trunc(n)));
}

function txId(tx: KaspaRestTransaction): string {
  return String(tx.transaction_id ?? tx.transactionId ?? '')
    .replace(/^0x/i, '')
    .toLowerCase();
}

function firstInputPayer(tx: KaspaRestTransaction): string | null {
  const first = (tx.inputs ?? [])[0];
  if (!first) return null;
  const a = first.previous_outpoint_address ?? first.previousOutpointAddress;
  if (!a) return null;
  try {
    return normalizeKaspaAddress(a).toLowerCase();
  } catch {
    return null;
  }
}

function blockBlueScore(tx: KaspaRestTransaction): number | undefined {
  const o = tx as Record<string, unknown>;
  for (const k of ['accepting_block_blue_score', 'acceptingBlockBlueScore', 'block_blue_score', 'blockBlueScore']) {
    const v = o[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
  }
  return undefined;
}

/** Kaspa REST often returns `payload` as hex bytes; KasWare may double-encode. */
function peelHexPayloadLayers(raw: string): string {
  let s = raw.replace(/^0x/i, '').trim();
  for (let i = 0; i < 4; i++) {
    if (!/^[0-9a-fA-F]+$/.test(s) || s.length < 4 || s.length % 2 !== 0) break;
    try {
      const next = Buffer.from(s, 'hex').toString('utf8').trim();
      if (!next || next === s) break;
      s = next;
    } catch {
      break;
    }
  }
  return s;
}

function extractBalancedJsonObject(s: string): string | null {
  const start = s.indexOf('{');
  if (start < 0) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i]!;
    if (inStr) {
      if (esc) {
        esc = false;
        continue;
      }
      if (c === '\\') {
        esc = true;
        continue;
      }
      if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') {
      inStr = true;
      continue;
    }
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}

function tryParseKpxFromUtf8(text: string): KpxRecordV1 | null {
  const trimmed = text.trim();
  const candidates = [trimmed];
  const embedded = extractBalancedJsonObject(trimmed);
  if (embedded && embedded !== trimmed) candidates.push(embedded);
  for (const c of candidates) {
    try {
      return parseKpxJson(c).record;
    } catch {
      // continue
    }
  }
  return null;
}

function parseKpxRecordFromRestPayload(payload: string | null | undefined): KpxRecordV1 | null {
  if (!payload || typeof payload !== 'string') return null;
  const trimmed = payload.trim();
  const looksHex = /^[0-9a-fA-F]+$/.test(trimmed) && trimmed.length % 2 === 0;
  const text = looksHex ? peelHexPayloadLayers(trimmed.replace(/^0x/i, '')) : trimmed;
  return tryParseKpxFromUtf8(text);
}

async function collectValidRecords<T extends KpxRecordV1>(
  ownerAddress: string,
  args: { net: KpxIndexerNet; type: 'pf' | 'ver' | 'cm' | 'lnk'; txLimit: number; offset?: number }
): Promise<{ records: Array<KpxRecordWithMeta<T>>; txFetched: number; truncated: boolean; offset: number }> {
  const fetchAddr = normalizeKaspaAddress(ownerAddress);
  const owner = fetchAddr.toLowerCase();
  const net = args.net;
  const offset = Math.max(0, Math.min(50_000, Math.trunc(args.offset ?? 0)));
  const txs = await getFullTransactionsForAddress(fetchAddr, args.txLimit, { offset });
  const records: Array<KpxRecordWithMeta<T>> = [];
  for (const tx of txs) {
    const payer = firstInputPayer(tx);
    if (!payer) continue;
    const rec = parseKpxRecordFromRestPayload(tx.payload ?? null);
    if (!rec || rec.t !== args.type) continue;
    if (normalizeKpxNet(rec.net) !== net) continue;
    if (rec.addr !== owner) continue;
    if (payer !== rec.addr) continue;
    const id = txId(tx);
    if (!/^[0-9a-f]{64}$/.test(id)) continue;
    records.push({
      record: rec as T,
      txHash: id,
      blockHeight: blockBlueScore(tx),
    });
  }
  return { records, txFetched: txs.length, truncated: txs.length >= args.txLimit, offset };
}

export type KpxOnChainProvenance = {
  txHash: string;
  seq: number;
  op: string;
  blockBlueScore?: number;
};

export type KpxPfIndexResult = {
  net: KpxIndexerNet;
  state: { display?: string; bio?: string; tags?: string[] } | null;
  provenance: (KpxOnChainProvenance & { t: 'pf' }) | null;
  indexed: KpxIndexedWindow;
};

export type KpxVerIndexResult = {
  net: KpxIndexerNet;
  verified: boolean;
  provenance: (KpxOnChainProvenance & { t: 'ver' }) | null;
  indexed: KpxIndexedWindow;
};

export type KpxLnkIndexResult = {
  net: KpxIndexerNet;
  evm: string | null;
  provenance: (KpxOnChainProvenance & { t: 'lnk' }) | null;
  indexed: KpxIndexedWindow;
};

export type KpxCmIndexResult = {
  net: KpxIndexerNet;
  rt: string;
  rid: string;
  commit: { op: 'create' | 'edit'; ch: string; sv: number } | null;
  provenance: (KpxOnChainProvenance & { t: 'cm' }) | null;
  indexed: KpxIndexedWindow;
};

export type KpxCmCatalogEntry = {
  rt: string;
  rid: string;
  commit: { op: 'create' | 'edit'; ch: string; sv: number };
  provenance: KpxOnChainProvenance & { t: 'cm' };
};

export type KpxCmCatalogResult = {
  net: KpxIndexerNet;
  resources: KpxCmCatalogEntry[];
  indexed: KpxIndexedWindow & {
    distinctResources: number;
    maxResources: number;
    responseCapped: boolean;
  };
};

/** Validates `data.rt` for kpx/cm v1 registry. */
export function parseKpxCmRtParam(rt: string | null | undefined): string | null {
  const t = String(rt ?? '').trim().toLowerCase();
  if (!t) return null;
  return (KPX_CM_RT_CODES_V1 as readonly string[]).includes(t) ? t : null;
}

export async function indexKpxPfForAddress(
  ownerAddress: string,
  opts?: { net?: KpxIndexerNet; txLimit?: number; offset?: number }
): Promise<KpxPfIndexResult> {
  const net = opts?.net ?? defaultKpxIndexerNet();
  const txLimit = Math.min(500, Math.max(20, opts?.txLimit ?? defaultKpxIndexTxLimit()));
  const offset = Math.max(0, Math.min(50_000, Math.trunc(opts?.offset ?? 0)));
  const { records, txFetched, truncated, offset: offApplied } = await collectValidRecords<KpxPfRecordV1>(
    ownerAddress,
    {
      net,
      type: 'pf',
      txLimit,
      offset,
    }
  );
  const best = resolveHighestSeq(records);
  if (!best) {
    return {
      net,
      state: null,
      provenance: null,
      indexed: indexWindow(txFetched, records.length, truncated, offApplied),
    };
  }
  const op = best.record.op;
  const prov: KpxOnChainProvenance & { t: 'pf' } = {
    t: 'pf',
    txHash: best.txHash,
    seq: best.record.seq,
    op,
    blockBlueScore: best.blockHeight,
  };
  if (op === 'clear') {
    return {
      net,
      state: null,
      provenance: prov,
      indexed: indexWindow(txFetched, records.length, truncated, offApplied),
    };
  }
  const data = best.record.data;
  const state =
    data && typeof data === 'object'
      ? {
          ...(typeof data.display === 'string' ? { display: data.display } : {}),
          ...(typeof data.bio === 'string' ? { bio: data.bio } : {}),
          ...(Array.isArray(data.tags) ? { tags: data.tags } : {}),
        }
      : {};
  return {
    net,
    state: Object.keys(state).length ? state : {},
    provenance: prov,
    indexed: indexWindow(txFetched, records.length, truncated, offApplied),
  };
}

export async function indexKpxVerForAddress(
  ownerAddress: string,
  opts?: { net?: KpxIndexerNet; txLimit?: number; offset?: number }
): Promise<KpxVerIndexResult> {
  const net = opts?.net ?? defaultKpxIndexerNet();
  const txLimit = Math.min(500, Math.max(20, opts?.txLimit ?? defaultKpxIndexTxLimit()));
  const offset = Math.max(0, Math.min(50_000, Math.trunc(opts?.offset ?? 0)));
  const { records, txFetched, truncated, offset: offApplied } = await collectValidRecords<KpxVerRecordV1>(
    ownerAddress,
    {
      net,
      type: 'ver',
      txLimit,
      offset,
    }
  );
  const best = resolveHighestSeq(records);
  if (!best) {
    return {
      net,
      verified: false,
      provenance: null,
      indexed: indexWindow(txFetched, records.length, truncated, offApplied),
    };
  }
  const verified = best.record.op === 'set';
  return {
    net,
    verified,
    provenance: {
      t: 'ver',
      txHash: best.txHash,
      seq: best.record.seq,
      op: best.record.op,
      blockBlueScore: best.blockHeight,
    },
    indexed: indexWindow(txFetched, records.length, truncated, offApplied),
  };
}

export async function indexKpxLnkForAddress(
  ownerAddress: string,
  opts?: { net?: KpxIndexerNet; txLimit?: number; offset?: number }
): Promise<KpxLnkIndexResult> {
  const net = opts?.net ?? defaultKpxIndexerNet();
  const txLimit = Math.min(500, Math.max(20, opts?.txLimit ?? defaultKpxIndexTxLimit()));
  const offset = Math.max(0, Math.min(50_000, Math.trunc(opts?.offset ?? 0)));
  const { records, txFetched, truncated, offset: offApplied } = await collectValidRecords<KpxLnkRecordV1>(
    ownerAddress,
    {
      net,
      type: 'lnk',
      txLimit,
      offset,
    }
  );
  const best = resolveHighestSeq(records);
  if (!best) {
    return {
      net,
      evm: null,
      provenance: null,
      indexed: indexWindow(txFetched, records.length, truncated, offApplied),
    };
  }
  const evmData = best.record.data;
  const linked =
    best.record.op === 'set' && evmData && typeof evmData === 'object' && typeof evmData.evm === 'string';
  return {
    net,
    evm: linked ? evmData.evm : null,
    provenance: {
      t: 'lnk',
      txHash: best.txHash,
      seq: best.record.seq,
      op: best.record.op,
      blockBlueScore: best.blockHeight,
    },
    indexed: indexWindow(txFetched, records.length, truncated, offApplied),
  };
}

/** `rt` / `rid` must be pre-validated (registry rt + normalized rid). */
export async function indexKpxCmForResource(
  ownerAddress: string,
  opts: { net?: KpxIndexerNet; txLimit?: number; offset?: number; rt: string; rid: string }
): Promise<KpxCmIndexResult> {
  const net = opts.net ?? defaultKpxIndexerNet();
  const txLimit = Math.min(500, Math.max(20, opts.txLimit ?? defaultKpxIndexTxLimit()));
  const offset = Math.max(0, Math.min(50_000, Math.trunc(opts.offset ?? 0)));
  const { rt, rid } = opts;
  const { records: allCm, txFetched, truncated, offset: offApplied } = await collectValidRecords<KpxCmRecordV1>(
    ownerAddress,
    {
      net,
      type: 'cm',
      txLimit,
      offset,
    }
  );
  const records = allCm.filter((m) => m.record.data.rt === rt && m.record.data.rid === rid);
  const best = resolveHighestSeq(records);
  if (!best) {
    return {
      net,
      rt,
      rid,
      commit: null,
      provenance: null,
      indexed: indexWindow(txFetched, records.length, truncated, offApplied),
    };
  }
  const d = best.record.data;
  return {
    net,
    rt,
    rid,
    commit: { op: best.record.op, ch: d.ch, sv: d.sv },
    provenance: {
      t: 'cm',
      txHash: best.txHash,
      seq: best.record.seq,
      op: best.record.op,
      blockBlueScore: best.blockHeight,
    },
    indexed: indexWindow(txFetched, records.length, truncated, offApplied),
  };
}

/** One winning `kpx/cm` row per distinct `(rt, rid)` in the scanned tx window. */
export async function indexKpxCmCatalogForAddress(
  ownerAddress: string,
  opts?: { net?: KpxIndexerNet; txLimit?: number; offset?: number; maxResources?: number }
): Promise<KpxCmCatalogResult> {
  const net = opts?.net ?? defaultKpxIndexerNet();
  const txLimit = Math.min(500, Math.max(20, opts?.txLimit ?? defaultKpxIndexTxLimit()));
  const offset = Math.max(0, Math.min(50_000, Math.trunc(opts?.offset ?? 0)));
  const maxResources = Math.min(500, Math.max(1, Math.trunc(opts?.maxResources ?? 100)));

  const { records, txFetched, truncated, offset: offApplied } = await collectValidRecords<KpxCmRecordV1>(
    ownerAddress,
    {
      net,
      type: 'cm',
      txLimit,
      offset,
    }
  );

  const byKey = new Map<string, KpxRecordWithMeta<KpxCmRecordV1>[]>();
  for (const m of records) {
    const k = `${m.record.data.rt}\0${m.record.data.rid}`;
    let g = byKey.get(k);
    if (!g) {
      g = [];
      byKey.set(k, g);
    }
    g.push(m);
  }

  const resolved: KpxCmCatalogEntry[] = [];
  for (const [, group] of byKey) {
    const best = resolveHighestSeq(group);
    if (!best) continue;
    const d = best.record.data;
    resolved.push({
      rt: d.rt,
      rid: d.rid,
      commit: { op: best.record.op, ch: d.ch, sv: d.sv },
      provenance: {
        t: 'cm',
        txHash: best.txHash,
        seq: best.record.seq,
        op: best.record.op,
        blockBlueScore: best.blockHeight,
      },
    });
  }

  resolved.sort((a, b) => {
    if (b.provenance.seq !== a.provenance.seq) return b.provenance.seq - a.provenance.seq;
    const ab = a.provenance.blockBlueScore ?? 0;
    const bb = b.provenance.blockBlueScore ?? 0;
    if (bb !== ab) return bb - ab;
    return String(b.provenance.txHash).localeCompare(String(a.provenance.txHash));
  });

  const distinctResources = resolved.length;
  const resources = resolved.slice(0, maxResources);
  const responseCapped = distinctResources > maxResources;

  return {
    net,
    resources,
    indexed: {
      ...indexWindow(txFetched, records.length, truncated, offApplied),
      distinctResources,
      maxResources,
      responseCapped,
    },
  };
}
