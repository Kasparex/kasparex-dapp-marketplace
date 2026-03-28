import { NextResponse } from 'next/server';
import { getCachedActiveAds } from '@/lib/ads/activeAdsCache';

export async function GET() {
  try {
    const ads = await getCachedActiveAds();
    return NextResponse.json(
      { ads },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (e) {
    console.error('[ads/active]', e);
    return NextResponse.json({ ads: [], error: 'Failed to load ads' }, { status: 500 });
  }
}
