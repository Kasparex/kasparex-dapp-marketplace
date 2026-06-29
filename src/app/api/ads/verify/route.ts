import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { verifyAdRegistration } from '@/lib/ads/chainRegistry';
import { registerVerifiedAd } from '@/lib/ads/verifiedAdsRegistry';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { txHash?: string; metadataCid?: string };
    const rawHash = body.txHash ?? '';
    const txHash = extractKaspaTransactionId(rawHash) ?? rawHash.trim().replace(/^0x/i, '').toLowerCase();
    const result = await verifyAdRegistration({
      txHash,
      metadataCid: body.metadataCid ?? '',
    });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error ?? 'Verification failed' }, { status: 400 });
    }
    if (result.entry) registerVerifiedAd(result.entry);
    revalidateTag('ads-active');
    revalidatePath('/api/ads/active');
    return NextResponse.json({ ok: true, entry: result.entry });
  } catch (e) {
    console.error('[ads/verify]', e);
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
}
