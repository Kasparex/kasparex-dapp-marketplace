import { NextRequest, NextResponse } from 'next/server';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { verifyVBlogArticleTxBundle } from '@/lib/vblog/verifyArticleTx';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { postWorkerPtsIngest } from '@/lib/kasparex/worker-pts-ingest-server';
import { resolveHubEarnDeltaForKaspaWallet } from '@/lib/krex/tier-from-wallet';

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

    const ingestSecret = process.env.PTS_INGEST_SECRET?.trim();
    let ptsIngest: 'ok' | 'skipped' | 'failed' = 'skipped';
    let ptsIngestError: string | undefined;
    if (ingestSecret) {
      try {
        const basePoints =
          op === 'edit' ? HUB_EARN_POINTS.vblogArticleUpdate : HUB_EARN_POINTS.vblogArticleCreate;
        const { delta, tier } = await resolveHubEarnDeltaForKaspaWallet(basePoints, payerAddress);
        const idempotency_key =
          op === 'edit' ? `vba:update:${commitTxHash}` : `vba:create:${commitTxHash}`;
        const source = op === 'edit' ? 'vblog_article_update' : 'vblog_article_create';
        if (delta > 0) {
          const ptsRes = await postWorkerPtsIngest({
            wallet: payerAddress,
            delta_pts: delta,
            source,
            idempotency_key,
            meta: { articleId, commitTxHash, op, basePoints, krexTier: tier },
          });
          if (!ptsRes.ok) {
            ptsIngest = 'failed';
            ptsIngestError = ptsRes.error;
            console.error('[vblog/verify] worker pts ingest failed', ptsRes.status, ptsRes.error);
          } else {
            ptsIngest = 'ok';
          }
        } else {
          ptsIngest = 'skipped';
        }
      } catch (e) {
        ptsIngest = 'failed';
        ptsIngestError = e instanceof Error ? e.message : String(e);
        console.error('[vblog/verify] pts ingest exception', e);
      }
    }

    return NextResponse.json({
      ok: true,
      ptsIngest,
      ...(ptsIngestError ? { ptsIngestError } : {}),
    });
  } catch (error) {
    console.error('[vblog/verify]', error);
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
}
