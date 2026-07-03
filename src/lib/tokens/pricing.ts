/**
 * Token listing pricing (vBlog-aligned: base fee + size/chunk fees + modules).
 */

import {
  VBLOG_CHUNK_SIZE_BYTES,
  VBLOG_PER_CHUNK_KAS,
  VBLOG_PER_KB_KAS,
  computeArticleChunkPlan,
  fnv1aHex,
} from '@/lib/vblog/pricing';
import type { TokenModuleId } from './modules';
import { TOKEN_MODULE_OFFERS } from './modules';
import { buildCanonicalListingPayload, type TokenListingDraft } from './publish';

export const TOKEN_LISTING_FEES = {
  createListingKas: 25,
  updateListingKas: 5,
  verifyProjectKas: 10,
} as const;

export const TOKEN_CHUNK_SIZE_BYTES = VBLOG_CHUNK_SIZE_BYTES;

export type TokenListingAction = 'create' | 'edit';

export type TokenListingPriceQuote = {
  action: TokenListingAction;
  payloadBytes: number;
  chunkCount: number;
  baseFeeKas: number;
  sizeFeeKas: number;
  modulesFeeKas: number;
  networkFeeBufferKas: number;
  moduleLines: { id: string; title: string; kas: number }[];
  subtotalKas: number;
  discountKas: number;
  totalKas: number;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function estimateTokenListingQuote(args: {
  draft: TokenListingDraft;
  action: TokenListingAction;
  discountPercent?: number;
  moduleIds?: TokenModuleId[];
  excludeModuleIds?: TokenModuleId[];
  priorPricingSnapshot?: { payloadBytes: number; chunkCount: number };
}): TokenListingPriceQuote {
  const payload = buildCanonicalListingPayload(args.draft, args.action);
  const { payloadBytes, chunkCount } = computeArticleChunkPlan(payload);
  const discount = Math.min(Math.max(args.discountPercent ?? 0, 0), 90) / 100;
  const baseFeeKas = args.action === 'edit' ? TOKEN_LISTING_FEES.updateListingKas : TOKEN_LISTING_FEES.createListingKas;

  let sizeFeeKas = chunkCount * VBLOG_PER_CHUNK_KAS + (payloadBytes / 1024) * VBLOG_PER_KB_KAS;
  if (args.action === 'edit' && args.priorPricingSnapshot) {
    const priorBytes = args.priorPricingSnapshot.payloadBytes;
    const priorChunks = args.priorPricingSnapshot.chunkCount;
    const deltaBytes = Math.max(0, payloadBytes - priorBytes);
    const deltaChunks = Math.max(0, chunkCount - priorChunks);
    sizeFeeKas = deltaChunks * VBLOG_PER_CHUNK_KAS + (deltaBytes / 1024) * VBLOG_PER_KB_KAS;
  }

  const billableModuleIds = (args.moduleIds ?? args.draft.enabledModuleIds).filter(
    (id) => !(args.excludeModuleIds ?? []).includes(id),
  );
  const modulePriceById = Object.fromEntries(TOKEN_MODULE_OFFERS.map((o) => [o.id, o.unlockPriceKas]));
  const moduleLines = billableModuleIds.map((id) => {
    const offer = TOKEN_MODULE_OFFERS.find((o) => o.id === id);
    return { id, title: offer?.title ?? id.replace(/_/g, ' '), kas: modulePriceById[id] ?? 0 };
  });
  const modulesFeeKas = moduleLines.reduce((sum, line) => sum + line.kas, 0);

  const networkFeeBufferKas =
    args.action === 'edit'
      ? sizeFeeKas > 0 || modulesFeeKas > 0
        ? Math.max(0.05, Math.max(chunkCount, 1) * 0.01)
        : 0
      : Math.max(0.05, chunkCount * 0.01);

  const subtotalKas = baseFeeKas + sizeFeeKas + modulesFeeKas + networkFeeBufferKas;
  const totalKas = round2(subtotalKas * (1 - discount));
  const discountKas = round2(subtotalKas - totalKas);

  return {
    action: args.action,
    payloadBytes,
    chunkCount,
    baseFeeKas: round2(baseFeeKas),
    sizeFeeKas: round2(sizeFeeKas),
    modulesFeeKas: round2(modulesFeeKas),
    networkFeeBufferKas: round2(networkFeeBufferKas),
    moduleLines,
    subtotalKas: round2(subtotalKas),
    discountKas,
    totalKas,
  };
}

/** @deprecated Use estimateTokenListingQuote */
export function estimateTokenPageQuote(options: {
  baseFeeKas?: number;
  moduleIds?: string[];
  modulePriceById?: Record<string, number>;
}): {
  baseFeeKas: number;
  modulesFeeKas: number;
  networkFeeBufferKas: number;
  totalKas: number;
  moduleLines: { id: string; title: string; kas: number }[];
} {
  const baseFeeKas = options.baseFeeKas ?? TOKEN_LISTING_FEES.createListingKas;
  const moduleLines = (options.moduleIds ?? []).map((id) => ({
    id,
    title: id.replace(/_/g, ' '),
    kas: options.modulePriceById?.[id] ?? 0,
  }));
  const modulesFeeKas = moduleLines.reduce((sum, line) => sum + line.kas, 0);
  const networkFeeBufferKas = 0.5;
  const totalKas = Math.round((baseFeeKas + modulesFeeKas + networkFeeBufferKas) * 100) / 100;
  return { baseFeeKas, modulesFeeKas, networkFeeBufferKas, totalKas, moduleLines };
}

export function hashListingContent(draft: TokenListingDraft, action: TokenListingAction): string {
  return fnv1aHex(buildCanonicalListingPayload(draft, action));
}
