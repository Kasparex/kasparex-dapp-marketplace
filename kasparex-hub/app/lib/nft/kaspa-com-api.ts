/**
 * KaspaCom API Integration for Hub
 * Client-side API calls to KaspaCom for NFT data
 */

const KASPACOM_API_BASE = 'https://api.kaspa.com/api';

export interface Krc721Collection {
  ticker: string;
  totalSupply: number;
  totalMinted: number;
  totalMintedPercent: number;
  totalHolders: number;
  preMintedSupply: number;
  holders: Array<{
    walletAddress: string;
    tokenIds: number[];
    [key: string]: unknown;
  }>;
  state?: string;
  metadata: {
    name?: string;
    description?: string;
    image?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Fetch collection data by ticker
 */
export async function fetchCollectionByTicker(
  ticker: string,
  refresh = false
): Promise<Krc721Collection | null> {
  try {
    const url = `${KASPACOM_API_BASE}/krc721/${ticker}${refresh ? '?refresh=true' : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Collection ${ticker} not found`);
        return null;
      }
      throw new Error(`KaspaCom API error: ${response.status} ${response.statusText}`);
    }

    const collection = await response.json() as Krc721Collection;
    return collection;
  } catch (error) {
    console.error(`Error fetching collection ${ticker}:`, error);
    return null;
  }
}
