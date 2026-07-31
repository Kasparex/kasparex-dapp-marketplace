import { NextRequest, NextResponse } from 'next/server';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { verifyTokenListingTx, verifyTokenListingTxBundle } from '@/lib/tokens/verifyListingTx';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { postWorkerPtsIngest } from '@/lib/kasparex/worker-pts-ingest-server';
import { resolveHubEarnDeltaForKaspaWallet } from '@/lib/krex/tier-from-wallet';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      listingId?: string;
      op?: 'create' | 'edit';
      payerAddress?: string;
      commitTxHash?: string;
      paymentTxHashes?: string[];
      chunkHexList?: string[];
      contentHash?: string;
      rootHash?: string;
      requiredTotalKas?: number;
    };
    const listingId = (body.listingId ?? '').trim();
    const op: 'create' | 'edit' = body.op === 'edit' ? 'edit' : 'create';
    const payerAddress = (body.payerAddress ?? '').trim();
    const commitTxHash =
      extractKaspaTransactionId(body.commitTxHash ?? '') ??
      (body.commitTxHash ?? '').trim().replace(/^0x/i, '').toLowerCase();
    const paymentTxHashes = Array.isArray(body.paymentTxHashes)
      ? body.paymentTxHashes.map((x) => String(x))
      : undefined;
    const chunkHexList = Array.isArray(body.chunkHexList) ? body.chunkHexList.map((x) => String(x)) : [];
    const contentHash = (body.contentHash ?? '').trim();
    const rootHash = (body.rootHash ?? '').trim();
    const requiredTotalKas = Number(body.requiredTotalKas ?? 0);

    if (
      !listingId ||
      !payerAddress ||
      !commitTxHash ||
      !contentHash ||
      !Number.isFinite(requiredTotalKas) ||
      requiredTotalKas <= 0
    ) {
      return NextResponse.json({ ok: false, error: 'Missing required verification fields' }, { status: 400 });
    }
    if (!/^[0-9a-f]{64}$/.test(commitTxHash)) {
      return NextResponse.json({ ok: false, error: 'Invalid tx hash format' }, { status: 400 });
    }

    const result =
      chunkHexList.length > 0 && rootHash
        ? await verifyTokenListingTxBundle({
            listingId,
            op,
            payerAddress,
            commitTxHash,
            paymentTxHashes,
            chunkHexList,
            contentHash,
            rootHash,
            requiredTotalKas,
          })
        : await verifyTokenListingTx({
            listingId,
            op,
            payerAddress,
            commitTxHash,
            paymentTxHashes,
            contentHash,
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
          op === 'edit' ? HUB_EARN_POINTS.tokenListingUpdate : HUB_EARN_POINTS.tokenListingCreate;
        const { delta, tier } = await resolveHubEarnDeltaForKaspaWallet(basePoints, payerAddress);
        const idempotency_key =
          op === 'edit' ? `ktl:update:${commitTxHash}` : `ktl:create:${commitTxHash}`;
        const source = op === 'edit' ? 'token_listing_update' : 'token_listing_create';
        if (delta > 0) {
          const ptsRes = await postWorkerPtsIngest({
            wallet: payerAddress,
            delta_pts: delta,
            source,
            idempotency_key,
            meta: { listingId, commitTxHash, op, basePoints, krexTier: tier },
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
      ptsIngest,
      ...(ptsIngestError ? { ptsIngestError } : {}),
    });
  } catch (error) {
    console.error('[tokens/verify]', error);
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
}
