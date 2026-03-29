import { NextRequest, NextResponse } from 'next/server';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { verifyChroniclesLbTx } from '@/lib/chronicles/leaderboard/verifyTx';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { txHash?: string; payerAddress?: string };
    const rawHash = body.txHash ?? '';
    const txHash =
      extractKaspaTransactionId(rawHash) ?? rawHash.trim().replace(/^0x/i, '').toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(txHash)) {
      return NextResponse.json({ ok: false, error: 'Invalid transaction id' }, { status: 400 });
    }
    const payerAddress = (body.payerAddress ?? '').trim();
    if (!payerAddress) {
      return NextResponse.json({ ok: false, error: 'Missing payer address' }, { status: 400 });
    }

    const result = await verifyChroniclesLbTx({ txHash, payerAddress });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, event: result.event });
  } catch (e) {
    console.error('[chronicles/leaderboard/verify]', e);
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
}

