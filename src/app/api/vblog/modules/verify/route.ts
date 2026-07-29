import { NextRequest, NextResponse } from 'next/server';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { verifyVBlogModulePaymentSplit } from '@/lib/vblog/verifyArticleTx';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { postWorkerPtsIngest } from '@/lib/kasparex/worker-pts-ingest-server';
import { resolveHubEarnDeltaForKaspaWallet } from '@/lib/krex/tier-from-wallet';

const MODULE_EARN: Partial<
  Record<'premium_unlock' | 'tip_to_reveal_unlock' | 'tip_box', { base: number; source: string }>
> = {
  premium_unlock: { base: HUB_EARN_POINTS.vblogPremiumUnlock, source: 'vblog_premium_unlock' },
  tip_box: { base: HUB_EARN_POINTS.vblogTip, source: 'vblog_tip' },
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      payerAddress?: string;
      articleId?: string;
      moduleId?: 'premium_unlock' | 'tip_to_reveal_unlock' | 'tip_box';
      expectedAuthorAddress?: string;
      expectedAuthorKas?: number;
      expectedPlatformKas?: number;
      authorTxHash?: string;
      authorTxHashes?: string[];
      authorRecipientAddresses?: string[];
      platformTxHash?: string;
    };

    const authorTxHashes = (
      Array.isArray(body.authorTxHashes) && body.authorTxHashes.length
        ? body.authorTxHashes
        : body.authorTxHash
          ? [body.authorTxHash]
          : []
    )
      .map((h) => extractKaspaTransactionId(h) ?? '')
      .filter(Boolean);

    const platformTxHash = extractKaspaTransactionId(body.platformTxHash ?? '') ?? '';
    const expectedPlatformKas = Number(body.expectedPlatformKas);
    const expectsPlatform = Number.isFinite(expectedPlatformKas) && expectedPlatformKas > 1e-9;

    if (
      !body.payerAddress ||
      !body.articleId ||
      !body.moduleId ||
      !body.expectedAuthorAddress ||
      !Number.isFinite(Number(body.expectedAuthorKas)) ||
      !Number.isFinite(expectedPlatformKas) ||
      authorTxHashes.length === 0 ||
      (expectsPlatform && !platformTxHash)
    ) {
      return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 });
    }

    const result = await verifyVBlogModulePaymentSplit({
      payerAddress: body.payerAddress,
      articleId: body.articleId,
      moduleId: body.moduleId,
      expectedAuthorAddress: body.expectedAuthorAddress,
      expectedAuthorKas: Number(body.expectedAuthorKas),
      expectedPlatformKas,
      authorTxHashes,
      authorRecipientAddresses: body.authorRecipientAddresses,
      platformTxHash,
    });
    if (!result.ok) return NextResponse.json(result, { status: 400 });

    const earn = MODULE_EARN[body.moduleId];
    let ptsIngest: 'ok' | 'skipped' | 'failed' = 'skipped';
    let ptsIngestError: string | undefined;
    let points = 0;

    if (earn && process.env.PTS_INGEST_SECRET?.trim()) {
      try {
        const { delta, tier } = await resolveHubEarnDeltaForKaspaWallet(earn.base, body.payerAddress);
        points = delta;
        if (delta > 0) {
          const idempotency_key = `vbm:${body.moduleId}:${authorTxHashes[0]}`;
          const ptsRes = await postWorkerPtsIngest({
            wallet: body.payerAddress,
            delta_pts: delta,
            source: earn.source,
            idempotency_key,
            meta: {
              articleId: body.articleId,
              moduleId: body.moduleId,
              authorTxHashes,
              platformTxHash,
              basePoints: earn.base,
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
      } catch (e) {
        ptsIngest = 'failed';
        ptsIngestError = e instanceof Error ? e.message : String(e);
      }
    }

    return NextResponse.json({
      ok: true,
      points,
      ptsIngest,
      ...(ptsIngestError ? { ptsIngestError } : {}),
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
}
