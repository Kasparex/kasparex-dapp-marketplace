import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import {
  getFullTransactionsForAddress,
  getRestTransactionById,
  type KaspaRestTransaction,
  type KaspaRestTxOutput,
} from '@/lib/kaspa/api';
import { getAdsTreasuryL1Address } from '@/lib/ads/config';
import {
  AD_PAYLOAD_PREFIX,
  AD_PAYLOAD_PREFIX_LEGACY,
  ADS_TREASURY_TX_LIMIT,
} from '@/lib/ads/constants';
import {
  parseAdMetadataJson,
  resolveAdImageUrl,
  type AdCampaignMetadataV1,
} from '@/lib/ads/metadata';
import { priceKasForDays, getSlotConfig } from '@/lib/ads/slots';
import {
  isValidAdKasPayment,
  isValidAdKrexBindingKasPaid,
  isValidAdKrexPriceMeta,
  premiumOptionsFromMeta,
} from '@/lib/ads/adPriceValidation';
import { exposureBonusSecondsFromPremium } from '@/lib/ads/carouselTiming';
import { expectedKrexAmtSmallestFromHuman, verifyKrexTreasuryTransfer } from '@/lib/ads/krexPaymentVerify';
import { payerAddressesFromTx } from '@/lib/ads/payerFromTx';
import type { AdEntry } from '@/lib/ads/types';

const TREASURY_TX_SCAN_PAGES = 5;

/** Kaspa REST returns `payload` as hex of on-chain bytes. KasWare often puts ASCII hex of the binding on-chain, so we peel 1–3 hex layers. */
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

/** IPFS CID (v1 base32 or v0 base58) embedded in peeled binding text; scan base32 run to avoid trailing garbage after mojibake. */
function findIpfsCidInText(text: string): string | null {
  const low = text.toLowerCase();
  const start = low.search(/baf[ky][a-z2-7]/);
  if (start >= 0) {
    let j = start + 3;
    while (j < low.length && /[a-z2-7]/.test(low[j]!)) j++;
    if (j - start >= 50) return low.slice(start, j);
  }
  const qm = text.match(/Qm[1-9A-HJ-NP-Za-km-z]{44,}/);
  if (qm) return qm[0];
  return null;
}

function extractCidAfterPrefix(text: string, prefix: string): string | null {
  const i = text.indexOf(prefix);
  if (i < 0) return null;
  const rest = text.slice(i + prefix.length).trim();
  const fromBaf = findIpfsCidInText(rest);
  if (fromBaf) return fromBaf;
  const token = rest.match(/^([a-z2-7]+)/i);
  if (token && token[1].length >= 50) return token[1].toLowerCase();
  return null;
}

function extractCidFromPayload(payload: string | null | undefined): string | null {
  if (!payload || typeof payload !== 'string') return null;
  try {
    const trimmedRaw = payload.trim();
    const text = /^[0-9a-fA-F]+$/.test(trimmedRaw) && trimmedRaw.length % 2 === 0
      ? peelHexPayloadLayers(trimmedRaw)
      : trimmedRaw;

    for (const prefix of [AD_PAYLOAD_PREFIX_LEGACY, AD_PAYLOAD_PREFIX]) {
      const byPrefix = extractCidAfterPrefix(text, prefix);
      if (byPrefix) return byPrefix;
    }

    const loose = findIpfsCidInText(text);
    if (loose) return loose;

    const single = text.trim();
    if (/^(baf[ky][a-z2-7]{45,}|Qm[1-9A-HJ-NP-Za-km-z]{40,})$/i.test(single)) {
      return single.toLowerCase();
    }
    return null;
  } catch {
    return null;
  }
}

