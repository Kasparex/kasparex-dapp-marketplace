import {
  computeArticleChunkPlan,
  VBLOG_CHUNK_SIZE_BYTES,
  VBLOG_PER_CHUNK_KAS,
  VBLOG_PER_KB_KAS,
} from '@/lib/vblog/pricing';
import { krexTierDiscountPercent } from '@/lib/chronicles/vault/pricing';
import type { KREXTier } from '@/lib/rewards/types';
import { buildCanonicalGenesisPayload } from './payload';

export const GENESIS_BASE_FEE_KAS = 10;
export const GENESIS_NETWORK_BUFFER_KAS = 0.001;

export type GenesisMessageQuote = {
  payloadBytes: number;
  chunkCount: number;
  chunkSizeBytes: number;
  baseFeeKas: number;
  sizeFeeKas: number;
  networkBufferKas: number;
  subtotalKas: number;
  discountKas: number;
  discountPercent: number;
  totalKas: number;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeGenesisMessageQuote(
  contentHtml: string,
  author: string,
  tier: KREXTier,
): GenesisMessageQuote {
  const payload = buildCanonicalGenesisPayload({ contentHtml, author });
  const { payloadBytes, chunkCount } = computeArticleChunkPlan(payload);
  const sizeFeeKas = round2(chunkCount * VBLOG_PER_CHUNK_KAS + (payloadBytes / 1024) * VBLOG_PER_KB_KAS);
  const baseFeeKas = GENESIS_BASE_FEE_KAS;
  const networkBufferKas = GENESIS_NETWORK_BUFFER_KAS;
  const subtotalKas = round2(baseFeeKas + sizeFeeKas + networkBufferKas);
  const discountPercent = krexTierDiscountPercent(tier);
  const discountKas = round2(subtotalKas * (discountPercent / 100));
  const totalKas = round2(subtotalKas - discountKas);

  return {
    payloadBytes,
    chunkCount,
    chunkSizeBytes: VBLOG_CHUNK_SIZE_BYTES,
    baseFeeKas,
    sizeFeeKas,
    networkBufferKas,
    subtotalKas,
    discountKas,
    discountPercent,
    totalKas,
  };
}
