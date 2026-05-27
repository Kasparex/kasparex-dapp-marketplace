import { getInsApiBase, isInsEnabled } from './config';
import { normalizeEvmAddress, normalizeInsName } from './utils';

export type InsTenure = 'forever' | 'annual';

export type InsClientOptions = {
  baseUrl?: string;
};

export type InsResolveResponse = {
  exists: boolean;
  name?: string;
  label?: string;
  tld?: string;
  address?: string;
  owner?: string;
  tenure?: InsTenure | string;
  expires_at?: string | null;
  registry_version?: string;
  tokenId?: string;
  [k: string]: unknown;
};

export type InsReverseResponse = {
  address?: string;
  primary?: string | null;
  primary_version?: string;
  primaries?: Record<string, string | null>;
  [k: string]: unknown;
};

export type InsOwnedName = {
  name: string;
  label: string;
  tenure?: InsTenure | string;
  expires_at?: string | null;
  tokenId?: string;
  registry_version?: string;
  [k: string]: unknown;
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const isBrowser = typeof window !== 'undefined';
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.headers || {}),
    },
    ...(isBrowser ? {} : { next: { revalidate: 60 } }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`INS request failed (${res.status}): ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

function buildInsUrls(
  isBrowser: boolean,
  directBaseUrl: string,
  endpoint: 'resolve' | 'reverse' | 'names/by-owner',
  params: Record<string, string>,
): { primary: string; fallback: string } {
  const upstream = new URL(`/${endpoint}`, directBaseUrl.endsWith('/') ? directBaseUrl : `${directBaseUrl}/`);
  const proxy = new URL(`/api/ins/${endpoint}`, isBrowser ? window.location.origin : 'http://localhost');
  for (const [key, value] of Object.entries(params)) {
    upstream.searchParams.set(key, value);
    proxy.searchParams.set(key, value);
  }
  return { primary: proxy.toString(), fallback: upstream.toString() };
}

async function fetchIns<T>(
  isBrowser: boolean,
  directBaseUrl: string,
  endpoint: 'resolve' | 'reverse' | 'names/by-owner',
  params: Record<string, string>,
): Promise<T> {
  const { primary, fallback } = buildInsUrls(isBrowser, directBaseUrl, endpoint, params);
  if (isBrowser) {
    try {
      return await fetchJson<T>(primary);
    } catch {
      return await fetchJson<T>(fallback);
    }
  }
  return await fetchJson<T>(fallback);
}

export function extractPrimaryFromReverse(data: InsReverseResponse | null | undefined): string | null {
  if (!data) return null;
  if (data.primary) return normalizeInsName(String(data.primary));

  const primaries = data.primaries;
  if (primaries && typeof primaries === 'object') {
    const label =
      primaries.igra_v2 ??
      primaries.igra ??
      primaries.ins ??
      primaries.ikas ??
      null;
    if (label && typeof label === 'string' && label.trim()) {
      return normalizeInsName(label.trim());
    }
  }
  return null;
}

function parseOwnedNames(data: unknown): InsOwnedName[] {
  let items: unknown[] = [];
  if (Array.isArray(data)) {
    items = data;
  } else if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.names)) items = obj.names;
    else if (Array.isArray(obj.domains)) items = obj.domains;
    else if (Array.isArray(obj.data)) items = obj.data;
  }

  return items.map(normalizeOwnedName).filter(Boolean) as InsOwnedName[];
}

function normalizeOwnedName(raw: unknown): InsOwnedName | null {
  if (typeof raw === 'string') {
    const full = normalizeInsName(raw.trim());
    if (!full) return null;
    return { name: full, label: stripLabel(full, {}) };
  }
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  const labelOnly = typeof item.label === 'string' ? item.label.trim() : '';
  const name =
    (typeof item.name === 'string' && item.name) ||
    (typeof item.fullName === 'string' && item.fullName) ||
    (typeof item.full_name === 'string' && item.full_name) ||
    (typeof item.domain === 'string' && item.domain) ||
    (labelOnly ? `${labelOnly}.igra` : null);
  if (!name) return null;
  const full = normalizeInsName(name);
  return {
    name: full,
    label: stripLabel(full, item),
    tenure: (item.tenure as InsTenure | string | undefined) ?? undefined,
    expires_at: (item.expires_at as string | null | undefined) ?? (item.expiresAt as string | null | undefined) ?? null,
    tokenId: String(item.tokenId ?? item.token_id ?? ''),
    registry_version: (item.registry_version as string | undefined) ?? (item.registryVersion as string | undefined),
    ...item,
  };
}

function stripLabel(fullName: string, item: Record<string, unknown>): string {
  if (typeof item.label === 'string' && item.label) return item.label.toLowerCase();
  const lower = fullName.toLowerCase();
  return lower.endsWith('.igra') ? lower.slice(0, -5) : lower;
}

function pickInsDisplayName(primary: string | null, owned: InsOwnedName[]): string | null {
  if (primary) return primary.toLowerCase();
  if (owned.length === 0) return null;
  const sorted = [...owned].sort((a, b) => a.name.localeCompare(b.name));
  return sorted[0]?.name?.toLowerCase() ?? null;
}

export function createInsClient(opts?: InsClientOptions) {
  const directBaseUrl =
    (opts?.baseUrl && opts.baseUrl.trim()) || getInsApiBase();

  const isBrowser = typeof window !== 'undefined';

  return {
    baseUrl: directBaseUrl,
    enabled: isInsEnabled(),

    async resolveName(name: string): Promise<InsResolveResponse | null> {
      if (!isInsEnabled()) return null;
      const normalized = normalizeInsName(name);
      try {
        return await fetchIns<InsResolveResponse>(isBrowser, directBaseUrl, 'resolve', { name: normalized });
      } catch {
        return null;
      }
    },

    async getNamesByOwner(ownerAddress: string): Promise<InsOwnedName[]> {
      if (!isInsEnabled()) return [];
      const address = normalizeEvmAddress(ownerAddress);
      if (!address.startsWith('0x')) return [];
      try {
        const data = await fetchIns<unknown>(isBrowser, directBaseUrl, 'names/by-owner', { address });
        return parseOwnedNames(data);
      } catch {
        return [];
      }
    },

    async getPrimaryNameByOwner(ownerAddress: string): Promise<InsReverseResponse | null> {
      if (!isInsEnabled()) return null;
      const address = normalizeEvmAddress(ownerAddress);
      if (!address.startsWith('0x')) return null;
      try {
        const data = await fetchIns<InsReverseResponse>(isBrowser, directBaseUrl, 'reverse', { address });
        let primary = extractPrimaryFromReverse(data);
        if (!primary) {
          const owned = await this.getNamesByOwner(address);
          primary = pickInsDisplayName(null, owned);
        }
        return { ...data, primary };
      } catch {
        try {
          const owned = await this.getNamesByOwner(address);
          const primary = pickInsDisplayName(null, owned);
          if (primary) return { address, primary };
        } catch {
          // ignore
        }
        return null;
      }
    },
  };
}