function normalizeCidCompare(a: string, b: string): boolean {
  const x = a.replace(/^ipfs:\/\//, '').trim().toLowerCase();
  const y = b.replace(/^ipfs:\/\//, '').trim().toLowerCase();
  return x === y;
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

async function treasuryTransactionsForScan(treasury: string): Promise<KaspaRestTransaction[]> {
  const merged: KaspaRestTransaction[] = [];
  for (let page = 0; page < TREASURY_TX_SCAN_PAGES; page++) {
    const offset = page * ADS_TREASURY_TX_LIMIT;
    const batch = await getFullTransactionsForAddress(treasury, ADS_TREASURY_TX_LIMIT, { offset });
    if (!batch.length) break;
    merged.push(...batch);
    if (batch.length < ADS_TREASURY_TX_LIMIT) break;
  }
  return merged;
}

async function payerAddressesResolved(tx: KaspaRestTransaction): Promise<Set<string>> {
  let payers = payerAddressesFromTx(tx);
  if (payers.size > 0) return payers;
  const txId = tx.transaction_id ?? tx.transactionId;
  if (!txId) return payers;
  const rich = await getRestTransactionById(txId, { maxAttempts: 2, delayMs: 250 });
  if (rich) payers = payerAddressesFromTx(rich);
  return payers;
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
  const exposureBonusSeconds = exposureBonusSecondsFromPremium(meta.extendedExposure);
  return {
    id: `${txId}-${metadataCid}`,
    slotId: meta.slotId,
    slotIndex: meta.slotIndex,
    featuredHighlight: meta.featuredHighlight === true,
    exposureBonusSeconds,
    format: meta.format,
    imageUrl: resolveAdImageUrl(meta.image),
    link: meta.link,
    title: meta.title,
    promoTooltip: meta.promoTooltip?.trim() || undefined,
    startTime: new Date(startMs).toISOString(),
    endTime: new Date(endMs).toISOString(),
    payerL1: meta.payerL1,
    metadataCid,
    txId,
  };
}

async function verifyAdEconomics(
  meta: AdCampaignMetadataV1,
  paidSompi: number,
  slotBaseKas: number,
  treasuryPrefixed: string,
  payerPrefixed: string,
): Promise<boolean> {
  const currency = meta.paymentCurrency ?? 'KAS';
  const premium = premiumOptionsFromMeta(meta);
  if (currency === 'KAS') {
    return isValidAdKasPayment(meta.priceKas, paidSompi, slotBaseKas, premium);
  }
  if (!isValidAdKrexBindingKasPaid(paidSompi)) return false;
  if (!meta.priceKrex || !meta.krexPaymentTxHash) return false;
  if (!isValidAdKrexPriceMeta(meta.priceKas, meta.priceKrex, slotBaseKas, premium)) return false;
  const minAmt = expectedKrexAmtSmallestFromHuman(meta.priceKrex);
  for (let attempt = 0; attempt < 4; attempt++) {
    const ok = await verifyKrexTreasuryTransfer({
      payerAddress: payerPrefixed,
      treasuryAddress: treasuryPrefixed,
      krexPaymentTxHash: meta.krexPaymentTxHash,
      minAmtSmallest: minAmt,
    });
    if (ok) return true;
    if (attempt < 3) await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
  }
  return false;
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

  const txs = await treasuryTransactionsForScan(treasury);
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

    const payers = await payerAddressesResolved(tx);
    let payerNorm: string;
    try {
      payerNorm = normalizeKaspaAddress(meta.payerL1);
    } catch {
      continue;
    }
    if (!payers.has(payerNorm)) continue;

    const econOk = await verifyAdEconomics(meta, paid, baseKas, treasury, payerNorm);
    if (!econOk) continue;

    const startMs = txTimeMs(tx);
    const endMs = startMs + meta.days * 24 * 60 * 60 * 1000;
    if (now > endMs) continue;
    // Allow a few minutes of skew (indexer block time vs server clock; newly accepted txs).
    if (now < startMs - 5 * 60 * 1000) continue;

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
 * POST /api/ads/verify - confirms tx + metadata + payer for UX (listing uses on-chain payload).
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

  const tx = await getRestTransactionById(txHash, { maxAttempts: 9, delayMs: 300 });
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

  const payers = await payerAddressesResolved(tx);
  const payerNorm = normalizeKaspaAddress(meta.payerL1);
  if (!payers.has(payerNorm)) {
    return { ok: false, error: 'Payer does not match transaction inputs' };
  }

  const econOk = await verifyAdEconomics(meta, paid, baseKas, treasury, payerNorm);
  if (!econOk) {
    return {
      ok: false,
      error:
        meta.paymentCurrency === 'KREX'
          ? 'KREX payment or binding fee does not match metadata (check treasury transfer and binding tx)'
          : 'Price or amount does not match slot rate (including KREX tier discounts and featured add-on)',
    };
  }

  const cleanCid = metadataCid.replace(/^ipfs:\/\//, '').trim();
  const rawPayload = getTxPayload(tx) ?? null;
  const onChainCid = extractCidFromPayload(rawPayload);
  if (onChainCid != null && !normalizeCidCompare(onChainCid, cleanCid)) {
    const peeled =
      rawPayload && /^[0-9a-fA-F]+$/.test(rawPayload.trim()) && rawPayload.trim().length % 2 === 0
        ? peelHexPayloadLayers(rawPayload.trim())
        : rawPayload ?? '';
    const embedded = peeled.toLowerCase().includes(cleanCid.toLowerCase());
    if (!embedded) {
      return { ok: false, error: 'Metadata CID does not match transaction payload' };
    }
  }

  const txId = tx.transaction_id ?? tx.transactionId ?? txHash;
  const startMs = txTimeMs(tx);
  const entry = campaignToAdEntry(meta, txId, cleanCid, startMs);
  return { ok: true, entry };
}
