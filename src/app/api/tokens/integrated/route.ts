import { NextRequest, NextResponse } from 'next/server';
import { getHubContentRegistry } from '@/lib/hub/contentRegistry';
import {
  findAllIntegratedListingsForWallet,
  integratedTokenFromListing,
  listIntegratedTokensForProduct,
} from '@/lib/tokens/integrationCore';
import type { HubUtilityProductId } from '@/lib/tokens/utilityRegistry';
import type { PublishedTokenListing } from '@/lib/tokens/listingRecord';

export const dynamic = 'force-dynamic';

const WIRED_PRODUCTS: HubUtilityProductId[] = [
  'store',
  'vblog_tips',
  'dapps_payments',
  'vdonations',
  'crowdkas',
  'magazines',
  'games',
];

function isProductId(value: string): value is HubUtilityProductId {
  return WIRED_PRODUCTS.includes(value as HubUtilityProductId);
}

export async function GET(request: NextRequest) {
  if (process.env.CF_PAGES) {
    return NextResponse.json({ ok: false, error: 'Not available in static export' }, { status: 503 });
  }

  try {
    const wallet = request.nextUrl.searchParams.get('wallet')?.trim() || undefined;
    const product = request.nextUrl.searchParams.get('product')?.trim();

    if (!product || !isProductId(product)) {
      return NextResponse.json({ ok: false, error: 'Invalid product' }, { status: 400 });
    }

    const registry = await getHubContentRegistry();
    const listings = (registry.tokens ?? []) as PublishedTokenListing[];

    const tokens = wallet
      ? findAllIntegratedListingsForWallet(wallet, product, listings)
          .map((listing) => integratedTokenFromListing(listing, { includeListing: false }))
          .filter((token): token is NonNullable<typeof token> => token != null)
      : listIntegratedTokensForProduct(product, listings);

    return NextResponse.json(
      { ok: true, tokens },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } },
    );
  } catch (error) {
    console.error('[api/tokens/integrated]', error);
    return NextResponse.json({ ok: false, error: 'Failed to list integrated tokens' }, { status: 500 });
  }
}
