import type { VBlogArticle } from '@/lib/vblog/types';
import type { PublishedTokenListing } from '@/lib/tokens/listingRecord';
import type { DirectoryListing } from '@/lib/dapps/listingSubmissions';
import type { ChroniclesCommunitySubmission } from '@/lib/chronicles/communitySubmissions';
import type { HubContentKind, HubContentRegistry } from '@/lib/hub/contentTypes';

function itemTimestamp(item: { updatedAt?: string; publishDate?: string; submittedAt?: string }): number {
  const raw = item.updatedAt ?? item.publishDate ?? item.submittedAt ?? '';
  const ts = Date.parse(raw);
  return Number.isFinite(ts) ? ts : 0;
}

function mergeById<T extends { id: string; updatedAt?: string; publishDate?: string; submittedAt?: string }>(
  local: T[],
  remote: T[],
): T[] {
  const byId = new Map<string, T>();
  for (const item of local) byId.set(item.id, item);
  for (const item of remote) {
    const existing = byId.get(item.id);
    if (!existing || itemTimestamp(item) >= itemTimestamp(existing)) {
      byId.set(item.id, item);
    }
  }
  return [...byId.values()].sort((a, b) => itemTimestamp(b) - itemTimestamp(a));
}

export function mergeVblogArticles(local: VBlogArticle[], remote: VBlogArticle[]): VBlogArticle[] {
  return mergeById(local, remote);
}

export function mergeTokenListings(
  local: PublishedTokenListing[],
  remote: PublishedTokenListing[],
): PublishedTokenListing[] {
  return mergeById(local, remote);
}

export function mergeDirectoryListings(local: DirectoryListing[], remote: DirectoryListing[]): DirectoryListing[] {
  return mergeById(local, remote);
}

export function mergeChroniclesSubmissions(
  local: ChroniclesCommunitySubmission[],
  remote: ChroniclesCommunitySubmission[],
): ChroniclesCommunitySubmission[] {
  const merged = mergeById(local, remote);
  return merged.filter((s) => s.status !== 'archived');
}

export async function fetchHubContentRegistry(): Promise<HubContentRegistry | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch('/api/hub/content', { cache: 'no-store' });
    if (!res.ok) return null;
    const json = (await res.json()) as { ok?: boolean; registry?: HubContentRegistry };
    return json.ok && json.registry ? json.registry : null;
  } catch {
    return null;
  }
}

export async function syncHubContentItem(
  kind: HubContentKind,
  op: 'upsert' | 'delete',
  payload: { item?: unknown; id?: string; commitTxHash?: string },
): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await fetch('/api/hub/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, op, ...payload }),
    });
  } catch (e) {
    console.warn(`[hub/contentSync] ${kind} ${op} failed`, e);
  }
}

export async function pullAndMergeHubContent(): Promise<{
  vblog: VBlogArticle[];
  tokens: PublishedTokenListing[];
  dapps: DirectoryListing[];
  chronicles: ChroniclesCommunitySubmission[];
} | null> {
  const registry = await fetchHubContentRegistry();
  if (!registry) return null;
  return {
    vblog: registry.vblog,
    tokens: registry.tokens,
    dapps: registry.dapps,
    chronicles: registry.chronicles,
  };
}

/** Re-fetch hub content when the tab becomes visible again (keeps mobile in sync). */
export function onHubContentVisibilityRefresh(refresh: () => void): () => void {
  if (typeof document === 'undefined') return () => {};
  const handler = () => {
    if (document.visibilityState === 'visible') void refresh();
  };
  document.addEventListener('visibilitychange', handler);
  return () => document.removeEventListener('visibilitychange', handler);
}
