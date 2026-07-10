'use client';

import type { PublishedTokenListing, TokenOwnershipStatus } from './listingRecord';
import { listingToToken, mergeListingOverBase } from './listingRecord';
import type { Token } from './types';
import { generateTokenSlug } from './publish';
import { createDefaultPageConfig, applyPageSectionConfig } from './pageConfig';
import { tokenNetworkToListingNetwork } from './listingNetwork';
import { mergeTokenListings } from '@/lib/hub/contentMerge';
import { GRID_L1_MAINNET } from './grid-l1-canonical';

const STORAGE_KEY = 'tokens_published_listings';

function canonicalizeAuthorKey(input: string): string {
  const raw = String(input || '').trim().toLowerCase();
  if (!raw) return raw;
  if (raw.endsWith('.kas')) return raw;
  if (raw.startsWith('kaspa:')) return raw;
  if (/^q[a-z0-9]{30,}$/i.test(raw)) return `kaspa:${raw}`;
  return raw;
}

function uniqueSlug(base: string, existing: PublishedTokenListing[]): string {
  let slug = base;
  let n = 2;
  while (existing.some((l) => l.slug === slug)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

export function getAllPublishedListings(): PublishedTokenListing[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as PublishedTokenListing[]) : [];
  } catch (e) {
    console.error('[tokens/data] load failed', e);
    return [];
  }
}

