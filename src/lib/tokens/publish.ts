import type { TokenModuleId, TokenModulesConfig } from './modules';
import type { TokenListingNetwork } from './listingNetwork';
import { listingNetworkToTokenNetwork } from './listingNetwork';
import type { TokenPageConfig, TokenAssetKind, TokenOnChainSnapshot, TokenNetworkEntry } from './listingRecord';
import { fnv1aHex } from '@/lib/vblog/pricing';

export type TokenListingDraft = {
  symbol: string;
  name: string;
  description: string;
  shortDescription?: string;
  tags?: string[];
  category?: string;
  listingNetwork: TokenListingNetwork;
  contractAddress?: string;
  logoUrl?: string;
  logoCid?: string;
  featuredImageUrl?: string;
  featuredImageCid?: string;
  pageConfig: TokenPageConfig;
  enabledModuleIds: TokenModuleId[];
  author: string;
  assetKind?: TokenAssetKind;
  deployerAddress?: string;
  maxSupply?: number;
  totalSupply?: number;
  decimals?: number;
  onChainSnapshot?: TokenOnChainSnapshot;
  networks?: TokenNetworkEntry[];
  modulesConfig?: TokenModulesConfig;
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
    v: 4,
    op,
    symbol: draft.symbol.trim().toUpperCase(),
    name: draft.name.trim(),
    description: draft.description.trim(),
    shortDescription: (draft.shortDescription ?? '').trim(),
    tags: (draft.tags ?? []).map((t) => t.trim()).filter(Boolean),
    category: (draft.category ?? '').trim() || null,
    listingNetwork: draft.listingNetwork,
    network: listingNetworkToTokenNetwork(draft.listingNetwork),
    contractAddress: (draft.contractAddress ?? '').trim(),
    logoUrl: draft.logoUrl?.trim() || null,
    logoCid: draft.logoCid ?? null,
    featuredImageUrl: draft.featuredImageUrl?.trim() || null,
    featuredImageCid: draft.featuredImageCid ?? null,
    pageConfig: draft.pageConfig,
    enabledModuleIds: draft.enabledModuleIds,
    author: draft.author.trim().toLowerCase(),
    assetKind: draft.assetKind ?? 'real',
    deployerAddress: (draft.deployerAddress ?? '').trim() || null,
    maxSupply: draft.maxSupply ?? null,
    totalSupply: draft.totalSupply ?? null,
    decimals: draft.decimals ?? null,
    onChainSnapshot: draft.onChainSnapshot ?? null,
    networks: draft.networks ?? null,
    modulesConfig: draft.modulesConfig ?? null,
  });
}

export function hashListingPayload(draft: TokenListingDraft, op: 'create' | 'edit'): string {
  return fnv1aHex(buildCanonicalListingPayload(draft, op));
}
