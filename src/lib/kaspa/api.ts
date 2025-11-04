/**
 * Kaspa Network API Service
 * 
 * Service for fetching Kaspa network information from REST API
 * Uses Next.js API routes as proxies to avoid CORS issues
 * References:
 * - https://api-tn10.kaspa.org/docs
 * - https://github.com/kaspa-ng/kaspa-rest-server
 * - https://api.kas.fyi
 */

import type { KaspaNetworkInfo, KaspaBlock, KaspaNetworkStats } from './types';

/**
 * Fetch network information
 * Uses Next.js API route as proxy first, then falls back to direct calls
 */
export async function fetchNetworkInfo(): Promise<KaspaNetworkInfo> {
  // Try Next.js API route first (server-side proxy)
  try {
    const response = await fetch('/api/kaspa/network?endpoint=info', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        return transformNetworkInfo(result.data);
      }
    }
  } catch (error) {
    console.debug('Next.js API route failed, trying direct calls:', error);
  }

  // Fallback: Try alternative APIs
  const alternativeSources = [
    // Try kas.fyi API (known to work for addresses)
    async () => {
      try {
        const response = await fetch('https://api.kas.fyi/v1/network/stats', {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          cache: 'no-store',
        });
        if (response.ok) {
          const data = await response.json();
          return transformNetworkInfo(data);
        }
      } catch (e) {
        console.debug('kas.fyi network stats failed:', e);
      }
      return null;
    },
    // Try kaspa.org explorer API
    async () => {
      try {
        const response = await fetch('https://api.kaspa.org/info', {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          cache: 'no-store',
        });
        if (response.ok) {
          const data = await response.json();
          return transformNetworkInfo(data);
        }
      } catch (e) {
        console.debug('kaspa.org info failed:', e);
      }
      return null;
    },
  ];

  for (const source of alternativeSources) {
    try {
      const result = await source();
      if (result) return result;
    } catch (error) {
      console.debug('Alternative source failed:', error);
    }
  }

  // If all else fails, return mock data with error indicator
  console.warn('All Kaspa API endpoints failed. Returning minimal network info.');
  return {
    networkName: 'mainnet',
    blockHeight: undefined,
    blueScore: undefined,
    hashrate: undefined,
    difficulty: undefined,
    supply: undefined,
    maxSupply: 28700000000,
    nodeCount: undefined,
    averageBlockTime: 1,
    tps: undefined,
    totalTransactions: undefined,
  };
}

/**
 * Fetch latest blocks
 * Uses Next.js API route as proxy first, then falls back to direct calls
 */
export async function fetchLatestBlocks(limit: number = 20): Promise<KaspaBlock[]> {
  // Try Next.js API route first (server-side proxy)
  try {
    const response = await fetch(`/api/kaspa/blocks?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.blocks) {
        return result.blocks.map(transformBlock);
      }
    }
  } catch (error) {
    console.debug('Next.js API route failed, trying direct calls:', error);
  }

  // Fallback: Try alternative APIs
  const alternativeSources = [
    // Try kas.fyi API
    async () => {
      try {
        const response = await fetch(`https://api.kas.fyi/v1/blocks?limit=${limit}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          cache: 'no-store',
        });
        if (response.ok) {
          const data = await response.json();
          const blocks = Array.isArray(data) ? data : (data.blocks || data.data || []);
          return blocks.map(transformBlock);
        }
      } catch (e) {
        console.debug('kas.fyi blocks failed:', e);
      }
      return [];
    },
    // Try kaspa.org explorer API
    async () => {
      try {
        const response = await fetch(`https://api.kaspa.org/blocks?limit=${limit}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          cache: 'no-store',
        });
        if (response.ok) {
          const data = await response.json();
          const blocks = Array.isArray(data) ? data : (data.blocks || data.data || []);
          return blocks.map(transformBlock);
        }
      } catch (e) {
        console.debug('kaspa.org blocks failed:', e);
      }
      return [];
    },
  ];

  for (const source of alternativeSources) {
    try {
      const result = await source();
      if (result && result.length > 0) return result;
    } catch (error) {
      console.debug('Alternative source failed:', error);
    }
  }

  return [];
}

/**
 * Fetch block by hash
 * Uses Next.js API route as proxy first, then falls back to direct calls
 */
export async function fetchBlockByHash(hash: string): Promise<KaspaBlock | null> {
  // Try Next.js API route first
  try {
    const response = await fetch(`/api/kaspa/blocks?hash=${hash}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.block) {
        return transformBlock(result.block);
      }
    } else if (response.status === 404) {
      return null;
    }
  } catch (error) {
    console.debug('Next.js API route failed, trying direct calls:', error);
  }

  // Fallback: Try alternative APIs
  const alternativeSources = [
    async () => {
      try {
        const response = await fetch(`https://api.kas.fyi/v1/blocks/${hash}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          cache: 'no-store',
        });
        if (response.ok) {
          const data = await response.json();
          const block = data.block || data;
          return transformBlock(block);
        }
      } catch (e) {
        console.debug('kas.fyi block by hash failed:', e);
      }
      return null;
    },
    async () => {
      try {
        const response = await fetch(`https://api.kaspa.org/blocks/${hash}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          cache: 'no-store',
        });
        if (response.ok) {
          const data = await response.json();
          const block = data.block || data;
          return transformBlock(block);
        }
      } catch (e) {
        console.debug('kaspa.org block by hash failed:', e);
      }
      return null;
    },
  ];

  for (const source of alternativeSources) {
    try {
      const result = await source();
      if (result) return result;
    } catch (error) {
      console.debug('Alternative source failed:', error);
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
    // Return minimal stats instead of throwing
    return {
      networkInfo: {
        networkName: 'mainnet',
        maxSupply: 28700000000,
        averageBlockTime: 1,
      },
      latestBlocks: [],
      health: 'down',
      lastUpdated: Date.now(),
    };
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
