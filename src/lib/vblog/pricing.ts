import type { VBlogArticle } from '@/lib/vblog/types';

export const VBLOG_CHUNK_SIZE_BYTES = 180;
export const VBLOG_BASE_FEE_KAS = 10;
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
}

export interface VBlogPriceQuote {
  action: VBlogAction;
  payloadBytes: number;
  chunkCount: number;
  baseFeeKas: number;
  sizeFeeKas: number;
  networkFeeBufferKas: number;
  totalKas: number;
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
  discountPercent: number = 0
): VBlogPriceQuote {
  const payload = buildCanonicalArticlePayload(draft, action);
  const { payloadBytes, chunkCount } = computeArticleChunkPlan(payload);
  const discount = Math.min(Math.max(discountPercent, 0), 90) / 100;
  const baseFeeKas = VBLOG_BASE_FEE_KAS * (1 - discount);
  const sizeFeeKas = chunkCount * VBLOG_PER_CHUNK_KAS + (payloadBytes / 1024) * VBLOG_PER_KB_KAS;
  const networkFeeBufferKas = Math.max(0.05, chunkCount * 0.01);
  const totalKas = round2(baseFeeKas + sizeFeeKas + networkFeeBufferKas);
  return {
    action,
    payloadBytes,
    chunkCount,
    baseFeeKas: round2(baseFeeKas),
    sizeFeeKas: round2(sizeFeeKas),
    networkFeeBufferKas: round2(networkFeeBufferKas),
    totalKas,
  };
}

export function toPricingDraft(article: Pick<VBlogArticle, 'title' | 'description' | 'content' | 'category' | 'tags' | 'featuredImage' | 'linkedMagazineId' | 'linkedIssueNumber' | 'author'>): VBlogPricingDraft {
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
  };
}
