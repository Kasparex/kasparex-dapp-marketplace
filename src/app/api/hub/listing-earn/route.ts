import { NextRequest, NextResponse } from 'next/server';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { postWorkerPtsIngest } from '@/lib/kasparex/worker-pts-ingest-server';
import { resolveHubEarnDeltaForKaspaWallet } from '@/lib/krex/tier-from-wallet';
import { verifyHubTreasuryFeeTx } from '@/lib/hub/verifyTreasuryFeeTx';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import type { EarnSource } from '@/lib/rewards/hub-ledger-types';

const LISTING_EARN_SOURCES: Partial<
  Record<EarnSource, { basePoints: number; minKas: number; idempotencyPrefix: string }>
> = {
  games_promo_list: {
    basePoints: HUB_EARN_POINTS.gamesPromoList,
    minKas: 3,
    idempotencyPrefix: 'games:promo',
  },
  dapp_directory_list: {
    basePoints: HUB_EARN_POINTS.dappDirectoryList,
    minKas: 3,
    idempotencyPrefix: 'dapps:listing',
  },
  chronicles_article_create: {
    basePoints: HUB_EARN_POINTS.chroniclesArticleCreate,
    minKas: 2,
    idempotencyPrefix: 'chronicles:article',
  },
  magazine_issue_publish: {
    basePoints: HUB_EARN_POINTS.magazineIssuePublish,
    minKas: 3,
    idempotencyPrefix: 'magazine:issue',
  },
  store_product_list: {
    basePoints: HUB_EARN_POINTS.storeProductList,
    minKas: 3,
    idempotencyPrefix: 'store:product',
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      wallet?: string;
      txHash?: string;
      source?: string;
      meta?: Record<string, unknown>;
    };

    const wallet = (body.wallet ?? '').trim();
    const txHash =
      extractKaspaTransactionId(body.txHash ?? '') ?? (body.txHash ?? '').trim();
    const source = (body.source ?? '').trim() as EarnSource;
    const cfg = LISTING_EARN_SOURCES[source];

    if (!wallet || !txHash || !cfg) {
      return NextResponse.json({ ok: false, error: 'missing_or_invalid_fields' }, { status: 400 });
    }

    const verified = await verifyHubTreasuryFeeTx({
      wallet,
      txHashRaw: txHash,
      minKas: cfg.minKas,
    });
    if (!verified.ok) {
      return NextResponse.json({ ok: false, error: verified.error ?? 'verification_failed' }, { status: 400 });
    }

    const { delta: earnedPoints, tier } = await resolveHubEarnDeltaForKaspaWallet(
      cfg.basePoints,
      wallet,
    );

    let ptsIngest: 'ok' | 'skipped' | 'failed' = 'skipped';
    let ptsIngestError: string | undefined;
    if (process.env.PTS_INGEST_SECRET?.trim() && earnedPoints > 0) {
      const idempotency_key = `${cfg.idempotencyPrefix}:${txHash}`;
      const ptsRes = await postWorkerPtsIngest({
        wallet,
        delta_pts: earnedPoints,
        source,
        idempotency_key,
        meta: {
          ...body.meta,
          txHash,
          basePoints: cfg.basePoints,
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

    return NextResponse.json({
      ok: true,
      points: earnedPoints,
      ptsIngest,
      ...(ptsIngestError ? { ptsIngestError } : {}),
    });
  } catch (e) {
    console.error('[hub/listing-earn]', e);
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}
