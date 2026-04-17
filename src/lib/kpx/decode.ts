import { KPX_CM_RT_CODES_V1, KPX_MAX_BYTES, KPX_PROTOCOL, KPX_SEQ_MAX, KPX_SEQ_MIN, KPX_VERSION } from './constants';
import type { KpxParsedRecord, KpxRecordV1 } from './types';
import { normalizeEvmAddress, normalizeKpxAddr, normalizeKpxNet, normalizeRid, normalizeTag } from './normalize';

function isObject(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === 'object' && !Array.isArray(v);
}

function toInt(n: unknown): number | null {
  const x = typeof n === 'number' ? n : typeof n === 'string' ? Number(n) : NaN;
  if (!Number.isFinite(x)) return null;
  const i = Math.trunc(x);
  return i === x ? i : null;
}

export function parseKpxJson(rawJson: string): KpxParsedRecord {
  const json = String(rawJson || '').trim();
  const bytes = new TextEncoder().encode(json).byteLength;
  const raw = JSON.parse(json) as unknown;
  if (!isObject(raw)) throw new Error('Invalid kpx record: expected object');

  const p = raw.p;
  const t = raw.t;
  const v = raw.v;
  const net = raw.net;
  const op = raw.op;
  const addr = raw.addr;
  const seq = raw.seq;

  if (p !== KPX_PROTOCOL) throw new Error('Invalid kpx record: p');
  if (v !== KPX_VERSION) throw new Error('Invalid kpx record: v');
  if (typeof t !== 'string' || !t) throw new Error('Invalid kpx record: t');
  if (typeof net !== 'string' || !net) throw new Error('Invalid kpx record: net');
  if (typeof op !== 'string' || !op) throw new Error('Invalid kpx record: op');
  if (typeof addr !== 'string' || !addr) throw new Error('Invalid kpx record: addr');
  const seqInt = toInt(seq);
  if (!seqInt || seqInt < KPX_SEQ_MIN || seqInt > KPX_SEQ_MAX) throw new Error('Invalid kpx record: seq');

  // Type byte limits
  const limit = (KPX_MAX_BYTES as any)[t] as number | undefined;
  if (typeof limit === 'number' && bytes > limit) throw new Error('Invalid kpx record: payload too large');

  const record: any = {
    p: KPX_PROTOCOL,
    t,
    v: KPX_VERSION,
    net: normalizeKpxNet(net),
    op,
    addr: normalizeKpxAddr(addr),
    seq: seqInt,
  };

  if ('data' in raw) record.data = (raw as any).data;

  // Light type-specific normalization/validation for v1
  if (record.t === 'pf') {
    if (record.op !== 'set' && record.op !== 'clear') throw new Error('Invalid kpx/pf op');
    if (record.op === 'clear') {
      delete record.data;
    } else if (record.data !== undefined) {
      if (!isObject(record.data)) throw new Error('Invalid kpx/pf data');
      if (typeof record.data.display === 'string') record.data.display = String(record.data.display).trim().slice(0, 24);
      if (typeof record.data.bio === 'string') record.data.bio = String(record.data.bio).trim().slice(0, 160);
      if (Array.isArray(record.data.tags)) {
        const tags = Array.from(new Set(record.data.tags.map(normalizeTag).filter(Boolean))).slice(0, 10);
        record.data.tags = tags;
      }
    }
  }

  if (record.t === 'cm') {
    if (record.op !== 'create' && record.op !== 'edit') throw new Error('Invalid kpx/cm op');
    if (!isObject(record.data)) throw new Error('Invalid kpx/cm data');
    const rt = String((record.data as any).rt || '').toLowerCase();
    if (!KPX_CM_RT_CODES_V1.includes(rt as any)) throw new Error('Invalid kpx/cm rt');
    const rid = normalizeRid((record.data as any).rid);
    const ch = String((record.data as any).ch || '').trim().toLowerCase();
    const sv = toInt((record.data as any).sv);
    if (!rid) throw new Error('Invalid kpx/cm rid');
    if (!/^[0-9a-f]{64}$/.test(ch)) throw new Error('Invalid kpx/cm ch');
    if (!sv || sv < 1) throw new Error('Invalid kpx/cm sv');
    record.data = { rt, rid, ch, sv };
  }

  if (record.t === 'lnk') {
    if (record.op !== 'set' && record.op !== 'clear') throw new Error('Invalid kpx/lnk op');
    if (record.op === 'clear') {
      delete record.data;
    } else {
      if (!isObject(record.data)) throw new Error('Invalid kpx/lnk data');
      const evm = normalizeEvmAddress(String((record.data as any).evm || ''));
      if (!/^0x[0-9a-f]{40}$/.test(evm)) throw new Error('Invalid kpx/lnk evm');
      record.data = { evm };
    }
  }

  if (record.t === 'ver') {
    if (record.op !== 'set' && record.op !== 'clear') throw new Error('Invalid kpx/ver op');
    delete record.data;
  }

  return { record: record as KpxRecordV1, raw, rawJson: json, byteLength: bytes };
}

