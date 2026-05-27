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

function parseOwnedNames(data: unknown): InsOwnedName[] {
  if (Array.isArray(data)) {
    return data.map(normalizeOwnedName).filter(Boolean) as InsOwnedName[];
  }
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.names)) {
      return obj.names.map(normalizeOwnedName).filter(Boolean) as InsOwnedName[];
    }
  }
  return [];
}

function normalizeOwnedName(raw: unknown): InsOwnedName | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  const name =
    (typeof item.name === 'string' && item.name) ||
    (typeof item.fullName === 'string' && item.fullName) ||
    (typeof item.full_name === 'string' && item.full_name) ||
    null;
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
        const url = isBrowser
          ? new URL(`${window.location.origin}/api/ins/resolve`)
          : new URL('/resolve', directBaseUrl);
        url.searchParams.set('name', normalized);
        return await fetchJson<InsResolveResponse>(url.toString());
      } catch {
        return null;
      }
    },

    async getPrimaryNameByOwner(ownerAddress: string): Promise<InsReverseResponse | null> {
      if (!isInsEnabled()) return null;
      const address = normalizeEvmAddress(ownerAddress);
      if (!address.startsWith('0x')) return null;
      try {
        const url = isBrowser
          ? new URL(`${window.location.origin}/api/ins/reverse`)
          : new URL('/reverse', directBaseUrl);
        url.searchParams.set('address', address);
        const data = await fetchJson<InsReverseResponse>(url.toString());
        const primary = data?.primary ? normalizeInsName(String(data.primary)) : null;
        return { ...data, primary };
      } catch {
        return null;
      }
    },

    async getNamesByOwner(ownerAddress: string): Promise<InsOwnedName[]> {
      if (!isInsEnabled()) return [];
      const address = normalizeEvmAddress(ownerAddress);
      if (!address.startsWith('0x')) return [];
      try {
        const url = isBrowser
          ? new URL(`${window.location.origin}/api/ins/names/by-owner`)
          : new URL('/names/by-owner', directBaseUrl);
        url.searchParams.set('address', address);
        const data = await fetchJson<unknown>(url.toString());
        return parseOwnedNames(data);
      } catch {
        return [];
      }
    },
  };
}
