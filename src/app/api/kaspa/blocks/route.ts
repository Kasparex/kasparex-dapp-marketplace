/**
 * Next.js API Route for Kaspa Blocks
 * 
 * Proxies requests to Kaspa REST API server-side
 */

import { NextRequest, NextResponse } from 'next/server';

const KASPA_API_BASE_URLS = [
  'https://api.kaspa.org',
  'https://api-tn10.kaspa.org',
  'https://rest.kaspa.org',
];

/**
 * GET /api/kaspa/blocks
 * Fetches blocks information
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const hash = searchParams.get('hash');

    // If hash is provided, fetch specific block
    if (hash) {
      const endpointVariations = [
        `/api/v1/blocks/${hash}`,
        `/v1/blocks/${hash}`,
        `/blocks/${hash}`,
      ];

      for (const baseUrl of KASPA_API_BASE_URLS) {
        for (const path of endpointVariations) {
          try {
            const url = `${baseUrl}${path}`;
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
                return NextResponse.json({
                  success: true,
                  block: data.block || data,
                });
              } else if (response.status === 404) {
                return NextResponse.json(
                  {
                    success: false,
                    error: 'Block not found',
                  },
                  { status: 404 }
                );
              }
            } catch (fetchError: any) {
              clearTimeout(timeoutId);
              if (fetchError.name !== 'AbortError') {
                console.debug(`Failed to fetch from ${url}:`, fetchError);
              }
            }
          } catch (error) {
            console.debug(`Error fetching from ${baseUrl}${path}:`, error);
          }
        }
      }
    } else {
      // Fetch latest blocks
      const endpointVariations = [
        `/api/v1/blocks?limit=${limit}`,
        `/api/v1/blocks/latest?limit=${limit}`,
        `/v1/blocks?limit=${limit}`,
        `/v1/blocks/latest?limit=${limit}`,
        `/blocks?limit=${limit}`,
      ];

      for (const baseUrl of KASPA_API_BASE_URLS) {
        for (const path of endpointVariations) {
          try {
            const url = `${baseUrl}${path}`;
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
                return NextResponse.json({
                  success: true,
                  blocks,
                  count: blocks.length,
                });
              }
            } catch (fetchError: any) {
              clearTimeout(timeoutId);
              if (fetchError.name !== 'AbortError') {
                console.debug(`Failed to fetch from ${url}:`, fetchError);
              }
            }
          } catch (error) {
            console.debug(`Error fetching from ${baseUrl}${path}:`, error);
          }
        }
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch blocks from all API endpoints',
        blocks: [],
      },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('Error in blocks API route:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch blocks',
        blocks: [],
      },
      { status: 500 }
    );
  }
}

