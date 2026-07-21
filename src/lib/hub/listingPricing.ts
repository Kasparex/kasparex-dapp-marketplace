/**
 * Shared Hub listing pricing (vBlog / Tokens aligned):
 * base fee + size/chunk fees + network buffer + modules + KREX discount.
 */

import {
  VBLOG_CHUNK_SIZE_BYTES,
  VBLOG_PER_CHUNK_KAS,
  VBLOG_PER_KB_KAS,
  computeArticleChunkPlan,
  deterministicStringify,
  fnv1aHex,
} from '@/lib/vblog/pricing';

export const HUB_LISTING_CHUNK_SIZE_BYTES = VBLOG_CHUNK_SIZE_BYTES;
export const HUB_LISTING_PER_CHUNK_KAS = VBLOG_PER_CHUNK_KAS;
export const HUB_LISTING_PER_KB_KAS = VBLOG_PER_KB_KAS;

export type HubListingAction = 'create' | 'edit';

export type HubListingModuleLine = {
  id: string;
  title: string;
  kas: number;
};

export type HubListingPriceQuote = {
  action: HubListingAction;
  payloadBytes: number;
  chunkCount: number;
  baseFeeKas: number;
  sizeFeeKas: number;
  networkFeeBufferKas: number;
  modulesFeeKas: number;
  moduleLines: HubListingModuleLine[];
  subtotalKas: number;
  discountPercent: number;
  discountKas: number;
  totalKas: number;
  contentHash: string;
};

function round2(n: number): number {
  return Math.ceil(n * 100) / 100;
}

export function buildCanonicalHubPayload(fields: Record<string, unknown>, action: HubListingAction): string {
  return deterministicStringify({ v: 1, action, ...fields });
}

export function estimateHubListingQuote(args: {
  action: HubListingAction;
  /** Canonical fields included in the paid payload (title, body, modules flags, etc.). */
  fields: Record<string, unknown>;
  baseFeeKas: number;
  moduleLines?: HubListingModuleLine[];
  discountPercent?: number;
  priorPricingSnapshot?: { payloadBytes: number; chunkCount: number };
}): HubListingPriceQuote {
  const payload = buildCanonicalHubPayload(args.fields, args.action);
  const { payloadBytes, chunkCount } = computeArticleChunkPlan(payload);
  const discount = Math.min(Math.max(args.discountPercent ?? 0, 0), 90) / 100;
  const baseFeeKas = args.baseFeeKas;
  const moduleLines = args.moduleLines ?? [];
  const modulesFeeKas = moduleLines.reduce((sum, line) => sum + line.kas, 0);

  let sizeFeeKas = chunkCount * HUB_LISTING_PER_CHUNK_KAS + (payloadBytes / 1024) * HUB_LISTING_PER_KB_KAS;
  let billableChunks = chunkCount;
  if (args.action === 'edit' && args.priorPricingSnapshot) {
    const priorBytes = args.priorPricingSnapshot.payloadBytes;
    const priorChunks = args.priorPricingSnapshot.chunkCount;
    const deltaBytes = Math.max(0, payloadBytes - priorBytes);
    const deltaChunks = Math.max(0, chunkCount - priorChunks);
    billableChunks = deltaChunks;
    sizeFeeKas = deltaChunks * HUB_LISTING_PER_CHUNK_KAS + (deltaBytes / 1024) * HUB_LISTING_PER_KB_KAS;
  }

  const networkFeeBufferKas =
    args.action === 'edit'
      ? sizeFeeKas > 0 || modulesFeeKas > 0
        ? Math.max(0.05, Math.max(billableChunks, 1) * 0.01)
        : 0
      : Math.max(0.05, chunkCount * 0.01);

  const subtotalKas = baseFeeKas + sizeFeeKas + modulesFeeKas + networkFeeBufferKas;
  const discountPercent = Math.min(Math.max(args.discountPercent ?? 0, 0), 90);
  const totalKas = round2(subtotalKas * (1 - discount));
  const discountKas = round2(subtotalKas - totalKas);

  return {
    action: args.action,
    payloadBytes,
    chunkCount,
    baseFeeKas: round2(baseFeeKas),
    sizeFeeKas: round2(sizeFeeKas),
    networkFeeBufferKas: round2(networkFeeBufferKas),
    modulesFeeKas: round2(modulesFeeKas),
    moduleLines,
    subtotalKas: round2(subtotalKas),
    discountPercent,
    discountKas,
    totalKas,
    contentHash: fnv1aHex(payload),
  };
}

export function hubListingCommitNote(args: {
  kind: string;
  contentHash: string;
  payloadBytes: number;
  chunkCount: number;
  totalKas: number;
}): string {
  return `kasparex:${args.kind}:v1:${args.contentHash}:${args.payloadBytes}b:${args.chunkCount}c:${args.totalKas}kas`;
}
