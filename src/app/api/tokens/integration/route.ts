import { NextRequest, NextResponse } from 'next/server';
import { getHubContentRegistry } from '@/lib/hub/contentRegistry';
import {
  findIntegratedListingInList,
  integratedTokenFromListing,
} from '@/lib/tokens/integratedTokens';
import type { HubUtilityProductId } from '@/lib/tokens/utilityRegistry';
import type { PublishedTokenListing } from '@/lib/tokens/listingRecord';

export const dynamic = 'force-dynamic';

const WIRED_PRODUCTS: HubUtilityProductId[] = ['store', 'vblog_tips', 'dapps_payments'];

function isProductId(value: string): value is HubUtilityProductId {
  return WIRED_PRODUCTS.includes(value as HubUtilityProductId);
}

export async function GET(request: NextRequest) {
  if (process.env.CF_PAGES) {
    return NextResponse.json({ ok: false, error: 'Not available in static export' }, { status: 503 });
  }

  try {
    const wallet = request.nextUrl.searchParams.get('wallet')?.trim();
    const product = request.nextUrl.searchParams.get('product')?.trim();

    if (!wallet) {
      return NextResponse.json({ ok: false, error: 'wallet is required' }, { status: 400 });
    }
    if (!product || !isProductId(product)) {
      return NextResponse.json({ ok: false, error: 'Invalid product' }, { status: 400 });
    }

    const registry = await getHubContentRegistry();
    const listings = (registry.tokens ?? []) as PublishedTokenListing[];
    const listing = findIntegratedListingInList(wallet, product, listings);
    const token = listing ? integratedTokenFromListing(listing) : null;

    return NextResponse.json(
      { ok: true, token },
      { headers: { 'Cache-Control': 'private, no-cache, no-store, must-revalidate' } },
    );
  } catch (error) {
    console.error('[api/tokens/integration]', error);
    return NextResponse.json({ ok: false, error: 'Failed to resolve integration' }, { status: 500 });
  }
}
