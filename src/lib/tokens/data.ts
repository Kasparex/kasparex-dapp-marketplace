'use client';

import type { PublishedTokenListing } from './listingRecord';
import { listingToToken } from './listingRecord';
import type { Token } from './types';
import { generateTokenSlug } from './publish';

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

export function mergePublishedIntoRegistry(baseTokens: Token[]): Token[] {
  const published = getAllPublishedListings().filter(
    (l) => l.status === 'verified' || l.status === 'published' || l.status === 'verification_pending',
  );
  const publishedTokens = published.map(listingToToken);
  const baseSlugs = new Set(baseTokens.map((t) => t.slug));
  const extra = publishedTokens.filter((t) => !baseSlugs.has(t.slug));
  return [...baseTokens, ...extra];
}
