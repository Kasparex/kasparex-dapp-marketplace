import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { CHRONICLES_LB_PAYLOAD_PREFIX, type ChroniclesLbEntityType } from './constants';
import type { ChroniclesLbEvent } from './types';

/** Kaspa REST returns `payload` as hex of on-chain bytes. KasWare can double-encode; peel 1-3 hex layers. */
function peelHexPayloadLayers(raw: string): string {
  let s = raw.replace(/^0x/i, '').trim();
  for (let i = 0; i < 4; i++) {
    if (!/^[0-9a-fA-F]+$/.test(s) || s.length < 4 || s.length % 2 !== 0) break;
    try {
      const next = Buffer.from(s, 'hex').toString('utf8').trim();
      if (!next) break;
      s = next;
    } catch {
      break;
    }
  }
  return s;
}

function normAddr(a: string): string {
  try {
    return normalizeKaspaAddress(a);
  } catch {
    return a.trim();
  }
}

function parseEntityType(s: string): ChroniclesLbEntityType | null {
  if (s === 'chapter' || s === 'character' || s === 'location' || s === 'vehicle') return s;
  return null;
}

function splitBodyAndPayer(textAfterPrefix: string): { body: string; payer: string } | null {
  const i = textAfterPrefix.lastIndexOf('kaspa:');
  if (i < 0) return null;
  const payer = textAfterPrefix.slice(i).trim();
  const body = textAfterPrefix.slice(0, i).trim();
  if (!payer.startsWith('kaspa:')) return null;
  return { body: body.replace(/:$/, ''), payer };
}

export function parseChroniclesLbPayload(payload: string | null | undefined): ChroniclesLbEvent | null {
  if (!payload || typeof payload !== 'string') return null;
  const trimmed = payload.trim();
  const text =
    /^[0-9a-fA-F]+$/.test(trimmed) && trimmed.length % 2 === 0 ? peelHexPayloadLayers(trimmed) : trimmed;
  if (!text.startsWith(CHRONICLES_LB_PAYLOAD_PREFIX)) return null;
  const rest = text.slice(CHRONICLES_LB_PAYLOAD_PREFIX.length);
  const split = splitBodyAndPayer(rest);
  if (!split) return null;
  const payerKaspa = split.payer;
  const parts = split.body.split(':').filter(Boolean);
  if (parts.length < 2) return null;

  if (parts[0] === 'read') {
    // read:<entityType>:<entityId>
    if (parts.length < 3) return null;
    const entityType = parseEntityType(parts[1]!);
    if (!entityType) return null;
    const entityId = parts.slice(2).join(':').trim();
    if (!entityId) return null;
    return { kind: 'read', entityType, entityId, payerKaspa: normAddr(payerKaspa) };
  }

  if (parts[0] !== 'slot') return null;
  const op = parts[1]!;
  if (op === 'activate') {
    // slot:activate:<entityType>:<entityId>:<slotIndex>
    if (parts.length < 5) return null;
    const entityType = parseEntityType(parts[2]!);
    if (!entityType) return null;
    const slotIndex = Number(parts[parts.length - 1]);
    if (slotIndex !== 2 && slotIndex !== 3) return null;
    const entityId = parts.slice(3, parts.length - 1).join(':').trim();
    if (!entityId) return null;
    return { kind: 'slot:activate', entityType, entityId, slotIndex, payerKaspa: normAddr(payerKaspa) };
  }
  if (op === 'set') {
    // slot:set:<entityType>:<entityId>:<slotIndex>:<nftRef>
    if (parts.length < 6) return null;
    const entityType = parseEntityType(parts[2]!);
    if (!entityType) return null;
    const slotIndex = Number(parts[parts.length - 2]);
    if (![1, 2, 3].includes(slotIndex)) return null;
    const nftRef = parts[parts.length - 1]!.trim();
    if (!nftRef) return null;
    const entityId = parts.slice(3, parts.length - 2).join(':').trim();
    if (!entityId) return null;
    return { kind: 'slot:set', entityType, entityId, slotIndex: slotIndex as 1 | 2 | 3, nftRef, payerKaspa: normAddr(payerKaspa) };
  }
  if (op === 'clear') {
    // slot:clear:<entityType>:<entityId>:<slotIndex>
    if (parts.length < 5) return null;
    const entityType = parseEntityType(parts[2]!);
    if (!entityType) return null;
    const slotIndex = Number(parts[parts.length - 1]);
    if (![1, 2, 3].includes(slotIndex)) return null;
    const entityId = parts.slice(3, parts.length - 1).join(':').trim();
    if (!entityId) return null;
    return { kind: 'slot:clear', entityType, entityId, slotIndex: slotIndex as 1 | 2 | 3, payerKaspa: normAddr(payerKaspa) };
  }

  return null;
}

