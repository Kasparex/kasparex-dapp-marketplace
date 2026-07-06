import { NextRequest, NextResponse } from 'next/server';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import type { CovenantTemplate } from '@/lib/programmability/types';
import { verifyKpxCovenantPlatformFeeTx } from '@/lib/covenant/verifyPlatformFeeTx';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { postWorkerPtsIngest } from '@/lib/kasparex/worker-pts-ingest-server';
import { resolveHubEarnDeltaForKaspaWallet } from '@/lib/krex/tier-from-wallet';

const TEMPLATES: CovenantTemplate[] = ['lockbox', 'split', 'milestone', 'crowdfund', 'voucher'];

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      template?: CovenantTemplate;
      payerAddress?: string;
      feeTxHash?: string;
      requiredFeeKas?: number;
      covenantId?: string;
    };

    const template = body.template;
    if (!template || !TEMPLATES.includes(template)) {
      return NextResponse.json({ ok: false, error: 'Invalid template' }, { status: 400 });
    }

    const payerAddress = (body.payerAddress ?? '').trim();
    const feeTxHash =
      extractKaspaTransactionId(body.feeTxHash ?? '') ??
      (body.feeTxHash ?? '').trim().replace(/^0x/i, '').toLowerCase();
    const requiredFeeKas = Number(body.requiredFeeKas ?? 0);

    if (!payerAddress || !feeTxHash || !Number.isFinite(requiredFeeKas) || requiredFeeKas <= 0) {
      return NextResponse.json({ ok: false, error: 'Missing verification fields' }, { status: 400 });
    }

    const result = await verifyKpxCovenantPlatformFeeTx({
      template,
      payerAddress,
      feeTxHash,
      requiredFeeKas,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    const ingestSecret = process.env.PTS_INGEST_SECRET?.trim();
    let ptsIngest: 'ok' | 'skipped' | 'failed' = 'skipped';
    let ptsIngestError: string | undefined;

    if (ingestSecret) {
      try {
        const { delta, tier } = await resolveHubEarnDeltaForKaspaWallet(
          HUB_EARN_POINTS.kpxCovenantDeploy,
          payerAddress,
        );
        if (delta > 0) {
          const ptsRes = await postWorkerPtsIngest({
            wallet: payerAddress,
            delta_pts: delta,
            source: 'kpx_covenant_deploy',
            idempotency_key: `kpx:deploy:${feeTxHash}`,
            meta: {
              template,
              feeTxHash,
              covenantId: body.covenantId,
              basePoints: HUB_EARN_POINTS.kpxCovenantDeploy,
              krexTier: tier,
            },
          });
          ptsIngest = ptsRes.ok ? 'ok' : 'failed';
          if (!ptsRes.ok) ptsIngestError = ptsRes.error;
        }
      } catch (e) {
        ptsIngest = 'failed';
        ptsIngestError = e instanceof Error ? e.message : String(e);
      }
    }

    return NextResponse.json({
      ok: true,
      ptsIngest,
      ...(ptsIngestError ? { ptsIngestError } : {}),
    });
  } catch (error) {
    console.error('[covenant/verify]', error);
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
}
