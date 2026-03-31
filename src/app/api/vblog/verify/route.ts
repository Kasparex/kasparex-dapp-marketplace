import { NextRequest, NextResponse } from 'next/server';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { verifyVBlogArticleTxBundle } from '@/lib/vblog/verifyArticleTx';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      articleId?: string;
      op?: 'create' | 'edit';
      payerAddress?: string;
      commitTxHash?: string;
      chunkHexList?: string[];
      contentHash?: string;
      rootHash?: string;
      requiredTotalKas?: number;
    };
    const articleId = (body.articleId ?? '').trim();
    const op: 'create' | 'edit' = body.op === 'edit' ? 'edit' : 'create';
    const payerAddress = (body.payerAddress ?? '').trim();
    const commitTxHash = extractKaspaTransactionId(body.commitTxHash ?? '') ?? (body.commitTxHash ?? '').trim().replace(/^0x/i, '').toLowerCase();
    const chunkHexList = Array.isArray(body.chunkHexList) ? body.chunkHexList.map((x) => String(x)) : [];
    const contentHash = (body.contentHash ?? '').trim();
    const rootHash = (body.rootHash ?? '').trim();
    const requiredTotalKas = Number(body.requiredTotalKas ?? 0);

    if (!articleId || !payerAddress || !commitTxHash || !contentHash || !rootHash || !Number.isFinite(requiredTotalKas) || requiredTotalKas <= 0) {
      return NextResponse.json({ ok: false, error: 'Missing required verification fields' }, { status: 400 });
    }
    if (!/^[0-9a-f]{64}$/.test(commitTxHash)) {
      return NextResponse.json({ ok: false, error: 'Invalid tx hash format' }, { status: 400 });
    }

    const result = await verifyVBlogArticleTxBundle({
      articleId,
      op,
      payerAddress,
      commitTxHash,
      chunkHexList,
      contentHash,
      rootHash,
      requiredTotalKas,
    });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[vblog/verify]', error);
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
}
