import { NextRequest, NextResponse } from 'next/server';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';

/**
 * Reference indexer placeholder (v1).
 *
 * For now this returns the normalized address and an empty state.
 * In the next iteration this endpoint will scan/index kpx/pf records from chain sources.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ addr: string }> }) {
  const { addr } = await ctx.params;
  let normalized: string;
  try {
    normalized = normalizeKaspaAddress(addr).toLowerCase();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid address' }, { status: 400 });
  }
  return NextResponse.json({
    ok: true,
    addr: normalized,
    state: null,
    provenance: null,
    note: 'kpx/pf indexing not yet enabled in reference API',
  });
}

