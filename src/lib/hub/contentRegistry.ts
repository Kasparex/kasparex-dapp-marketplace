import { promises as fs } from 'fs';
import path from 'path';
import { unstable_cache } from 'next/cache';
import { fetchJSON } from '@/lib/ipfs/gateway';
import {
  EMPTY_HUB_CONTENT_REGISTRY,
  type HubContentKind,
  type HubContentRegistry,
} from '@/lib/hub/contentTypes';

const REGISTRY_FILE = path.join(process.cwd(), 'data', 'hub-content.json');

let memoryRegistry: HubContentRegistry | null = null;
let memoryLoadedAt = 0;

function normalizeRegistry(raw: unknown): HubContentRegistry {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_HUB_CONTENT_REGISTRY };
  const data = raw as Partial<HubContentRegistry>;
  return {
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : new Date().toISOString(),
    vblog: Array.isArray(data.vblog) ? data.vblog : [],
    tokens: Array.isArray(data.tokens) ? data.tokens : [],
    dapps: Array.isArray(data.dapps) ? data.dapps : [],
    chronicles: Array.isArray(data.chronicles) ? data.chronicles : [],
  };
}

async function readRegistryFile(): Promise<HubContentRegistry> {
  try {
    const raw = await fs.readFile(REGISTRY_FILE, 'utf8');
    return normalizeRegistry(JSON.parse(raw));
  } catch {
    return { ...EMPTY_HUB_CONTENT_REGISTRY };
  }
}

async function fetchArchiveRegistry(): Promise<HubContentRegistry> {
  const cid = process.env.NEXT_PUBLIC_HUB_CONTENT_REGISTRY_CID?.trim();
  if (!cid) return { ...EMPTY_HUB_CONTENT_REGISTRY };
  try {
    const data = await fetchJSON<HubContentRegistry>(cid, { timeout: 8000 });
    return normalizeRegistry(data);
  } catch {
    return { ...EMPTY_HUB_CONTENT_REGISTRY };
  }
}

async function updateFileViaGitHub(data: HubContentRegistry): Promise<boolean> {
  const githubToken = process.env.GITHUB_TOKEN;
  const repoOwner = process.env.GITHUB_REPO_OWNER || 'Kasparex';
  const repoName = process.env.GITHUB_REPO_NAME || 'kasparex-dapp-marketplace';
  if (!githubToken) return false;

  try {
    const getFileResponse = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/contents/data/hub-content.json`,
      {
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      },
    );

    let sha: string | undefined;
    if (getFileResponse.ok) {
      const fileData = (await getFileResponse.json()) as { sha?: string };
      sha = fileData.sha;
    }

    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
    const updateResponse = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/contents/data/hub-content.json`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Sync hub content: ${data.updatedAt}`,
          content,
          sha,
        }),
      },
    );
    return updateResponse.ok;
  } catch (e) {
    console.error('[hub/contentRegistry] GitHub update failed', e);
    return false;
  }
}

async function persistRegistry(data: HubContentRegistry): Promise<void> {
  memoryRegistry = data;
  memoryLoadedAt = Date.now();

  const githubOk = await updateFileViaGitHub(data);
  if (!githubOk) {
    try {
      const dir = path.dirname(REGISTRY_FILE);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(REGISTRY_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.warn('[hub/contentRegistry] local file persist failed', e);
    }
  }
}

function mergeRegistries(...sources: HubContentRegistry[]): HubContentRegistry {
  const merged: HubContentRegistry = {
    updatedAt: new Date(0).toISOString(),
    vblog: [],
    tokens: [],
    dapps: [],
    chronicles: [],
  };

  const kinds: HubContentKind[] = ['vblog', 'tokens', 'dapps', 'chronicles'];
  for (const kind of kinds) {
    const byId = new Map<string, (typeof merged)[typeof kind][number]>();
    for (const source of sources) {
      for (const item of source[kind] as Array<{ id: string; updatedAt?: string; publishDate?: string; submittedAt?: string }>) {
        const existing = byId.get(item.id);
        const itemTs = Date.parse(item.updatedAt ?? item.publishDate ?? item.submittedAt ?? '');
        const existingTs = existing
          ? Date.parse(
              (existing as { updatedAt?: string; publishDate?: string; submittedAt?: string }).updatedAt ??
                (existing as { publishDate?: string }).publishDate ??
                (existing as { submittedAt?: string }).submittedAt ??
                '',
            )
          : 0;
        if (!existing || itemTs >= existingTs) byId.set(item.id, item as never);
      }
    }
    merged[kind] = [...byId.values()] as never;
  }

  const latest = sources.reduce((max, s) => {
    const ts = Date.parse(s.updatedAt);
    return ts > max ? ts : max;
  }, 0);
  merged.updatedAt = latest > 0 ? new Date(latest).toISOString() : new Date().toISOString();
  return merged;
}

async function loadRegistryUncached(): Promise<HubContentRegistry> {
  if (memoryRegistry && Date.now() - memoryLoadedAt < 30_000) {
    return memoryRegistry;
  }

  const [file, archive] = await Promise.all([readRegistryFile(), fetchArchiveRegistry()]);
  const merged = mergeRegistries(archive, file, memoryRegistry ?? EMPTY_HUB_CONTENT_REGISTRY);
  memoryRegistry = merged;
  memoryLoadedAt = Date.now();
  return merged;
}

export const getCachedHubContentRegistry = unstable_cache(
  async () => loadRegistryUncached(),
  ['kasparex-hub-content-v1'],
  { revalidate: 30, tags: ['hub-content'] },
);

export async function getHubContentRegistry(): Promise<HubContentRegistry> {
  return loadRegistryUncached();
}

function upsertItem<T extends { id: string }>(list: T[], item: T): T[] {
  const idx = list.findIndex((x) => x.id === item.id);
  if (idx < 0) return [item, ...list];
  const next = [...list];
  next[idx] = item;
  return next;
}

export async function upsertHubContentItem(kind: HubContentKind, item: { id: string }): Promise<HubContentRegistry> {
  const registry = await getHubContentRegistry();
  const next: HubContentRegistry = {
    ...registry,
    updatedAt: new Date().toISOString(),
    [kind]: upsertItem(registry[kind] as Array<{ id: string }>, item) as never,
  };
  await persistRegistry(next);
  return next;
}

export async function deleteHubContentItem(kind: HubContentKind, id: string): Promise<HubContentRegistry> {
  const registry = await getHubContentRegistry();
  const next: HubContentRegistry = {
    ...registry,
    updatedAt: new Date().toISOString(),
    [kind]: (registry[kind] as Array<{ id: string }>).filter((x) => x.id !== id) as never,
  };
  await persistRegistry(next);
  return next;
}

export function registerHubContentInMemory(kind: HubContentKind, item: { id: string }): void {
  const base = memoryRegistry ?? { ...EMPTY_HUB_CONTENT_REGISTRY };
  memoryRegistry = {
    ...base,
    updatedAt: new Date().toISOString(),
    [kind]: upsertItem(base[kind] as Array<{ id: string }>, item) as never,
  };
  memoryLoadedAt = Date.now();
}

export function removeHubContentFromMemory(kind: HubContentKind, id: string): void {
  if (!memoryRegistry) return;
  memoryRegistry = {
    ...memoryRegistry,
    updatedAt: new Date().toISOString(),
    [kind]: (memoryRegistry[kind] as Array<{ id: string }>).filter((x) => x.id !== id) as never,
  };
  memoryLoadedAt = Date.now();
}
