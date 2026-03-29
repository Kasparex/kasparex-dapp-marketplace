import { NextRequest, NextResponse } from 'next/server';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { verifyChroniclesVaultUnlock } from '@/lib/chronicles/vault/verifyUnlockTx';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      txHash?: string;
      offerId?: string;
      payerAddress?: string;
      basePriceKas?: number;
    };
    const rawHash = body.txHash ?? '';
    const txHash =
      extractKaspaTransactionId(rawHash) ?? rawHash.trim().replace(/^0x/i, '').toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(txHash)) {
      return NextResponse.json({ ok: false, error: 'Invalid transaction id' }, { status: 400 });
    }
    const offerId = (body.offerId ?? '').trim();
    const payerAddress = (body.payerAddress ?? '').trim();
    const basePriceKas = typeof body.basePriceKas === 'number' ? body.basePriceKas : Number(body.basePriceKas);
    if (!offerId || !payerAddress || !Number.isFinite(basePriceKas) || basePriceKas <= 0) {
      return NextResponse.json({ ok: false, error: 'Missing offer, payer, or price' }, { status: 400 });
    }

    const result = await verifyChroniclesVaultUnlock({
      txHash,
      offerId,
      payerAddress,
      basePriceKas,
    });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[chronicles/vault/verify]', e);
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
}
