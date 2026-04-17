import { NextRequest, NextResponse } from 'next/server';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';

/**
 * Reference indexer placeholder (v1).
 *
 * In v1 we model verified as a boolean badge derived from kpx/ver records on-chain.
 * This endpoint will later resolve the highest-seq record.
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
    verified: false,
    provenance: null,
    note: 'kpx/ver indexing not yet enabled in reference API',
  });
}

