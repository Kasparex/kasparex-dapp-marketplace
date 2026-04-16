export type KnsNetwork = 'mainnet' | 'tn10';

export type KnsClientOptions = {
  network?: KnsNetwork;
  baseUrl?: string;
};

function ensureKaspaPrefix(address: string): string {
  const v = String(address || '').trim();
  if (!v) return v;
  return v.toLowerCase().startsWith('kaspa:') ? v : `kaspa:${v.replace(/^kaspa:/i, '')}`;
}

function getDefaultBaseUrl(network: KnsNetwork): string {
  // Documented servers: https://api.knsdomains.org/mainnet , https://api.knsdomains.org/tn10
  return `https://api.knsdomains.org/${network}`;
}

function getNetworkFromEnv(): KnsNetwork {
  const raw = String(process.env.NEXT_PUBLIC_KNS_NETWORK || '').trim().toLowerCase();
  if (raw === 'tn10' || raw === 'testnet' || raw === 'testnet-10') return 'tn10';
  return 'mainnet';
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    // KNS is a public indexer; cache lightly to avoid rate spikes on profile views.
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`KNS request failed (${res.status}): ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

export type KnsAsset = {
  inscriptionId?: string;
  inscription_id?: string;
  assetId?: string;
  asset_id?: string;
  domain?: string;
  owner?: string;
  mimetype?: string;
  verified?: boolean;
  [k: string]: unknown;
};

export type KnsPrimaryNameResponse = {
  primaryName?: string;
  primary_name?: string;
  domain?: string;
  inscriptionId?: string;
  inscription_id?: string;
  [k: string]: unknown;
};

export type KnsDomainOwnerResponse = {
  owner?: string;
  ownerAddress?: string;
  owner_address?: string;
  [k: string]: unknown;
};

export type KnsDomainProfileResponse = {
  website?: string;
  avatar?: string;
  banner?: string;
  bio?: string;
  x?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  github?: string;
  email?: string;
  [k: string]: unknown;
};

export function createKnsClient(opts?: KnsClientOptions) {
  const network = opts?.network || getNetworkFromEnv();
  const baseUrl =
    (opts?.baseUrl && opts.baseUrl.trim()) ||
    (process.env.NEXT_PUBLIC_KNS_API_BASE && String(process.env.NEXT_PUBLIC_KNS_API_BASE).trim()) ||
    getDefaultBaseUrl(network);

  return {
    network,
    baseUrl,

    async getAssetsByOwner(ownerAddress: string): Promise<KnsAsset[]> {
      const url = new URL('/api/v1/assets', baseUrl);
      // KNS expects `kaspa:`-prefixed owner address (confirmed via live API).
      url.searchParams.set('owner', ensureKaspaPrefix(ownerAddress));
      const data = await fetchJson<any>(url.toString());
      // Supported shapes:
      // - { success: true, data: { assets: [...], pagination: {...} } }
      // - { assets: [...] }
      // - [ ... ]
      if (Array.isArray(data)) return data as KnsAsset[];
      if (data?.data?.assets && Array.isArray(data.data.assets)) return data.data.assets as KnsAsset[];
      if (data?.assets && Array.isArray(data.assets)) return data.assets as KnsAsset[];
      return [];
    },

    async getDomainOwner(domain: string): Promise<KnsDomainOwnerResponse> {
      // Domains must be URL-encoded (per KNS docs). The endpoint is /api/v1/{domain}/owner.
      const encoded = encodeURIComponent(domain);
      const url = new URL(`/api/v1/${encoded}/owner`, baseUrl);
      const data = await fetchJson<any>(url.toString());
      // Supported shapes:
      // - { success: true, data: { ownerAddress: 'kaspa:...' } }
      // - { ownerAddress: '...' } / { owner: '...' }
      if (data?.data && typeof data.data === 'object') return data.data as KnsDomainOwnerResponse;
      return data as KnsDomainOwnerResponse;
    },

    async getPrimaryNameByOwner(ownerAddress: string): Promise<KnsPrimaryNameResponse | null> {
      const encoded = encodeURIComponent(ensureKaspaPrefix(ownerAddress));
      const url = new URL(`/api/v1/primary-name/${encoded}`, baseUrl);
      try {
        const data = await fetchJson<any>(url.toString());
        // Supported shapes:
        // - { success: true, data: { ownerAddress, inscriptionId, domain: { fullName } } }
        // - legacy flat shapes
        if (data?.data && typeof data.data === 'object') return data.data as KnsPrimaryNameResponse;
        return data as KnsPrimaryNameResponse;
      } catch {
        return null;
      }
    },

    async getDomainProfileByAssetId(assetId: string): Promise<KnsDomainProfileResponse | null> {
      const encoded = encodeURIComponent(assetId);
      const url = new URL(`/api/v1/domain/${encoded}/profile`, baseUrl);
      try {
        return await fetchJson<KnsDomainProfileResponse>(url.toString());
      } catch {
        return null;
      }
    },
  };
}

