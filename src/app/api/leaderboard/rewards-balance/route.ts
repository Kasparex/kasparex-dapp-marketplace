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
    const debug = req.nextUrl.searchParams.get('debug') === '1';
    const diagnostics: Array<{ source: string; ok: boolean; detail?: string; status?: number }> = [];
    if (!address) {
      return NextResponse.json({ success: false, error: 'Address parameter is required' }, { status: 400 });
    }

    // Primary: shared balance service.
    try {
      const sompis = await getBalance(address);
      if (Number.isFinite(sompis) && sompis >= 0) {
        if (debug) diagnostics.push({ source: 'lib/kaspa/api#getBalance', ok: true });
        return NextResponse.json({ success: true, balance: String(sompis), source: 'lib/kaspa/api' });
      }
      if (debug) diagnostics.push({ source: 'lib/kaspa/api#getBalance', ok: false, detail: 'Non-finite balance returned' });
    } catch {
      if (debug) diagnostics.push({ source: 'lib/kaspa/api#getBalance', ok: false, detail: 'Request failed' });
      // try fallback below
    }

    // Fallback: direct endpoint sweep for broader API compatibility.
    const addressWithoutPrefix = address.replace(/^kaspa:/i, '').trim();
    const normalizedPrefixed = address.toLowerCase().startsWith('kaspa:') ? address.trim() : `kaspa:${addressWithoutPrefix}`;
    const candidateAddresses = Array.from(new Set([normalizedPrefixed, addressWithoutPrefix]));

    // Fast path: this is the endpoint variant currently confirmed to work in production.
    const preferredEndpoint = `https://api.kaspa.org/addresses/${encodeURIComponent(normalizedPrefixed)}/balance`;
    try {
      const preferredRes = await fetch(preferredEndpoint, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      });
      if (preferredRes.ok) {
        const preferredData = await preferredRes.json();
        const preferredSum = sumSompisFromPayload(preferredData);
        if (preferredSum >= 0n) {
          if (debug) diagnostics.push({ source: preferredEndpoint, ok: true });
          return NextResponse.json({ success: true, balance: preferredSum.toString(), source: 'direct-balance', diagnostics: debug ? diagnostics : undefined });
        }
        if (debug) diagnostics.push({ source: preferredEndpoint, ok: false, detail: 'Parsed empty/invalid payload' });
      } else if (debug) {
        diagnostics.push({ source: preferredEndpoint, ok: false, status: preferredRes.status, detail: preferredRes.statusText });
      }
    } catch {
      if (debug) diagnostics.push({ source: preferredEndpoint, ok: false, detail: 'Network/timeout error' });
    }

    const postEndpoints = ['https://api.kaspa.org/v1/addresses/utxos'];
    for (const endpoint of postEndpoints) {
      try {
        for (const candidate of candidateAddresses) {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ addresses: [candidate] }),
            cache: 'no-store',
            signal: AbortSignal.timeout(12000),
          });
          if (!res.ok) {
            if (debug) diagnostics.push({ source: `${endpoint} [${candidate}]`, ok: false, status: res.status, detail: res.statusText });
            continue;
          }
          const data = await res.json();
          const sum = sumSompisFromPayload(data);
          if (sum >= 0n) {
            if (debug) diagnostics.push({ source: `${endpoint} [${candidate}]`, ok: true });
            return NextResponse.json({ success: true, balance: sum.toString(), source: 'direct-utxos', diagnostics: debug ? diagnostics : undefined });
          }
          if (debug) diagnostics.push({ source: `${endpoint} [${candidate}]`, ok: false, detail: 'Parsed empty/invalid payload' });
        }
      } catch {
        if (debug) diagnostics.push({ source: endpoint, ok: false, detail: 'Network/timeout error' });
        // continue
      }
    }

    for (const candidate of candidateAddresses) {
      const encoded = encodeURIComponent(candidate);
      const getEndpoints = [
        `https://api.kaspa.org/addresses/${encoded}/balance`,
        `https://api.kaspa.org/v1/addresses/${encoded}/balance`,
      ];
      if (debug) {
        getEndpoints.push(`https://api.kaspa.org/v1/addresses/${encoded}`);
        getEndpoints.push(`https://api.kaspa.org/addresses/${encoded}`);
        getEndpoints.push(`https://api.kaspa.org/v1/address/${encoded}`);
      }
      for (const endpoint of getEndpoints) {
        try {
          const res = await fetch(endpoint, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            cache: 'no-store',
            signal: AbortSignal.timeout(12000),
          });
          if (!res.ok) {
            if (debug) diagnostics.push({ source: endpoint, ok: false, status: res.status, detail: res.statusText });
            continue;
          }
          const data = await res.json();
          const sum = sumSompisFromPayload(data);
          if (sum >= 0n) {
            if (debug) diagnostics.push({ source: endpoint, ok: true });
            return NextResponse.json({ success: true, balance: sum.toString(), source: 'direct-balance', diagnostics: debug ? diagnostics : undefined });
          }
          if (debug) diagnostics.push({ source: endpoint, ok: false, detail: 'Parsed empty/invalid payload' });
        } catch {
          if (debug) diagnostics.push({ source: endpoint, ok: false, detail: 'Network/timeout error' });
          // continue
        }
      }
    }
    return NextResponse.json(
      { success: false, error: 'Could not load rewards wallet balance.', balance: null, diagnostics: debug ? diagnostics : undefined },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Could not load rewards wallet balance.',
        balance: null,
        diagnostics: req.nextUrl.searchParams.get('debug') === '1' ? [{ source: 'route', ok: false, detail: 'Unhandled route error' }] : undefined,
      },
      { status: 200 }
    );
  }
}
