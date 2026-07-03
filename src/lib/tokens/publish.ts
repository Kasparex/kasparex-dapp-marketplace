import type { TokenModuleId } from './modules';
import type { TokenNetwork } from './types';
import type { TokenPageConfig } from './listingRecord';
import { fnv1aHex } from '@/lib/vblog/pricing';

export type TokenListingDraft = {
  symbol: string;
  name: string;
  description: string;
  shortDescription?: string;
  tags?: string[];
  network: TokenNetwork;
  contractAddress?: string;
  logoCid?: string;
  featuredImageCid?: string;
  pageConfig: TokenPageConfig;
  enabledModuleIds: TokenModuleId[];
  author: string;
};

export function generateTokenSlug(symbol: string, name: string): string {
  const base = (symbol.trim() || name.trim() || 'token')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 48);
  return base || 'token';
}

export function buildCanonicalListingPayload(draft: TokenListingDraft, op: 'create' | 'edit'): string {
  return JSON.stringify({
    v: 1,
    op,
    symbol: draft.symbol.trim().toUpperCase(),
    name: draft.name.trim(),
    description: draft.description.trim(),
    shortDescription: (draft.shortDescription ?? '').trim(),
    tags: (draft.tags ?? []).map((t) => t.trim()).filter(Boolean),
    network: draft.network,
    contractAddress: (draft.contractAddress ?? '').trim(),
    logoCid: draft.logoCid ?? null,
    featuredImageCid: draft.featuredImageCid ?? null,
    pageConfig: draft.pageConfig,
    enabledModuleIds: draft.enabledModuleIds,
    author: draft.author.trim().toLowerCase(),
  });
}

export function hashListingPayload(draft: TokenListingDraft, op: 'create' | 'edit'): string {
  return fnv1aHex(buildCanonicalListingPayload(draft, op));
}
