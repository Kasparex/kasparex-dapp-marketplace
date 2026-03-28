import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import {
  getFullTransactionsForAddress,
  getRestTransactionById,
  type KaspaRestTransaction,
  type KaspaRestTxOutput,
} from '@/lib/kaspa/api';
import { getAdsTreasuryL1Address } from '@/lib/ads/config';
import { AD_PAYLOAD_PREFIX, ADS_TREASURY_TX_LIMIT } from '@/lib/ads/constants';
import {
  parseAdMetadataJson,
  resolveAdImageUrl,
  type AdCampaignMetadataV1,
} from '@/lib/ads/metadata';
import { priceKasForDays, getSlotConfig } from '@/lib/ads/slots';
import { isValidAdPayment } from '@/lib/ads/adPriceValidation';
import type { AdEntry } from '@/lib/ads/types';

function extractCidFromPayload(payload: string | null | undefined): string | null {
  if (!payload || typeof payload !== 'string') return null;
  let text = '';
  try {
    const hex = payload.trim();
    if (/^[0-9a-fA-F]+$/.test(hex) && hex.length % 2 === 0 && hex.length >= 4) {
      text = Buffer.from(hex, 'hex').toString('utf8');
    } else {
      text = payload;
    }
  } catch {
    return null;
  }
  const trimmed = text.trim();
  if (trimmed.startsWith(AD_PAYLOAD_PREFIX)) {
    return trimmed.slice(AD_PAYLOAD_PREFIX.length).trim();
  }
  if (/^(bafy[a-z0-9]{50,}|Qm[1-9A-HJ-NP-Za-km-z]{40,})$/i.test(trimmed)) {
    return trimmed;
  }
  return null;
}

function normAddr(a: string): string {
  try {
    return normalizeKaspaAddress(a);
  } catch {
    return a;
  }
}

function outputAddress(o: KaspaRestTxOutput): string | undefined {
  const x = o as Record<string, unknown>;
  return (
    o.script_public_key_address ??
    o.scriptPublicKeyAddress ??
    o.address ??
    (typeof x.script_public_key === 'object' &&
    x.script_public_key &&
    typeof (x.script_public_key as { address?: string }).address === 'string'
      ? (x.script_public_key as { address: string }).address
      : undefined)
  );
}

function getTxPayload(tx: KaspaRestTransaction): string | null | undefined {
  const p = tx.payload;
  if (typeof p === 'string' && p.length > 0) return p;
  const t = tx as Record<string, unknown>;
  const vd = t.verboseData ?? t.verbose_data;
  if (vd && typeof vd === 'object' && typeof (vd as { payload?: string }).payload === 'string') {
    const vp = (vd as { payload: string }).payload;
    if (vp.length > 0) return vp;
  }
  return undefined;
}

function sumOutputsToTreasury(tx: KaspaRestTransaction, treasuryNorm: string): number {
  let sum = 0;
  const outs = tx.outputs ?? [];
  for (const o of outs) {
    const addr = outputAddress(o);
    if (!addr) continue;
    try {
      if (normAddr(addr) !== treasuryNorm) continue;
    } catch {
      continue;
    }
    const amt = typeof o.amount === 'string' ? parseInt(o.amount, 10) : Number(o.amount ?? 0);
    if (!Number.isNaN(amt) && amt > 0) sum += amt;
  }
  return sum;
}

function payerAddressesFromTx(tx: KaspaRestTransaction): Set<string> {
  const set = new Set<string>();
  for (const inp of tx.inputs ?? []) {
    const i = inp as Record<string, unknown>;
    const vd = i.verboseData ?? i.verbose_data;
    const fromVerbose =
      vd && typeof vd === 'object' && typeof (vd as { address?: string }).address === 'string'
        ? (vd as { address: string }).address
        : undefined;
    const a =
      inp.previous_outpoint_address ?? inp.previousOutpointAddress ?? fromVerbose;
    if (a && typeof a === 'string' && a.startsWith('kaspa:')) {
      try {
        set.add(normAddr(a));
      } catch {
        set.add(a);
      }
    }
  }
  return set;
}

async function fetchMetadataJson(cid: string): Promise<unknown | null> {
  const clean = cid.replace(/^ipfs:\/\//, '').replace(/^\/?ipfs\//, '');
  const gateways = [
    `https://dweb.link/ipfs/${clean}`,
    `https://w3s.link/ipfs/${clean}`,
    `https://cloudflare-ipfs.com/ipfs/${clean}`,
    `https://ipfs.io/ipfs/${clean}`,
    `https://gateway.pinata.cloud/ipfs/${clean}`,
  ];
  for (const url of gateways) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(12000),
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) continue;
      return (await res.json()) as unknown;
    } catch {
      // next gateway
    }
  }
  return null;
}

function txTimeMs(tx: KaspaRestTransaction): number {
  const t = tx.accepting_block_time ?? tx.block_time;
  if (typeof t === 'number' && t > 1e12) return t;
  if (typeof t === 'number' && t > 1e9) return t * 1000;
  return Date.now();
}

