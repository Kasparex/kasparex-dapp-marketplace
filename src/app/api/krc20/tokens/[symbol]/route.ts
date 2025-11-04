/**
 * Next.js API Route for KRC-20 Token by Symbol
 * 
 * GET /api/krc20/tokens/[symbol]
 * Fetches a specific KRC-20 token by symbol
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
 * GET /api/krc20/tokens/[symbol]
 * Fetches a specific KRC-20 token by symbol
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const symbol = params.symbol.toUpperCase();
    const endpointVariations = [
      `${KAS_FYI_API_BASE_URL}/v1/tokens/krc20/symbol/${encodeURIComponent(symbol)}`,
      `${KAS_FYI_API_BASE_URL}/v1/krc20/tokens/symbol/${encodeURIComponent(symbol)}`,
      `${KAS_FYI_API_BASE_URL}/v1/tokens/symbol/${encodeURIComponent(symbol)}`,
    ];

    for (const url of endpointVariations) {
      try {
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
            const token = data.token || data;
            const transformedToken = transformKasFyiToken(token);
            
            return NextResponse.json({
              success: true,
              token: transformedToken,
            });
          } else if (response.status === 404) {
            return NextResponse.json(
              {
                success: false,
                error: 'Token not found',
                token: null,
              },
              { status: 404 }
            );
          }
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name !== 'AbortError') {
            console.debug(`Failed to fetch token from ${url}:`, fetchError);
          }
        }
      } catch (error) {
        console.debug(`Error fetching token ${symbol} from ${url}:`, error);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Token not found',
        token: null,
      },
      { status: 404 }
    );
  } catch (error: any) {
    console.error(`Error fetching token ${params.symbol}:`, error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch token',
        token: null,
      },
      { status: 500 }
    );
  }
}
