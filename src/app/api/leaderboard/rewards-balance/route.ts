import { NextRequest, NextResponse } from 'next/server';
import { getBalance } from '@/lib/kaspa/api';

function parseAmountToBigInt(v: unknown): bigint {
  if (typeof v === 'bigint') return v > 0n ? v : 0n;
  if (typeof v === 'number') return Number.isFinite(v) && v > 0 ? BigInt(Math.floor(v)) : 0n;
  if (typeof v === 'string' && /^\d+$/.test(v.trim())) return BigInt(v.trim());
  return 0n;
}

function sumSompisFromPayload(data: unknown): bigint {
  if (!data || typeof data !== 'object') return 0n;
  const d = data as Record<string, unknown>;
  const direct = parseAmountToBigInt(d.balance ?? d.totalBalance);
  if (direct > 0n) return direct;

  const listCandidate =
    (Array.isArray(d.entries) ? d.entries : null) ??
    (Array.isArray(d.utxos) ? d.utxos : null) ??
    (Array.isArray(d.items) ? d.items : null);
  if (listCandidate) {
    let sum = 0n;
    for (const item of listCandidate) {
      if (!item || typeof item !== 'object') continue;
      const amount = parseAmountToBigInt((item as Record<string, unknown>).amount);
      if (amount > 0n) sum += amount;
    }
    return sum;
  }
  return 0n;
}

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

    // Fallback: direct endpoint sweep for broader API compatibility.
    const addressWithoutPrefix = address.replace(/^kaspa:/i, '');
    const postEndpoints = ['https://api.kaspa.org/v1/addresses/utxos'];
    for (const endpoint of postEndpoints) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ addresses: [addressWithoutPrefix] }),
          cache: 'no-store',
          signal: AbortSignal.timeout(12000),
        });
        if (!res.ok) continue;
        const data = await res.json();
        const sum = sumSompisFromPayload(data);
        if (sum >= 0n) return NextResponse.json({ success: true, balance: sum.toString(), source: 'direct-utxos' });
      } catch {
        // continue
      }
    }

    const getEndpoints = [
      `https://api.kaspa.org/v1/addresses/${addressWithoutPrefix}/balance`,
      `https://api.kaspa.org/addresses/${addressWithoutPrefix}/balance`,
    ];
    for (const endpoint of getEndpoints) {
      try {
        const res = await fetch(endpoint, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
          signal: AbortSignal.timeout(12000),
        });
        if (!res.ok) continue;
        const data = await res.json();
        const sum = sumSompisFromPayload(data);
        if (sum >= 0n) return NextResponse.json({ success: true, balance: sum.toString(), source: 'direct-balance' });
      } catch {
        // continue
      }
    }
    return NextResponse.json({ success: false, error: 'Could not load rewards wallet balance.', balance: null }, { status: 200 });
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
