import { NextRequest, NextResponse } from 'next/server';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { postWorkerPtsIngest } from '@/lib/kasparex/worker-pts-ingest-server';
import { resolveHubEarnDeltaForKaspaWallet } from '@/lib/krex/tier-from-wallet';
import { verifyChronicleQuizEntryTx } from '@/lib/chronicles/quiz/verifyQuizEntryTx';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { getAllChapterSlugs } from '@/lib/chronicles/loaders';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      wallet?: string;
      chapterSlug?: string;
      txHash?: string;
      correct?: number;
      total?: number;
    };

    const wallet = (body.wallet ?? '').trim();
    const chapterSlug = (body.chapterSlug ?? '').trim();
    const txHash = extractKaspaTransactionId(body.txHash ?? '') ?? (body.txHash ?? '').trim();
    const correct = Number(body.correct ?? 0);
    const total = Number(body.total ?? 0);

    if (!wallet || !chapterSlug || !txHash) {
      return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
    }

    if (!getAllChapterSlugs().includes(chapterSlug)) {
      return NextResponse.json({ ok: false, error: 'unknown_chapter' }, { status: 400 });
    }

    if (!Number.isFinite(correct) || !Number.isFinite(total) || total <= 0 || correct !== total) {
      return NextResponse.json({ ok: false, error: 'quiz_not_passed' }, { status: 400 });
    }

    const verified = await verifyChronicleQuizEntryTx(wallet, txHash);
    if (!verified.ok) {
      return NextResponse.json({ ok: false, error: verified.error ?? 'verification_failed' }, { status: 400 });
    }

    let ptsIngest: 'ok' | 'skipped' | 'failed' = 'skipped';
    let ptsIngestError: string | undefined;
    const { delta: earnedPoints, tier } = await resolveHubEarnDeltaForKaspaWallet(
      HUB_EARN_POINTS.chroniclesQuizComplete,
      wallet,
    );

    if (process.env.PTS_INGEST_SECRET?.trim()) {
      const idempotency_key = `chronicles:quiz:${chapterSlug}:${txHash}`;
      if (earnedPoints > 0) {
        const ptsRes = await postWorkerPtsIngest({
          wallet,
          delta_pts: earnedPoints,
          source: 'chronicles_quiz_complete',
          idempotency_key,
          meta: {
            chapterSlug,
            txHash,
            correct,
            total,
            basePoints: HUB_EARN_POINTS.chroniclesQuizComplete,
            krexTier: tier,
          },
        });
        if (!ptsRes.ok) {
          ptsIngest = 'failed';
          ptsIngestError = ptsRes.error;
        } else {
          ptsIngest = 'ok';
        }
      }
    }

    return NextResponse.json({
      ok: true,
      points: earnedPoints,
      ptsIngest,
      ...(ptsIngestError ? { ptsIngestError } : {}),
    });
  } catch (e) {
    console.error('[chronicles/quiz/complete]', e);
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}