export function campaignToAdEntry(
  meta: AdCampaignMetadataV1,
  txId: string,
  metadataCid: string,
  startMs: number
): AdEntry {
  const endMs = startMs + meta.days * 24 * 60 * 60 * 1000;
  return {
    id: `${txId}-${metadataCid}`,
    slotId: meta.slotId,
    slotIndex: meta.slotIndex,
    format: meta.format,
    imageUrl: resolveAdImageUrl(meta.image),
    link: meta.link,
    title: meta.title,
    startTime: new Date(startMs).toISOString(),
    endTime: new Date(endMs).toISOString(),
    payerL1: meta.payerL1,
    metadataCid,
    txId,
  };
}

/**
 * Build active ad entries from treasury txs whose payload references IPFS metadata.
 */
export async function buildActiveAdsFromChain(): Promise<AdEntry[]> {
  const treasury = getAdsTreasuryL1Address();
  let treasuryNorm: string;
  try {
    treasuryNorm = normalizeKaspaAddress(treasury);
  } catch {
    return [];
  }

  const txs = await getFullTransactionsForAddress(treasury, ADS_TREASURY_TX_LIMIT);
  const now = Date.now();
  const seen = new Set<string>();
  const entries: AdEntry[] = [];

  for (const tx of txs) {
    const txId = tx.transaction_id ?? tx.transactionId;
    if (!txId) continue;
    const cid = extractCidFromPayload(getTxPayload(tx) ?? null);
    if (!cid) continue;
    const paid = sumOutputsToTreasury(tx, treasuryNorm);
    if (paid <= 0) continue;

    const raw = await fetchMetadataJson(cid);
    const meta = parseAdMetadataJson(raw);
    if (!meta) continue;

    const slotCfg = getSlotConfig(meta.slotId);
    if (!slotCfg) continue;
    const baseKas = priceKasForDays(slotCfg, meta.days);
    if (!isValidAdPayment(meta.priceKas, paid, baseKas)) continue;

    const payers = payerAddressesFromTx(tx);
    let payerNorm: string;
    try {
      payerNorm = normalizeKaspaAddress(meta.payerL1);
    } catch {
      continue;
    }
    if (!payers.has(payerNorm)) continue;

    const startMs = txTimeMs(tx);
    const endMs = startMs + meta.days * 24 * 60 * 60 * 1000;
    if (now > endMs || now < startMs) continue;

    const entry = campaignToAdEntry(meta, txId, cid, startMs);

    const dedupe = txId;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    entries.push(entry);
  }

  return entries;
}

export interface VerifyAdRegistrationBody {
  txHash: string;
  metadataCid: string;
}

/**
 * POST /api/ads/verify — confirms tx + metadata + payer for UX (listing uses on-chain payload).
 */
export async function verifyAdRegistration(body: VerifyAdRegistrationBody): Promise<{
  ok: boolean;
  error?: string;
  entry?: AdEntry;
}> {
  const { txHash, metadataCid } = body;
  if (!txHash || !metadataCid) {
    return { ok: false, error: 'txHash and metadataCid required' };
  }

  const tx = await getRestTransactionById(txHash);
  if (!tx) {
    return { ok: false, error: 'Transaction not found' };
  }

  const treasury = getAdsTreasuryL1Address();
  const treasuryNorm = normalizeKaspaAddress(treasury);
  const paid = sumOutputsToTreasury(tx, treasuryNorm);
  if (paid <= 0) {
    return { ok: false, error: 'No payment to ads treasury' };
  }

  const raw = await fetchMetadataJson(metadataCid);
  const meta = parseAdMetadataJson(raw);
  if (!meta) {
    return { ok: false, error: 'Invalid metadata' };
  }

  const slotCfg = getSlotConfig(meta.slotId);
  if (!slotCfg) {
    return { ok: false, error: 'Unknown slot' };
  }
  const baseKas = priceKasForDays(slotCfg, meta.days);
  if (!isValidAdPayment(meta.priceKas, paid, baseKas)) {
    return { ok: false, error: 'Price or amount does not match slot rate (including KREX tier discounts)' };
  }

  const payers = payerAddressesFromTx(tx);
  const payerNorm = normalizeKaspaAddress(meta.payerL1);
  if (!payers.has(payerNorm)) {
    return { ok: false, error: 'Payer does not match transaction inputs' };
  }

  const cleanCid = metadataCid.replace(/^ipfs:\/\//, '');
  const onChainCid = extractCidFromPayload(getTxPayload(tx) ?? null);
  if (onChainCid != null && onChainCid !== cleanCid) {
    return { ok: false, error: 'Metadata CID does not match transaction payload' };
  }

  const txId = tx.transaction_id ?? tx.transactionId ?? txHash;
  const startMs = txTimeMs(tx);
  const entry = campaignToAdEntry(meta, txId, cleanCid, startMs);
  return { ok: true, entry };
}
