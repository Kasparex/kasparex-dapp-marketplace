import type { AdFormat, AdSlotId } from './types';
import { AD_SLOTS } from './slots';
import { ADS_MAX_DURATION_DAYS, ADS_MIN_DURATION_DAYS } from './constants';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';

export const AD_METADATA_VERSION = 1 as const;

export type AdImageRef =
  | { type: 'url'; value: string }
  | { type: 'ipfs'; value: string };

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
}): AdCampaignMetadataV1 {
  return {
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
}

export function isValidSlotId(id: string): id is AdSlotId {
  return AD_SLOTS.some((s) => s.id === id);
}

export function parseAdMetadataJson(data: unknown): AdCampaignMetadataV1 | null {
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  if (o.v !== 1) return null;
  const slotId = o.slotId;
  const payerL1 = o.payerL1;
  const title = o.title;
  const link = o.link;
  const days = o.days;
  const priceKas = o.priceKas;
  const slotIndex = o.slotIndex;
  const image = o.image;
  if (typeof slotId !== 'string' || !isValidSlotId(slotId)) return null;
  if (typeof payerL1 !== 'string' || !payerL1.startsWith('kaspa:')) return null;
  if (typeof title !== 'string' || !title.trim()) return null;
  if (typeof link !== 'string' || !link.trim()) return null;
  if (typeof days !== 'number' || !Number.isInteger(days)) return null;
  if (days < ADS_MIN_DURATION_DAYS || days > ADS_MAX_DURATION_DAYS) return null;
  if (typeof priceKas !== 'number' || priceKas <= 0) return null;
  if (typeof slotIndex !== 'number' || !Number.isInteger(slotIndex) || slotIndex < 0) return null;
  const slotCfg = AD_SLOTS.find((s) => s.id === slotId);
  if (!slotCfg || slotIndex >= slotCfg.maxAds) return null;
  const fmt = o.format;
  if (fmt !== 'square' && fmt !== 'rectangle' && fmt !== 'tall') return null;
  if (!image || typeof image !== 'object') return null;
  const im = image as Record<string, unknown>;
  if (im.type !== 'url' && im.type !== 'ipfs') return null;
  if (typeof im.value !== 'string' || !im.value.trim()) return null;
  const sid = slotId as AdSlotId;
  return {
    v: 1,
    slotId: sid,
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
}

/** Resolve display URL for Next/Image or img */
export function resolveAdImageUrl(image: AdImageRef): string {
  if (image.type === 'url') return image.value.trim();
  const cid = image.value.replace(/^ipfs:\/\//, '').replace(/^\/?ipfs\//, '');
  return getBestGatewayUrl(cid);
}
