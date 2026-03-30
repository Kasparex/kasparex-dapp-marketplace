import { NextRequest, NextResponse } from 'next/server';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { verifyChroniclesLbTx } from '@/lib/chronicles/leaderboard/verifyTx';

function txTimeMs(tx: { accepting_block_time?: number; block_time?: number }): number {
  const t = tx.accepting_block_time ?? tx.block_time;
  if (typeof t === 'number' && t > 1e12) return t;
  if (typeof t === 'number' && t > 1e9) return t * 1000;
  return Date.now();
}

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

    return NextResponse.json({ ok: true, event: result.event, txHash, txTimeMs: txTimeMs(result.tx) });
  } catch (e) {
    console.error('[chronicles/leaderboard/verify]', e);
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
}

