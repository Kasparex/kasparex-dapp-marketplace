import { NextRequest, NextResponse } from 'next/server';
import { cleanIpfsHash } from '@/lib/ipfs/cidUtils';
import { getServerPinataService } from '@/lib/ipfs/pinataServer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (process.env.CF_PAGES) {
    return NextResponse.json({ ok: false, error: 'Not available in static export' }, { status: 503 });
  }

  try {
    const body = (await request.json()) as { cids?: string[] };
    const cids = Array.isArray(body.cids)
      ? [...new Set(body.cids.map((c) => cleanIpfsHash(String(c))).filter(Boolean))]
      : [];

    if (!cids.length) {
      return NextResponse.json({ ok: false, error: 'No CIDs provided' }, { status: 400 });
    }

    const pinata = getServerPinataService();
    const unpinned: string[] = [];
    const failed: string[] = [];

    for (const cid of cids.slice(0, 24)) {
      try {
        const ok = await pinata.unpinHash(cid);
        if (ok) unpinned.push(cid);
        else failed.push(cid);
      } catch {
        failed.push(cid);
      }
    }

    return NextResponse.json({ ok: true, unpinned, failed });
  } catch (e) {
    console.error('[ipfs/unpin]', e);
    return NextResponse.json({ ok: false, error: 'Unpin failed' }, { status: 500 });
  }
}