function saveListings(listings: PublishedTokenListing[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
  window.dispatchEvent(new CustomEvent('tokens-listings-updated'));
}

/** Merge remote hub token listings into local storage (cross-device sync). */
export function importRemoteListings(remote: PublishedTokenListing[]): void {
  if (typeof window === 'undefined' || !remote.length) return;
  const merged = mergeTokenListings(getAllPublishedListings(), remote);
  saveListings(merged);
}

export function getPublishedListingBySlug(slug: string): PublishedTokenListing | null {
  return getAllPublishedListings().find((l) => l.slug === slug) ?? null;
}

export function getPublishedListingsByAuthor(authorAddress: string): PublishedTokenListing[] {
  const key = canonicalizeAuthorKey(authorAddress);
  return getAllPublishedListings().filter((l) => canonicalizeAuthorKey(l.author) === key);
}

export function getPublishedListingById(id: string): PublishedTokenListing | null {
  return getAllPublishedListings().find((l) => l.id === id) ?? null;
}

export function createPublishedListing(
  data: Omit<
    PublishedTokenListing,
    'id' | 'slug' | 'publishDate' | 'listingId' | 'status' | 'txHash' | 'commitTxHash' | 'contentHash'
  >,
  metadata?: Partial<
    Pick<
      PublishedTokenListing,
      'listingId' | 'txHash' | 'commitTxHash' | 'contentHash' | 'status' | 'metadataCid' | 'pricingSnapshot'
    >
  >,
): PublishedTokenListing {
  const listings = getAllPublishedListings();
  const slug = uniqueSlug(generateTokenSlug(data.symbol, data.name), listings);
  const listing: PublishedTokenListing = {
    ...data,
    author: canonicalizeAuthorKey(data.author),
    id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    listingId: metadata?.listingId ?? `ktl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    slug,
    publishDate: new Date().toISOString(),
    status: metadata?.status ?? 'verification_pending',
    txHash: metadata?.txHash,
    commitTxHash: metadata?.commitTxHash,
    contentHash: metadata?.contentHash,
    metadataCid: metadata?.metadataCid,
    pricingSnapshot: metadata?.pricingSnapshot,
  };
  listings.unshift(listing);
  saveListings(listings);
  return listing;
}

export function updatePublishedListing(
  id: string,
  updates: Partial<Omit<PublishedTokenListing, 'id' | 'author' | 'publishDate'>>,
  metadata?: Partial<
    Pick<
      PublishedTokenListing,
      'txHash' | 'commitTxHash' | 'contentHash' | 'status' | 'metadataCid' | 'pricingSnapshot' | 'paidModuleIds'
    >
  >,
): PublishedTokenListing | null {
  const listings = getAllPublishedListings();
  const idx = listings.findIndex((l) => l.id === id);
  if (idx < 0) return null;
  const updated: PublishedTokenListing = {
    ...listings[idx],
    ...updates,
    ...metadata,
    updatedAt: new Date().toISOString(),
  };
  listings[idx] = updated;
  saveListings(listings);
  return updated;
}

export function deletePublishedListing(id: string): boolean {
  const listings = getAllPublishedListings();
  const next = listings.filter((l) => l.id !== id);
  if (next.length === listings.length) return false;
  saveListings(next);
  return true;
}

/**
 * Seed a manageable published listing from an existing registry token (e.g. KREX,
 * GRID, KAS) so its owner wallet can edit and verify it from the dashboard. The base
 * slug is preserved so the public page reflects edits.
 */
export function createSeedClaimListing(
  token: Token,
  author: string,
  options?: { ownership?: TokenOwnershipStatus },
): PublishedTokenListing {
  const listings = getAllPublishedListings();
  const existing = listings.find((l) => l.slug === token.slug);
  if (existing) return existing;

  const ownership: TokenOwnershipStatus = options?.ownership ?? 'deployer_verified';
  const deployerVerified = ownership === 'deployer_verified';
  const listingNetwork =
    token.networks?.[0]?.network ??
    tokenNetworkToListingNetwork(token.network, token.contractAddress);
  const primaryAddress =
    token.networks?.[0]?.contractAddress ?? token.contractAddress;
  const pageConfig = applyPageSectionConfig(createDefaultPageConfig(), {
    overview: true,
    tokenomics: true,
    markets: true,
    links: true,
    comments: true,
  });

  const now = new Date().toISOString();
  const listing: PublishedTokenListing = {
    id: `tl-seed-${token.slug}-${Date.now().toString(36)}`,
    listingId: `ktl-seed-${token.slug}`,
    slug: token.slug,
    author: canonicalizeAuthorKey(author),
    symbol: token.symbol,
    name: token.name,
    description: token.description ?? '',
    shortDescription: token.shortDescription,
    tags: token.tags,
    listingNetwork,
    network: token.network,
    contractAddress: primaryAddress,
    logoUrl: token.logo,
    logoCid: token.logoCid,
    featuredImageUrl: token.featuredImage,
    featuredImageCid: token.featuredImageCid,
    pageConfig,
    publishDate: now,
    updatedAt: now,
    status: 'published',
    paidModuleIds: [],
    assetKind: 'real',
    ownership,
    maxSupply: token.maxSupply,
    totalSupply: token.totalSupply,
    decimals: token.decimals,
    listing: { verified: deployerVerified, deployerVerified },
    networks: token.networks?.length
      ? token.networks.map((entry, index) => ({
          ...entry,
          primary: entry.primary ?? index === 0,
          verified: entry.verified ?? (deployerVerified && index === 0),
        }))
      : undefined,
  };

  if (listingNetwork === 'krc20' && token.symbol?.trim()) {
    const tickerKrc20 =
      token.slug === 'grid' ? GRID_L1_MAINNET.tickerKrc20 : token.symbol.trim().toLowerCase();
    listing.onChainSnapshot = {
      source: 'krc20',
      ticker: tickerKrc20,
      decimals: token.decimals ?? 8,
      deployer:
        token.slug === 'grid'
          ? GRID_L1_MAINNET.deployerKaspa.replace(/^kaspa:/i, '')
          : undefined,
      fetchedAt: now,
    };
  }

  listings.unshift(listing);
  saveListings(listings);
  return listing;
}

export function mergePublishedIntoRegistry(baseTokens: Token[]): Token[] {
  const published = getAllPublishedListings().filter(
    (l) => l.status === 'verified' || l.status === 'published' || l.status === 'payment_pending' || l.status === 'verification_pending',
  );

  // Latest listing per slug wins (listings are stored newest-first).
  const latestBySlug = new Map<string, PublishedTokenListing>();
  for (const listing of published) {
    if (!latestBySlug.has(listing.slug)) latestBySlug.set(listing.slug, listing);
  }

  const baseSlugs = new Set(baseTokens.map((t) => t.slug));

  // Override registry tokens with their edited/claimed listing so cards reflect
  // uploaded logos, banners, and metadata just like the public token page.
  const merged = baseTokens.map((base) => {
    const listing = latestBySlug.get(base.slug);
    return listing ? mergeListingOverBase(base, listing) : base;
  });

  // Append brand-new listings that do not exist in the registry.
  const extra = published
    .filter((l) => !baseSlugs.has(l.slug))
    .filter((l, index, arr) => arr.findIndex((x) => x.slug === l.slug) === index)
    .map(listingToToken);

  return [...merged, ...extra];
}
