import { NextRequest, NextResponse } from 'next/server';
import { KPX_CM_RT_CODES_V1 } from '@/lib/kpx/constants';
import {
  defaultKpxIndexerNet,
  defaultKpxIndexTxLimit,
  indexKpxCmForResource,
  parseKpxCmRtParam,
  parseKpxIndexOffsetParam,
  parseKpxIndexerNetParam,
} from '@/lib/kpx/indexFromChain';
import { normalizeRid } from '@/lib/kpx/normalize';
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

  const rtRaw = req.nextUrl.searchParams.get('rt');
  const ridRaw = req.nextUrl.searchParams.get('rid');
  const rt = parseKpxCmRtParam(rtRaw);
  const rid = normalizeRid(ridRaw ?? '');
  if (!rtRaw?.trim()) {
    return NextResponse.json({ ok: false, error: 'Missing required query param: rt' }, { status: 400 });
  }
  if (!ridRaw?.trim()) {
    return NextResponse.json({ ok: false, error: 'Missing required query param: rid' }, { status: 400 });
  }
  if (!rt) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Invalid rt (must be a v1 registry code)',
        rtCodesV1: KPX_CM_RT_CODES_V1,
      },
      { status: 400 }
    );
  }
  if (!rid) {
    return NextResponse.json({ ok: false, error: 'Invalid rid' }, { status: 400 });
  }

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

  const result = await indexKpxCmForResource(canonical, { net, txLimit, offset, rt, rid });

  return NextResponse.json(
    {
      ok: true,
      addr: addrKey,
      net: result.net,
      rt: result.rt,
      rid: result.rid,
      commit: result.commit,
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
