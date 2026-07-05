import type { HubContentRegistry } from '@/lib/hub/contentTypes';
import { HUB_CONTENT_KINDS, type HubContentKind } from '@/lib/hub/contentTypes';
import { importRemoteArticles } from '@/lib/vblog/data';
import { importRemoteListings } from '@/lib/tokens/data';
import { importRemoteDirectoryListings } from '@/lib/dapps/listingSubmissions';
import { importRemoteChroniclesSubmissions } from '@/lib/chronicles/communitySubmissions';
import { importRemoteMagazineCatalog } from '@/lib/magazines/data';
import { importRemoteStoreProducts } from '@/lib/store/hubSync';
import {
  markHubVisibilityRefreshed,
  shouldSkipHubVisibilityRefresh,
} from '@/lib/hub/mobileLight';

function importHubKindItems(kind: HubContentKind, items: unknown[]): void {
  if (!items.length) return;
  switch (kind) {
    case 'vblog':
      importRemoteArticles(items as never);
      break;
    case 'tokens':
      importRemoteListings(items as never);
      break;
    case 'dapps':
      importRemoteDirectoryListings(items as never);
      break;
    case 'chronicles':
      importRemoteChroniclesSubmissions(items as never);
      break;
    case 'magazines':
    case 'magazineIssues':
      break;
    case 'store':
      importRemoteStoreProducts(items as never);
      break;
    default:
      break;
  }
}

function importMagazineKinds(magazines: unknown[], magazineIssues: unknown[]): void {
  if (!magazines.length && !magazineIssues.length) return;
  importRemoteMagazineCatalog(magazines as never, magazineIssues as never);
}

export async function fetchHubContentByKind(kind: HubContentKind): Promise<unknown[] | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch(`/api/hub/content?kind=${encodeURIComponent(kind)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = (await res.json()) as { ok?: boolean; items?: unknown[] };
    return json.ok && Array.isArray(json.items) ? json.items : null;
  } catch {
    return null;
  }
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

const bootstrapByKey = new Map<string, Promise<HubContentRegistry | null>>();

function bootstrapCacheKey(kinds: HubContentKind[]): string {
  return [...kinds].sort().join(',');
}

async function loadAndImportKinds(kinds: HubContentKind[]): Promise<HubContentRegistry | null> {
  const unique = [...new Set(kinds)];
  const wantsMagazines = unique.includes('magazines') || unique.includes('magazineIssues');
  const nonMagazineKinds = unique.filter((k) => k !== 'magazines' && k !== 'magazineIssues');

  let magazineItems: unknown[] = [];
  let issueItems: unknown[] = [];

  if (nonMagazineKinds.length === 0 && wantsMagazines) {
    const [magazines, issues] = await Promise.all([
      fetchHubContentByKind('magazines'),
      fetchHubContentByKind('magazineIssues'),
    ]);
    magazineItems = magazines ?? [];
    issueItems = issues ?? [];
    importMagazineKinds(magazineItems, issueItems);
    return {
      updatedAt: new Date().toISOString(),
      vblog: [],
      tokens: [],
      dapps: [],
      chronicles: [],
      magazines: magazineItems as never,
      magazineIssues: issueItems as never,
      store: [],
    };
  }

  const results = await Promise.all(nonMagazineKinds.map((kind) => fetchHubContentByKind(kind)));

  nonMagazineKinds.forEach((kind, index) => {
    const items = results[index];
    if (items) importHubKindItems(kind, items);
  });

  if (wantsMagazines) {
    const [magazines, issues] = await Promise.all([
      fetchHubContentByKind('magazines'),
      fetchHubContentByKind('magazineIssues'),
    ]);
    magazineItems = magazines ?? [];
    issueItems = issues ?? [];
    importMagazineKinds(magazineItems, issueItems);
  }

  return {
    updatedAt: new Date().toISOString(),
    vblog: [],
    tokens: [],
    dapps: [],
    chronicles: [],
    magazines: magazineItems as never,
    magazineIssues: issueItems as never,
    store: [],
  };
}

/** Fetch hub content for the given kinds (per-kind API) and merge into local storage. */
export async function bootstrapHubContent(
  kinds: HubContentKind[] = HUB_CONTENT_KINDS,
): Promise<HubContentRegistry | null> {
  if (typeof window === 'undefined') return null;
  const key = bootstrapCacheKey(kinds);
  const existing = bootstrapByKey.get(key);
  if (existing) return existing;

  const promise = loadAndImportKinds(kinds);
  bootstrapByKey.set(key, promise);
  return promise;
}

export function resetHubContentBootstrap(kinds?: HubContentKind[]): void {
  if (!kinds) {
    bootstrapByKey.clear();
    return;
  }
  bootstrapByKey.delete(bootstrapCacheKey(kinds));
}

export async function pullAndMergeHubContent(
  kinds: HubContentKind[] = HUB_CONTENT_KINDS,
): Promise<HubContentRegistry | null> {
  resetHubContentBootstrap(kinds);
  return bootstrapHubContent(kinds);
}

/** Re-fetch hub content when the tab becomes visible (desktop only, throttled). */
export function onHubContentVisibilityRefresh(
  refresh: () => void | Promise<void>,
  kinds: HubContentKind[] = HUB_CONTENT_KINDS,
): () => void {
  if (typeof document === 'undefined') return () => {};
  const handler = () => {
    if (document.visibilityState !== 'visible') return;
    if (shouldSkipHubVisibilityRefresh()) return;
    markHubVisibilityRefreshed();
    void pullAndMergeHubContent(kinds).then(() => refresh());
  };
  document.addEventListener('visibilitychange', handler);
  return () => document.removeEventListener('visibilitychange', handler);
}
