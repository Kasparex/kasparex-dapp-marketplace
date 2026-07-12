/**
 * POST /api/kasparex/node/verify-onchain
 *
 * Server-side tx fetch (Vercel can wait for slow Kaspa REST), then Worker persist via attested snapshot.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRestTransactionById } from '@/lib/kaspa/api';
import { workerUpstreamBase } from '@/lib/api/workerBaseUrl';

export const maxDuration = 60;

type Body = {
  enrollmentToken?: string;
  tx_hash?: string;
  to_address?: string;
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as Body;
    const enrollmentToken = body.enrollmentToken?.trim();
    const txHash = body.tx_hash?.trim().replace(/^0x/i, '').toLowerCase();
    const toAddress = body.to_address?.trim();

    if (!enrollmentToken || !txHash) {
      return NextResponse.json({ ok: false, error: 'Missing enrollmentToken or tx_hash' }, { status: 400 });
    }
    if (!/^[0-9a-f]{64}$/.test(txHash)) {
      return NextResponse.json({ ok: false, error: 'Invalid tx_hash format' }, { status: 400 });
    }

    const tx = await getRestTransactionById(txHash, {
      maxAttempts: 10,
      delayMs: 1200,
      recipientAddress: toAddress || null,
    });

    if (!tx) {
      return NextResponse.json(
        {
          ok: false,
          pending: true,
          error: 'Transaction not indexed yet. Kaspa REST may be slow; retry in a few seconds.',
        },
        { status: 202 }
      );
    }

    const hubSecret = process.env.KASPAREX_HUB_VERIFY_SECRET?.trim() || 'krex-hub-verify-v1-kasparex';
    const upstream = `${workerUpstreamBase()}/kasparex/node/verify-onchain`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (hubSecret) {
      headers['X-Kasparex-Hub-Verify'] = hubSecret;
    }

    const workerRes = await fetch(upstream, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        enrollmentToken,
        tx_hash: txHash,
        tx_snapshot: tx,
      }),
      cache: 'no-store',
    });

    const text = await workerRes.text();
    let data: unknown = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { ok: false, error: 'Worker returned invalid JSON' };
    }

    return NextResponse.json(data, { status: workerRes.status });
  } catch (e) {
    console.error('hub verify-onchain', e);
    return NextResponse.json({ ok: false, error: 'Verification failed' }, { status: 500 });
  }
}
