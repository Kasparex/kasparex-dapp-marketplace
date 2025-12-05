/**
 * Decentralized Asset Resolver
 * 
 * Resolves assets from decentralized storage with intelligent fallback chain
 * Priority: Krex Nodes → Storacha → IPFS/Pinata → Public IPFS → R2 → Cloudflare Pages
 */

import { getKrexNodeUrls, checkAvailability } from "./krex-nodes";

export interface AssetSource {
  cid: string;
  storachaUrl: string;
  ipfsUrl: string;
  krexNodeUrls: string[];
  cloudflareFallback: string;
}

/**
 * Resolve asset from decentralized storage with intelligent fallback
 * 
 * Priority order (cost-optimized):
 * 1. Krex Nodes (nearest region) - FREE, community-powered
 * 2. Storacha - FREE tier
 * 3. IPFS/Pinata - $20/month (paid gateway)
 * 4. Public IPFS Gateway - FREE (slower)
 * 5. Cloudflare R2 - $0.015/GB (backup storage)
 * 6. Cloudflare Pages - FREE (last resort, static fallback)
 */
export async function resolveAsset(cid: string, fallbackPath?: string): Promise<string> {
  const pinataUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
  const storachaUrl = `https://storacha.network/ipfs/${cid}`;
  const ipfsUrl = `https://ipfs.io/ipfs/${cid}`;
  const krexNodeUrls = await getKrexNodeUrls(cid);
  const cloudflareFallback = fallbackPath || `/assets/${cid}`;

  // Try sources in priority order
  const urls = [
    ...krexNodeUrls,     // 1. Krex Nodes (community-powered, FREE)
    storachaUrl,         // 2. Storacha Network (FREE)
    pinataUrl,           // 3. Pinata gateway (paid, but reliable)
    ipfsUrl,             // 4. Public IPFS gateway (FREE, slower)
    cloudflareFallback,  // 5. Cloudflare Pages (last resort)
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
  const pinataUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
  const storachaUrl = `https://storacha.network/ipfs/${cid}`;
  const ipfsUrl = `https://ipfs.io/ipfs/${cid}`;
  const krexNodeUrls = await getKrexNodeUrls(cid);
  const cloudflareFallback = `/assets/${cid}`;

  return {
    cid,
    pinataUrl,
    storachaUrl,
    ipfsUrl,
    krexNodeUrls,
    cloudflareFallback,
  };
}



