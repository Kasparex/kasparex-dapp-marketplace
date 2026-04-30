import type { AdFormat, AdSlotId } from './types';
import { AD_SLOTS } from './slots';
import { ADS_MAX_DURATION_DAYS, ADS_MIN_DURATION_DAYS, ADS_MAX_PROMO_TOOLTIP_CHARS } from './constants';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';

export const AD_METADATA_VERSION = 1 as const;

export type AdImageRef =
  | { type: 'url'; value: string }
  | { type: 'ipfs'; value: string };

export type AdPaymentCurrency = 'KAS' | 'KREX';

/** Canonical JSON pinned to IPFS before L1 payment */
export interface AdCampaignMetadataV1 {
  v: typeof AD_METADATA_VERSION;
  slotId: AdSlotId;
  slotIndex: number;
  days: number;
  priceKas: number;
  payerL1: string;
  title: string;
  link: string;
  image: AdImageRef;
  format: AdFormat;
  createdAt: string;
  /** When paying creative fee in KREX — reveal tx id from wallet / indexer hashRev */
  paymentCurrency?: AdPaymentCurrency;
  /** Declared KREX total for peg audit (matches minecore KREX-per-KAS on total). */
  priceKrex?: number;
  krexPaymentTxHash?: string;
  /** Flat premium — highlighted placement frame */
  featuredHighlight?: boolean;
  /** Optional short promo line for hover tooltip on the creative */
  promoTooltip?: string;
}

export function buildCampaignMetadataV1(input: {
  slotId: AdSlotId;
  slotIndex: number;
  days: number;
  priceKas: number;
  payerL1: string;
  title: string;
  link: string;
  image: AdImageRef;
  format: AdFormat;
  paymentCurrency?: AdPaymentCurrency;
  priceKrex?: number;
  krexPaymentTxHash?: string;
  featuredHighlight?: boolean;
  promoTooltip?: string;
}): AdCampaignMetadataV1 {
  const row: AdCampaignMetadataV1 = {
    v: AD_METADATA_VERSION,
    slotId: input.slotId,
    slotIndex: input.slotIndex,
    days: input.days,
    priceKas: input.priceKas,
    payerL1: input.payerL1,
    title: input.title.trim(),
    link: input.link.trim(),
    image: input.image,
    format: input.format,
    createdAt: new Date().toISOString(),
  };
  if (input.paymentCurrency === 'KREX') {
    row.paymentCurrency = 'KREX';
    if (input.priceKrex != null) row.priceKrex = input.priceKrex;
    if (input.krexPaymentTxHash) row.krexPaymentTxHash = input.krexPaymentTxHash;
  }
  if (input.featuredHighlight === true) row.featuredHighlight = true;
  const tip = input.promoTooltip?.trim();
  if (tip && tip.length <= ADS_MAX_PROMO_TOOLTIP_CHARS) row.promoTooltip = tip;
  return row;
}

export function isValidSlotId(id: string): id is AdSlotId {
  if (id === 'GAMES_PLAY_RAIL_RIGHT') return true;
  return AD_SLOTS.some((s) => s.id === id);
}

export function parseAdMetadataJson(data: unknown): AdCampaignMetadataV1 | null {
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  if (o.v !== 1) return null;
  const slotIdRaw = o.slotId;
  const payerL1 = o.payerL1;
  const title = o.title;
  const link = o.link;
  const days = o.days;
  const priceKas = o.priceKas;
  const slotIndex = o.slotIndex;
  const image = o.image;
  if (typeof slotIdRaw !== 'string' || !isValidSlotId(slotIdRaw)) return null;
  const canonicalSlotId = (
    slotIdRaw === 'GAMES_PLAY_RAIL_RIGHT' ? 'HALO_GAMES_RIGHT' : slotIdRaw
  ) as AdSlotId;
  if (typeof payerL1 !== 'string' || !payerL1.startsWith('kaspa:')) return null;
  if (typeof title !== 'string' || !title.trim()) return null;
  if (typeof link !== 'string' || !link.trim()) return null;
  if (typeof days !== 'number' || !Number.isInteger(days)) return null;
  if (days < ADS_MIN_DURATION_DAYS || days > ADS_MAX_DURATION_DAYS) return null;
  if (typeof priceKas !== 'number' || priceKas <= 0) return null;
  if (typeof slotIndex !== 'number' || !Number.isInteger(slotIndex) || slotIndex < 0) return null;
  const slotCfg = AD_SLOTS.find((s) => s.id === canonicalSlotId);
  if (!slotCfg || slotIndex >= slotCfg.maxAds) return null;
  const promoRaw = o.promoTooltip;
  let promoTooltip: string | undefined;
  if (typeof promoRaw === 'string') {
    const t = promoRaw.trim();
    if (t.length > ADS_MAX_PROMO_TOOLTIP_CHARS) return null;
    if (t.length > 0) promoTooltip = t;
  }
  const fmt = o.format;
  if (fmt !== 'square' && fmt !== 'rectangle' && fmt !== 'tall') return null;
  if (!image || typeof image !== 'object') return null;
  const im = image as Record<string, unknown>;
  if (im.type !== 'url' && im.type !== 'ipfs') return null;
  if (typeof im.value !== 'string' || !im.value.trim()) return null;
  const pcRaw = o.paymentCurrency;
  const paymentCurrency =
    pcRaw === 'KREX' || pcRaw === 'KAS' ? (pcRaw as AdPaymentCurrency) : undefined;
  const priceKrex = typeof o.priceKrex === 'number' && Number.isFinite(o.priceKrex) ? o.priceKrex : undefined;
  const krexPaymentTxHash =
    typeof o.krexPaymentTxHash === 'string' && o.krexPaymentTxHash.trim() ? o.krexPaymentTxHash.trim() : undefined;
  const featuredHighlight = o.featuredHighlight === true;

  if (paymentCurrency === 'KREX') {
    if (!krexPaymentTxHash || priceKrex == null || priceKrex <= 0) return null;
  }

  const base: AdCampaignMetadataV1 = {
    v: 1,
    slotId: canonicalSlotId,
    slotIndex,
    days,
    priceKas,
    payerL1,
    title: title.trim(),
    link: link.trim(),
    image: im.type === 'url' ? { type: 'url', value: im.value.trim() } : { type: 'ipfs', value: im.value.trim() },
    format: fmt as AdFormat,
    createdAt: typeof o.createdAt === 'string' ? o.createdAt : new Date().toISOString(),
  };
  if (paymentCurrency) base.paymentCurrency = paymentCurrency;
  if (priceKrex != null) base.priceKrex = priceKrex;
  if (krexPaymentTxHash) base.krexPaymentTxHash = krexPaymentTxHash;
  if (featuredHighlight) base.featuredHighlight = true;
  if (promoTooltip) base.promoTooltip = promoTooltip;
  return base;
}

/** Resolve display URL for Next/Image or img */
export function resolveAdImageUrl(image: AdImageRef): string {
  if (image.type === 'url') return image.value.trim();
  const cid = image.value.replace(/^ipfs:\/\//, '').replace(/^\/?ipfs\//, '');
  return getBestGatewayUrl(cid);
}
