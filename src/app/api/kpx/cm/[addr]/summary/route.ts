import { NextRequest, NextResponse } from 'next/server';
import {
  defaultKpxIndexerNet,
  defaultKpxIndexTxLimit,
  indexKpxCmCatalogForAddress,
  parseKpxCmCatalogMaxResources,
  parseKpxIndexOffsetParam,
  parseKpxIndexerNetParam,
} from '@/lib/kpx/indexFromChain';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';

/**
 * Lists winning `kpx/cm` pointers per distinct `(rt, rid)` seen in the scanned tx window
 * (same validity rules as single-resource `/api/kpx/cm/[addr]`).
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ addr: string }> }) {
  const { addr } = await ctx.params;
  let canonical: string;
  try {
    canonical = normalizeKaspaAddress(addr);
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid address' }, { status: 400 });
  }
  const addrKey = canonical.toLowerCase();

  const fallbackNet = defaultKpxIndexerNet();
  const net = parseKpxIndexerNetParam(req.nextUrl.searchParams.get('net'), fallbackNet);
  if (!net) {
    return NextResponse.json({ ok: false, error: 'Invalid net (use mainnet or testnet)' }, { status: 400 });
  }

  const limRaw = Number(req.nextUrl.searchParams.get('limit') ?? '');
  const txLimit = Number.isFinite(limRaw)
    ? Math.min(500, Math.max(20, Math.trunc(limRaw)))
    : defaultKpxIndexTxLimit();
  const offset = parseKpxIndexOffsetParam(req.nextUrl.searchParams.get('offset'));
  const maxResources = parseKpxCmCatalogMaxResources(req.nextUrl.searchParams.get('max_resources'));

  const result = await indexKpxCmCatalogForAddress(canonical, { net, txLimit, offset, maxResources });

  const notes: string[] = [];
  if (result.indexed.truncated) {
    notes.push(
      'Tx lookback limit reached for this window. Increase `limit`, use `offset` for the next REST page, or scan with your own indexer for full history.'
    );
  }
  if (result.indexed.responseCapped) {
    notes.push(
      `More than max_resources=${result.indexed.maxResources} distinct resources were resolved; increase max_resources (max 500) or narrow the scan.`
    );
  }

  return NextResponse.json(
    {
      ok: true,
      addr: addrKey,
      net: result.net,
      resources: result.resources,
      indexed: result.indexed,
      ...(notes.length ? { note: notes.join(' ') } : {}),
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
      },
    }
  );
}
