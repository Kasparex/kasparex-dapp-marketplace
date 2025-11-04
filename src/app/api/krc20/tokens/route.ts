/**
 * Next.js API Route for KRC-20 Tokens
 * 
 * This route proxies requests to kas.fyi API server-side to keep the API key secure.
 * API Key is stored in server-side environment variable: KAS_FYI_API_KEY
 */

import { NextRequest, NextResponse } from 'next/server';
import type { KRC20Token } from '@/lib/krc20/types';

const KAS_FYI_API_BASE_URL = 'https://api.kas.fyi';
// API Key is stored server-side only - never exposed to client
// Set in Vercel environment variables or .env.local
const KAS_FYI_API_KEY = process.env.KAS_FYI_API_KEY || 'kdp_56c6d5e742aebabf6470561ef3ab41d1549097eca4ad0e5fe8402c20e417af29';

if (!process.env.KAS_FYI_API_KEY) {
  console.warn('⚠️  KAS_FYI_API_KEY not set in environment variables. Using fallback key. Set KAS_FYI_API_KEY in Vercel or .env.local for production.');
}

/**
 * Transform kas.fyi token data format to KRC20Token
 */
function transformKasFyiToken(data: any): KRC20Token {
  const ticker = data.tick || data.ticker || data.symbol || '';
  const maxSupply = data.max || data.maxSupply || data.totalSupply;
  const minted = data.minted || data.mintedSupply;
  const dec = data.dec || data.decimals;
  
  return {
    symbol: ticker,
    name: data.name || ticker,
    address: data.address || data.contractAddress || `kas.fyi:${ticker}`,
    decimals: typeof dec === 'string' ? parseInt(dec, 10) : (dec || 18),
    totalSupply: data.totalSupply || maxSupply,
    maxSupply: maxSupply,
    limit: data.lim || data.limit,
    minted: minted,
    holders: data.holders || data.holderCount,
    transactionCount: data.transactionCount || data.txCount || data.transactions,
    logo: data.logo || data.logoUrl || data.image,
    description: data.description,
    website: data.website || data.url,
    socialLinks: data.social ? {
      twitter: data.social.twitter || data.twitter,
      telegram: data.social.telegram || data.telegram,
      discord: data.social.discord || data.discord,
    } : undefined,
    createdAt: data.createdAt || data.created_at || data.timestamp,
    creator: data.creator || data.creatorAddress,
  };
}

/**
 * Fetch KRC-20 tokens from kas.fyi API
 */
async function fetchTokensFromKasFyi(limit: number = 100): Promise<KRC20Token[]> {
  const endpointVariations = [
    `${KAS_FYI_API_BASE_URL}/v1/tokens/krc20`,
    `${KAS_FYI_API_BASE_URL}/v1/krc20/tokens`,
    `${KAS_FYI_API_BASE_URL}/v1/tokens`,
  ];

  for (const endpoint of endpointVariations) {
    try {
      const url = `${endpoint}?limit=${limit}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': KAS_FYI_API_KEY,
          },
          cache: 'no-store',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          
          let tokens: any[] = [];
          if (Array.isArray(data)) {
            tokens = data;
          } else if (data.tokens && Array.isArray(data.tokens)) {
            tokens = data.tokens;
          } else if (data.data && Array.isArray(data.data)) {
            tokens = data.data;
          } else if (data.result && Array.isArray(data.result)) {
            tokens = data.result;
          }

          if (tokens.length > 0) {
            return tokens
              .map(transformKasFyiToken)
              .filter(token => token.symbol && token.symbol.length > 0);
          }
        } else if (response.status !== 404) {
          console.warn(`kas.fyi API error from ${url}: ${response.status} ${response.statusText}`);
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name !== 'AbortError') {
          console.debug(`Failed to fetch from ${url}:`, fetchError);
        }
      }
    } catch (error: any) {
      console.debug(`Error fetching from ${endpoint}:`, error);
    }
  }

  throw new Error('All kas.fyi endpoint variations failed');
}

/**
 * GET /api/krc20/tokens
 * Fetches list of KRC-20 tokens
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const tokens = await fetchTokensFromKasFyi(limit);

    return NextResponse.json({
      success: true,
      tokens,
      count: tokens.length,
    });
  } catch (error: any) {
    console.error('Error fetching KRC-20 tokens:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch tokens',
        tokens: [],
      },
      { status: 500 }
    );
  }
}
