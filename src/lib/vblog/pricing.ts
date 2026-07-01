import type { VBlogArticle, VBlogModuleId, VBlogModulesConfig, VBlogSocialLink } from '@/lib/vblog/types';
import { socialLinksForPricingPayload } from '@/lib/vblog/socialLinks';
import type { KREXTier } from '@/lib/rewards/types';
import type { NFTStatus } from '@/lib/rewards/types';
import { computeVBlogModuleAddonKas, type VBlogModuleAddonLine } from '@/lib/vblog/modules';

export const VBLOG_CHUNK_SIZE_BYTES = 180;
export const VBLOG_CREATE_BASE_FEE_KAS = 10;
export const VBLOG_EDIT_BASE_FEE_KAS = 2;
export const VBLOG_DELETE_BASE_FEE_KAS = 0.1;
export const VBLOG_PER_CHUNK_KAS = 0.35;
export const VBLOG_PER_KB_KAS = 0.2;

export type VBlogAction = 'create' | 'edit';

export interface VBlogPricingDraft {
  title: string;
  description: string;
  content: string;
  category?: string;
  tags?: string[];
  featuredImage?: string;
  linkedMagazineId?: string;
  linkedIssueNumber?: number;
  author?: string;
  primaryLink?: string;
  socialLinks?: VBlogSocialLink[];
  modules?: VBlogModulesConfig;
  magazineIntegrationEnabled?: boolean;
  /** Module IDs already paid on a prior publish (excluded from edit pricing). */
  excludeModuleIds?: VBlogModuleId[];
}

function normalizeModulesForPayload(modules?: VBlogModulesConfig): Record<string, unknown> | null {
  if (!modules) return null;
  const out: Record<string, unknown> = {};
  if (modules.premiumSectionEnabled) {
    out.premiumSectionEnabled = true;
    out.premiumSectionContent = (modules.premiumSectionContent ?? '').trim();
    out.premiumSectionPriceKas = modules.premiumSectionPriceKas ?? 0;
    out.premiumSectionPayoutAddress = (modules.premiumSectionPayoutAddress ?? '').trim();
  }
  if (modules.tipBoxEnabled) {
    out.tipBoxEnabled = true;
    out.tipBox = modules.tipBox ?? { presets: [10, 50, 100], allowCustom: true };
  }
  if (modules.tipToRevealEnabled) {
    out.tipToRevealEnabled = true;
    out.tipToRevealContent = (modules.tipToRevealContent ?? '').trim();
    out.tipToRevealThresholdKas = modules.tipToRevealThresholdKas ?? 0;
  }
  if (modules.premiumPollEnabled) {
    out.premiumPollEnabled = true;
    out.premiumPoll = {
      question: (modules.premiumPoll?.question ?? '').trim(),
      options: (modules.premiumPoll?.options ?? []).map((o) => o.trim()).filter(Boolean),
    };
  }
  if (modules.readingReceiptsEnabled) {
    out.readingReceiptsEnabled = true;
  }
  return Object.keys(out).length > 0 ? out : null;
}

export interface VBlogPriceQuote {
  action: VBlogAction;
  payloadBytes: number;
  chunkCount: number;
  baseFeeKas: number;
  sizeFeeKas: number;
  networkFeeBufferKas: number;
  modulesFeeKas: number;
  moduleLines: VBlogModuleAddonLine[];
  subtotalKas: number;
  discountKas: number;
  totalKas: number;
}

export function getVBlogBaseFeeKas(action: VBlogAction): number {
  if (action === 'edit') return VBLOG_EDIT_BASE_FEE_KAS;
  return VBLOG_CREATE_BASE_FEE_KAS;
}

function round2(value: number): number {
  return Math.ceil(value * 100) / 100;
}

function utf8Bytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

export function deterministicStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => deterministicStringify(v)).join(',')}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${deterministicStringify(obj[k])}`).join(',')}}`;
}

