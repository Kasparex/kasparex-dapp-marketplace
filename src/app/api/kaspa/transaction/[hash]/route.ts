/**
 * GET /api/kaspa/transaction/[hash]
 * Server-side proxy for Kaspa transaction by hash (avoids CORS; used for L1 verification).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTransactionByHash } from '@/lib/kaspa/api';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
): Promise<NextResponse> {
  try {
    const { hash } = await params;
    if (!hash || !/^[0-9a-fA-F]{64}$/.test(hash.replace(/^0x/, ''))) {
      return NextResponse.json(
        { success: false, error: 'Invalid transaction hash' },
        { status: 400 }
      );
    }
    const tx = await getTransactionByHash(hash);
    if (!tx) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found or not yet confirmed' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, transaction: tx });
  } catch (e) {
    console.error('Kaspa transaction proxy error:', e);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transaction' },
      { status: 500 }
    );
  }
}
