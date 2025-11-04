/**
 * Kaspa Network API Service
 * 
 * Service for fetching Kaspa network information from REST API
 * References:
 * - https://api-tn10.kaspa.org/docs
 * - https://github.com/kaspa-ng/kaspa-rest-server
 */

import type { KaspaNetworkInfo, KaspaBlock, KaspaNetworkStats } from './types';

// Kaspa REST API base URLs
const KASPA_API_BASE_URLS = [
  'https://api.kaspa.org',
  'https://api-tn10.kaspa.org', // Testnet
  'https://rest.kaspa.org',
];

const DEFAULT_API_BASE = KASPA_API_BASE_URLS[0];

/**
 * Fetch network information
 */
export async function fetchNetworkInfo(): Promise<KaspaNetworkInfo> {
  const endpointVariations = [
    '/api/v1/network/info',
    '/api/v1/info',
    '/v1/network/info',
    '/v1/info',
    '/network/info',
    '/info',
  ];

  for (const baseUrl of KASPA_API_BASE_URLS) {
    for (const endpoint of endpointVariations) {
      try {
        const url = `${baseUrl}${endpoint}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            cache: 'no-store',
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            return transformNetworkInfo(data);
          }
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name !== 'AbortError') {
            console.debug(`Failed to fetch from ${url}:`, fetchError);
          }
        }
      } catch (error) {
        console.debug(`Error fetching from ${baseUrl}${endpoint}:`, error);
      }
    }
  }

  throw new Error('Failed to fetch network info from all API endpoints');
}

/**
 * Fetch latest blocks
 */
export async function fetchLatestBlocks(limit: number = 20): Promise<KaspaBlock[]> {
  const endpointVariations = [
    `/api/v1/blocks?limit=${limit}`,
    `/api/v1/blocks/latest?limit=${limit}`,
    `/v1/blocks?limit=${limit}`,
    `/v1/blocks/latest?limit=${limit}`,
    `/blocks?limit=${limit}`,
  ];

  for (const baseUrl of KASPA_API_BASE_URLS) {
    for (const endpoint of endpointVariations) {
      try {
        const url = `${baseUrl}${endpoint}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            cache: 'no-store',
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            const blocks = Array.isArray(data) ? data : (data.blocks || data.data || []);
            return blocks.map(transformBlock);
          }
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name !== 'AbortError') {
            console.debug(`Failed to fetch from ${url}:`, fetchError);
          }
        }
      } catch (error) {
        console.debug(`Error fetching from ${baseUrl}${endpoint}:`, error);
      }
    }
  }

  return [];
}

/**
 * Fetch block by hash
 */
export async function fetchBlockByHash(hash: string): Promise<KaspaBlock | null> {
  const endpointVariations = [
    `/api/v1/blocks/${hash}`,
    `/v1/blocks/${hash}`,
    `/blocks/${hash}`,
  ];

  for (const baseUrl of KASPA_API_BASE_URLS) {
    for (const endpoint of endpointVariations) {
      try {
        const url = `${baseUrl}${endpoint}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            cache: 'no-store',
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            const block = data.block || data;
            return transformBlock(block);
          } else if (response.status === 404) {
            return null;
          }
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name !== 'AbortError') {
            console.debug(`Failed to fetch from ${url}:`, fetchError);
          }
        }
      } catch (error) {
        console.debug(`Error fetching from ${baseUrl}${endpoint}:`, error);
      }
    }
  }

  return null;
}

/**
 * Fetch network hashrate
 */
export async function fetchNetworkHashrate(): Promise<number | null> {
  try {
    const networkInfo = await fetchNetworkInfo();
    return networkInfo.hashrate || null;
  } catch (error) {
    console.error('Error fetching network hashrate:', error);
    return null;
  }
}

/**
 * Fetch supply information
 */
export async function fetchSupplyInfo(): Promise<{ supply: number; maxSupply: number } | null> {
  try {
    const networkInfo = await fetchNetworkInfo();
    if (networkInfo.supply !== undefined) {
      return {
        supply: networkInfo.supply,
        maxSupply: networkInfo.maxSupply || 0,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching supply info:', error);
    return null;
  }
}

/**
 * Fetch comprehensive network stats
 */
export async function fetchNetworkStats(): Promise<KaspaNetworkStats> {
  try {
    const [networkInfo, latestBlocks] = await Promise.all([
      fetchNetworkInfo(),
      fetchLatestBlocks(10),
    ]);

    return {
      networkInfo,
      latestBlocks,
      health: determineNetworkHealth(networkInfo),
      lastUpdated: Date.now(),
    };
  } catch (error) {
    console.error('Error fetching network stats:', error);
    throw error;
  }
}

/**
 * Transform API response to NetworkInfo
 */
function transformNetworkInfo(data: any): KaspaNetworkInfo {
  return {
    networkName: data.networkName || data.network || 'mainnet',
    blockHeight: data.blockHeight || data.height || data.blueScore,
    blueScore: data.blueScore || data.blockHeight || data.height,
    daaScore: data.daaScore || data.daa,
    hashrate: data.hashrate || data.hashRate || data.networkHashrate,
    difficulty: data.difficulty || data.daa,
    supply: data.supply || data.circulatingSupply || data.totalSupply,
    maxSupply: data.maxSupply || 28700000000, // Kaspa max supply
    nodeCount: data.nodeCount || data.nodes || data.peers,
    averageBlockTime: data.averageBlockTime || data.blockTime || 1,
    tps: data.tps || data.transactionsPerSecond,
    totalTransactions: data.totalTransactions || data.txCount,
  };
}

/**
 * Transform API response to Block
 */
function transformBlock(data: any): KaspaBlock {
  return {
    hash: data.hash || data.blockHash,
    height: data.height || data.blockHeight,
    blueScore: data.blueScore || data.height,
    daaScore: data.daaScore || data.daa,
    parents: data.parents || data.parentHashes || [],
    timestamp: data.timestamp || data.time,
    transactionCount: data.transactionCount || data.txCount || data.transactions?.length || 0,
    size: data.size || data.blockSize,
  };
}

/**
 * Determine network health status
 */
function determineNetworkHealth(info: KaspaNetworkInfo): 'healthy' | 'degraded' | 'down' {
  if (!info.blockHeight || !info.hashrate) {
    return 'down';
  }
  
  // Check if block height is recent (within last 5 minutes)
  // This is a simplified check - in reality, you'd check block timestamps
  if (info.averageBlockTime && info.averageBlockTime > 10) {
    return 'degraded';
  }

  return 'healthy';
}