export function buildCanonicalArticlePayload(draft: VBlogPricingDraft, action: VBlogAction): string {
  const canonical = {
    v: 1,
    action,
    title: draft.title.trim(),
    description: draft.description.trim(),
    content: draft.content.trim(),
    category: (draft.category ?? '').trim(),
    tags: (draft.tags ?? []).map((t) => t.trim()).filter(Boolean),
    featuredImage: (draft.featuredImage ?? '').trim(),
    linkedMagazineId: (draft.linkedMagazineId ?? '').trim(),
    linkedIssueNumber: draft.linkedIssueNumber ?? null,
    author: (draft.author ?? '').trim(),
    primaryLink: (draft.primaryLink ?? '').trim(),
    socialLinks: socialLinksForPricingPayload(draft.socialLinks),
    modules: normalizeModulesForPayload(draft.modules),
  };
  return deterministicStringify(canonical);
}

export function computeArticleChunkPlan(payload: string): {
  payloadBytes: number;
  chunkCount: number;
  chunks: string[];
} {
  const bytes = utf8Bytes(payload);
  const payloadBytes = bytes.length;
  const chunkCount = Math.max(1, Math.ceil(payloadBytes / VBLOG_CHUNK_SIZE_BYTES));
  const chunks: string[] = [];
  for (let i = 0; i < bytes.length; i += VBLOG_CHUNK_SIZE_BYTES) {
    const slice = bytes.slice(i, i + VBLOG_CHUNK_SIZE_BYTES);
    chunks.push(Array.from(slice, (b) => String.fromCharCode(b)).join(''));
  }
  if (chunks.length === 0) {
    chunks.push('');
  }
  return { payloadBytes, chunkCount, chunks };
}

export function fnv1aHex(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function computeVBlogArticlePrice(
  draft: VBlogPricingDraft,
  action: VBlogAction,
  discountPercent: number = 0,
  modulePricing?: { tier: KREXTier; nft: NFTStatus | null | undefined },
): VBlogPriceQuote {
  const payload = buildCanonicalArticlePayload(draft, action);
  const { payloadBytes, chunkCount } = computeArticleChunkPlan(payload);
  const discount = Math.min(Math.max(discountPercent, 0), 90) / 100;
  const baseFeeKas = getVBlogBaseFeeKas(action);
  const sizeFeeKas = chunkCount * VBLOG_PER_CHUNK_KAS + (payloadBytes / 1024) * VBLOG_PER_KB_KAS;
  const networkFeeBufferKas = Math.max(0.05, chunkCount * 0.01);
  const moduleAddon = modulePricing
    ? computeVBlogModuleAddonKas(
        draft.modules,
        draft.magazineIntegrationEnabled === true,
        modulePricing.tier,
        modulePricing.nft,
        draft.excludeModuleIds ?? [],
      )
    : { totalKas: 0, lines: [] as VBlogModuleAddonLine[] };
  const subtotalKas = baseFeeKas + sizeFeeKas + networkFeeBufferKas + moduleAddon.totalKas;
  const totalKas = round2(subtotalKas * (1 - discount));
  const discountKas = round2(subtotalKas - totalKas);
  return {
    action,
    payloadBytes,
    chunkCount,
    baseFeeKas: round2(baseFeeKas),
    sizeFeeKas: round2(sizeFeeKas),
    networkFeeBufferKas: round2(networkFeeBufferKas),
    modulesFeeKas: round2(moduleAddon.totalKas),
    moduleLines: moduleAddon.lines,
    subtotalKas: round2(subtotalKas),
    discountKas,
    totalKas,
  };
}

export function toPricingDraft(
  article: Pick<
    VBlogArticle,
    | 'title'
    | 'description'
    | 'content'
    | 'category'
    | 'tags'
    | 'featuredImage'
    | 'linkedMagazineId'
    | 'linkedIssueNumber'
    | 'author'
    | 'primaryLink'
    | 'socialLinks'
    | 'modules'
  >,
): VBlogPricingDraft {
  return {
    title: article.title,
    description: article.description,
    content: article.content,
    category: article.category,
    tags: article.tags,
    featuredImage: article.featuredImage,
    linkedMagazineId: article.linkedMagazineId,
    linkedIssueNumber: article.linkedIssueNumber,
    author: article.author,
    primaryLink: article.primaryLink,
    socialLinks: article.socialLinks,
    modules: article.modules,
  };
}
