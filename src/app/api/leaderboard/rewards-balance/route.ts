import { NextRequest, NextResponse } from 'next/server';
import { getBalance } from '@/lib/kaspa/api';

export async function GET(req: NextRequest) {
  try {
    const address = (req.nextUrl.searchParams.get('address') ?? '').trim();
    if (!address) {
      return NextResponse.json({ success: false, error: 'Address parameter is required' }, { status: 400 });
    }

    // Primary: shared balance service.
    try {
      const sompis = await getBalance(address);
      if (Number.isFinite(sompis) && sompis >= 0) {
        return NextResponse.json({ success: true, balance: String(sompis), source: 'lib/kaspa/api' });
      }
    } catch {
      // try fallback below
    }

    // Fallback: direct UTXO call (same approach as /api/kaspa/balance route).
    const addressWithoutPrefix = address.replace(/^kaspa:/i, '');
    const res = await fetch('https://api.kaspa.org/v1/addresses/utxos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ addresses: [addressWithoutPrefix] }),
      cache: 'no-store',
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) {
      return NextResponse.json({ success: false, error: 'Could not load rewards wallet balance.', balance: null }, { status: 200 });
    }
    const data = (await res.json()) as { entries?: Array<{ amount?: number | string }>; utxos?: Array<{ amount?: number | string }> };
    const list = Array.isArray(data.entries) ? data.entries : Array.isArray(data.utxos) ? data.utxos : [];
    const sumSompis = list.reduce((acc, item) => {
      const v = typeof item.amount === 'string' ? Number(item.amount) : Number(item.amount ?? 0);
      return Number.isFinite(v) && v > 0 ? acc + v : acc;
    }, 0);
    return NextResponse.json({ success: true, balance: String(sumSompis), source: 'direct-utxos' });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Could not load rewards wallet balance.',
        balance: null,
      },
      { status: 200 }
    );
  }
}
