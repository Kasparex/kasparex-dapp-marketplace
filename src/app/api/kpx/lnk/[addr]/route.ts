import { NextRequest, NextResponse } from 'next/server';
import {
  defaultKpxIndexerNet,
  defaultKpxIndexTxLimit,
  indexKpxLnkForAddress,
  parseKpxIndexOffsetParam,
  parseKpxIndexerNetParam,
} from '@/lib/kpx/indexFromChain';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';

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

  const result = await indexKpxLnkForAddress(canonical, { net, txLimit, offset });

  return NextResponse.json(
    {
      ok: true,
      addr: addrKey,
      net: result.net,
      evm: result.evm,
      provenance: result.provenance,
      indexed: result.indexed,
      ...(result.indexed.truncated
        ? {
            note:
              'Tx lookback limit reached for this window. Increase `limit`, use `offset` for the next REST page, or scan with your own indexer for full history.',
          }
        : {}),
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
      },
    }
  );
}
