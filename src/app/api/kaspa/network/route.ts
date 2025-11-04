/**
 * Next.js API Route for Kaspa Network Info
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
 * GET /api/kaspa/network
 * Fetches network information
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint') || 'info';

    const endpointVariations = [
      `/api/v1/network/${endpoint}`,
      `/api/v1/${endpoint}`,
      `/v1/network/${endpoint}`,
      `/v1/${endpoint}`,
      `/network/${endpoint}`,
      `/${endpoint}`,
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
                data,
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

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch network info from all API endpoints',
      },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('Error in network API route:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch network info',
      },
      { status: 500 }
    );
  }
}

