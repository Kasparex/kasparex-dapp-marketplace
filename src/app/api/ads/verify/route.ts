import { NextRequest, NextResponse } from 'next/server';
import { verifyAdRegistration } from '@/lib/ads/chainRegistry';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { txHash?: string; metadataCid?: string };
    const result = await verifyAdRegistration({
      txHash: body.txHash ?? '',
      metadataCid: body.metadataCid ?? '',
    });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error ?? 'Verification failed' }, { status: 400 });
    }
    return NextResponse.json({ ok: true, entry: result.entry });
  } catch (e) {
    console.error('[ads/verify]', e);
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
}
