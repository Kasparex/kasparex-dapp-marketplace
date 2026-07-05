import type { VBlogArticle } from '@/lib/vblog/types';
import type { PublishedTokenListing } from '@/lib/tokens/listingRecord';
import type { DirectoryListing } from '@/lib/dapps/listingSubmissions';
import type { ChroniclesCommunitySubmission } from '@/lib/chronicles/communitySubmissions';
import type { Magazine, MagazineIssue } from '@/lib/magazines/types';
import type { Product } from '@/lib/store/types';
import type { HubContentKind } from '@/lib/hub/contentTypes';
import { filterOutDeleted } from '@/lib/hub/deletedContent';

function itemTimestamp(item: {
  updatedAt?: string;
  publishDate?: string;
  submittedAt?: string;
  createdAt?: number;
}): number {
  if (typeof item.createdAt === 'number') return item.createdAt;
  const raw = item.updatedAt ?? item.publishDate ?? item.submittedAt ?? '';
  const ts = Date.parse(raw);
  return Number.isFinite(ts) ? ts : 0;
}

function mergeById<T extends { id: string }>(
  kind: HubContentKind,
  local: T[],
  remote: T[],
  extraFilter?: (item: T) => boolean,
): T[] {
  const byId = new Map<string, T>();
  for (const item of local) byId.set(item.id, item);
  for (const item of filterOutDeleted(kind, remote)) {
    if (extraFilter && !extraFilter(item)) continue;
    const existing = byId.get(item.id);
    if (!existing || itemTimestamp(item as never) >= itemTimestamp(existing as never)) {
      byId.set(item.id, item);
    }
  }
  return [...byId.values()].sort((a, b) => itemTimestamp(b as never) - itemTimestamp(a as never));
}

export function mergeVblogArticles(local: VBlogArticle[], remote: VBlogArticle[]): VBlogArticle[] {
  return mergeById('vblog', local, remote);
}

export function mergeTokenListings(local: PublishedTokenListing[], remote: PublishedTokenListing[]): PublishedTokenListing[] {
  return mergeById('tokens', local, remote);
}

export function mergeDirectoryListings(local: DirectoryListing[], remote: DirectoryListing[]): DirectoryListing[] {
  return mergeById('dapps', local, remote, (l) => l.status !== 'archived');
}

export function mergeChroniclesSubmissions(
  local: ChroniclesCommunitySubmission[],
  remote: ChroniclesCommunitySubmission[],
): ChroniclesCommunitySubmission[] {
  return mergeById('chronicles', local, remote, (s) => s.status !== 'archived');
}

export function mergeMagazines(local: Magazine[], remote: Magazine[]): Magazine[] {
  return mergeById('magazines', local, remote);
}

export function mergeMagazineIssues(local: MagazineIssue[], remote: MagazineIssue[]): MagazineIssue[] {
  return mergeById('magazineIssues', local, remote, (i) => i.status === 'published');
}

export function mergeStoreProducts(local: Product[], remote: Product[]): Product[] {
  return mergeById('store', local, remote, (p) => p.status === 'active');
}
