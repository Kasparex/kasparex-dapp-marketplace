import { KPX_PROTOCOL, KPX_VERSION } from './constants';
import type { KpxNet, KpxOpCm, KpxOpLnk, KpxOpPf, KpxOpVer, KpxPfDataV1, KpxResourceTypeCodeV1 } from './types';
import { normalizeBio, normalizeDisplayName, normalizeEvmAddress, normalizeKpxAddr, normalizeKpxNet, normalizeRid, normalizeTag } from './normalize';

function stableStringify(value: unknown): string {
  // Deterministic-enough for our app: stable key ordering for plain objects.
  // Indexers must not require canonical key order (see spec), but this helps us build reproducible hashes.
  const seen = new WeakSet<object>();
  const recur = (v: any): any => {
    if (v === null || v === undefined) return v;
    if (typeof v !== 'object') return v;
    if (Array.isArray(v)) return v.map(recur);
    if (seen.has(v)) throw new Error('Cannot stringify circular structure');
    seen.add(v);
    const out: Record<string, any> = {};
    for (const k of Object.keys(v).sort()) out[k] = recur(v[k]);
    return out;
  };
  return JSON.stringify(recur(value));
}

export function encodeKpxJson(record: unknown): { json: string; bytes: number } {
  const json = stableStringify(record);
  const bytes = new TextEncoder().encode(json).byteLength;
  return { json, bytes };
}

export function buildKpxPfV1(args: {
  net: KpxNet | string;
  op: KpxOpPf;
  addr: string;
  seq: number;
  data?: KpxPfDataV1;
}) {
  const net = normalizeKpxNet(args.net);
  const addr = normalizeKpxAddr(args.addr);
  const data = args.op === 'clear' ? undefined : normalizePfData(args.data ?? {});
  return {
    p: KPX_PROTOCOL,
    t: 'pf',
    v: KPX_VERSION,
    net,
    op: args.op,
    addr,
    seq: args.seq,
    ...(data ? { data } : {}),
  } as const;
}

function normalizePfData(d: KpxPfDataV1): KpxPfDataV1 {
  const display = d.display ? normalizeDisplayName(d.display) : undefined;
  const bio = d.bio ? normalizeBio(d.bio) : undefined;
  const tags = Array.isArray(d.tags)
    ? Array.from(new Set(d.tags.map(normalizeTag).filter(Boolean))).slice(0, 10)
    : undefined;
  const out: KpxPfDataV1 = {};
  if (display) out.display = display;
  if (bio) out.bio = bio;
  if (tags && tags.length) out.tags = tags;
  return out;
}

export function buildKpxCmV1(args: {
  net: KpxNet | string;
  op: KpxOpCm;
  addr: string;
  seq: number;
  rt: KpxResourceTypeCodeV1;
  rid: string;
  ch: string;
  sv: number;
}) {
  const net = normalizeKpxNet(args.net);
  const addr = normalizeKpxAddr(args.addr);
  return {
    p: KPX_PROTOCOL,
    t: 'cm',
    v: KPX_VERSION,
    net,
    op: args.op,
    addr,
    seq: args.seq,
    data: {
      rt: args.rt,
      rid: normalizeRid(args.rid),
      ch: String(args.ch || '').trim().toLowerCase(),
      sv: args.sv,
    },
  } as const;
}

export function buildKpxLnkV1(args: {
  net: KpxNet | string;
  op: KpxOpLnk;
  addr: string;
  seq: number;
  evm?: string;
}) {
  const net = normalizeKpxNet(args.net);
  const addr = normalizeKpxAddr(args.addr);
  return {
    p: KPX_PROTOCOL,
    t: 'lnk',
    v: KPX_VERSION,
    net,
    op: args.op,
    addr,
    seq: args.seq,
    ...(args.op === 'set' && args.evm ? { data: { evm: normalizeEvmAddress(args.evm) } } : {}),
  } as const;
}

export function buildKpxVerV1(args: { net: KpxNet | string; op: KpxOpVer; addr: string; seq: number }) {
  const net = normalizeKpxNet(args.net);
  const addr = normalizeKpxAddr(args.addr);
  return { p: KPX_PROTOCOL, t: 'ver', v: KPX_VERSION, net, op: args.op, addr, seq: args.seq } as const;
}

