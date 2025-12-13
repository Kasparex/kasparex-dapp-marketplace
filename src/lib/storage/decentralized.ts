/**
 * Decentralized Storage Service
 * 
 * Handles uploading and resolving assets from Storacha, IPFS, and KREX Nodes
 * with intelligent fallback chain for maximum availability and cost reduction
 */

export interface AssetSource {
  cid: string;
  storachaUrl: string;
  ipfsUrl: string;
  krexNodeUrls: string[];
  vercelFallback: string;
}

export interface UploadResult {
  cid: string;
  storachaUrl: string;
  ipfsUrl: string;
  size: number;
}

/**
 * Upload file to Storacha Network (primary decentralized storage)
 */
export async function uploadToStoracha(
  file: File | Blob,
  options?: { filename?: string; pin?: boolean }
): Promise<UploadResult> {
  const apiKey = process.env.NEXT_PUBLIC_STORACHA_API_KEY;
  
  if (!apiKey) {
    throw new Error('Storacha API key not configured');
  }

  const formData = new FormData();
  formData.append('file', file, options?.filename);

  const response = await fetch('https://api.storacha.network/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Storacha upload failed: ${response.statusText}`);
  }

  const data = await response.json();
  const cid = data.cid || data.IpfsHash;

  return {
    cid,
    storachaUrl: `https://storacha.network/ipfs/${cid}`,
    ipfsUrl: `https://ipfs.io/ipfs/${cid}`,
    size: file.size,
  };
}

/**
 * Upload JSON data to Storacha
 */
export async function uploadJSONToStoracha(
  data: Record<string, unknown>,
  options?: { pin?: boolean }
): Promise<UploadResult> {
  const apiKey = process.env.NEXT_PUBLIC_STORACHA_API_KEY;
  
  if (!apiKey) {
    throw new Error('Storacha API key not configured');
  }

  const response = await fetch('https://api.storacha.network/upload/json', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pin: options?.pin !== false,
      content: data,
    }),
  });

  if (!response.ok) {
    throw new Error(`Storacha JSON upload failed: ${response.statusText}`);
  }

  const result = await response.json();
  const cid = result.cid || result.IpfsHash;

  return {
    cid,
    storachaUrl: `https://storacha.network/ipfs/${cid}`,
    ipfsUrl: `https://ipfs.io/ipfs/${cid}`,
    size: JSON.stringify(data).length,
  };
}

// Import from krex-nodes.ts
import { getKrexNodeUrls, checkAvailability } from './krex-nodes';

/**
 * Resolve asset from decentralized storage with intelligent fallback
 * 
 * Priority order (cost-optimized):
 * 1. Krex Nodes (nearest region) - FREE, community-powered
 * 2. Storacha - FREE tier
 * 3. IPFS/Pinata - $20/month (paid gateway)
 * 4. Public IPFS Gateway - FREE (slower)
 * 5. Vercel Edge Network - FREE (last resort)
 */
export async function resolveAsset(cid: string, fallbackPath?: string): Promise<string> {
  const pinataUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
  const storachaUrl = `https://storacha.network/ipfs/${cid}`;
  const ipfsUrl = `https://ipfs.io/ipfs/${cid}`;
  const krexNodeUrls = await getKrexNodeUrls(cid);
  const vercelFallback = fallbackPath || `/assets/${cid}`;

  const sources: AssetSource = {
    cid,
    storachaUrl,
    ipfsUrl,
    krexNodeUrls,
    vercelFallback,
  };

  // Try sources in priority order
  const urls = [
    ...krexNodeUrls,     // 1. Krex Nodes (community-powered, FREE)
    storachaUrl,         // 2. Storacha Network (FREE)
    pinataUrl,           // 3. Pinata gateway (paid, but reliable)
    ipfsUrl,             // 4. Public IPFS gateway (FREE, slower)
    vercelFallback,      // 5. Vercel Edge Network (FREE, last resort)
  ];

  for (const url of urls) {
    if (await checkAvailability(url)) {
      return url;
    }
  }

  // If all fail, return Pinata URL anyway (browser will handle error)
  return pinataUrl;
}

/**
 * Batch resolve multiple assets (for performance)
 */
export async function resolveAssets(
  cids: string[],
  fallbackPaths?: Record<string, string>
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  // Resolve in parallel (but limit concurrency)
  const batchSize = 5;
  for (let i = 0; i < cids.length; i += batchSize) {
    const batch = cids.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(cid => 
        resolveAsset(cid, fallbackPaths?.[cid])
          .then(url => ({ cid, url }))
          .catch(() => ({ cid, url: fallbackPaths?.[cid] || `/assets/${cid}` }))
      )
    );

    batchResults.forEach(({ cid, url }) => {
      results[cid] = url;
    });
  }

  return results;
}

/**
 * Get asset source information (for debugging/monitoring)
 */
export async function getAssetSources(cid: string): Promise<AssetSource & { pinataUrl: string }> {
  return {
    cid,
    pinataUrl: `https://gateway.pinata.cloud/ipfs/${cid}`,
    storachaUrl: `https://storacha.network/ipfs/${cid}`,
    ipfsUrl: `https://ipfs.io/ipfs/${cid}`,
    krexNodeUrls: await getKrexNodeUrls(cid),
    vercelFallback: `/assets/${cid}`,
  };
}

