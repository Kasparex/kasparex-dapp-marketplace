import { NextResponse } from 'next/server';
import { getCachedActiveAds } from '@/lib/ads/activeAdsCache';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const ads = await getCachedActiveAds();
    return NextResponse.json(
      { ads },
      {
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (e) {
    console.error('[ads/active]', e);
    return NextResponse.json({ ads: [], error: 'Failed to load ads' }, { status: 500 });
  }
}
