import type { HubContentRegistry } from '@/lib/hub/contentTypes';
import { importRemoteArticles } from '@/lib/vblog/data';
import { importRemoteListings } from '@/lib/tokens/data';
import { importRemoteDirectoryListings } from '@/lib/dapps/listingSubmissions';
import { importRemoteChroniclesSubmissions } from '@/lib/chronicles/communitySubmissions';
import { importRemoteMagazineCatalog } from '@/lib/magazines/data';
import { importRemoteStoreProducts } from '@/lib/store/hubSync';
import type { HubContentKind } from '@/lib/hub/contentTypes';

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
): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const res = await fetch('/api/hub/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, op, ...payload }),
    });
    const json = (await res.json()) as { ok?: boolean };
    return res.ok && json.ok === true;
  } catch (e) {
    console.warn(`[hub/contentSync] ${kind} ${op} failed`, e);
    return false;
  }
}

let bootstrapPromise: Promise<HubContentRegistry | null> | null = null;

/** Single registry fetch; imports all content kinds into local storage. */
export async function bootstrapHubContent(): Promise<HubContentRegistry | null> {
  if (typeof window === 'undefined') return null;
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const registry = await fetchHubContentRegistry();
      if (!registry) return null;
      if (registry.vblog.length) importRemoteArticles(registry.vblog);
      if (registry.tokens.length) importRemoteListings(registry.tokens);
      if (registry.dapps.length) importRemoteDirectoryListings(registry.dapps);
      if (registry.chronicles.length) importRemoteChroniclesSubmissions(registry.chronicles);
      if (registry.magazines.length || registry.magazineIssues.length) {
        importRemoteMagazineCatalog(registry.magazines, registry.magazineIssues);
      }
      if (registry.store.length) importRemoteStoreProducts(registry.store);
      return registry;
    })();
  }
  return bootstrapPromise;
}

export function resetHubContentBootstrap(): void {
  bootstrapPromise = null;
}

export async function pullAndMergeHubContent(): Promise<HubContentRegistry | null> {
  resetHubContentBootstrap();
  return bootstrapHubContent();
}

/** Re-fetch hub content when the tab becomes visible again (keeps mobile in sync). */
export function onHubContentVisibilityRefresh(refresh: () => void | Promise<void>): () => void {
  if (typeof document === 'undefined') return () => {};
  const handler = () => {
    if (document.visibilityState === 'visible') {
      void pullAndMergeHubContent().then(() => refresh());
    }
  };
  document.addEventListener('visibilitychange', handler);
  return () => document.removeEventListener('visibilitychange', handler);
}
