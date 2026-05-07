import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthFromRequest } from '@/lib/kaspa/verify';
import { getContractAddress } from '@/lib/contracts/addresses';
import { getL2KREXConfig } from '@/lib/krex/l2-krex-config';
import { isTokenPoolClaimItem, UNIFIED_REWARD_CATALOG } from '@/lib/rewards/unified-catalog';
import { parsePoolRedeemKaspaMessage } from '@/lib/rewards/pool-redeem-message';

const IGRA_MAINNET_CHAIN_ID = 38833;

const API_BASE =
  process.env.KASPAREX_INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_KASPAREX_API_URL ||
  'https://api.kasparex.com';

const POOL_MESSAGE_MAX_AGE_SEC = 15 * 60;

const POOL_PREFUND_MAX_PTS = Math.max(
  1,
  Math.min(
    50_000_000,
    Math.floor(Number(process.env.POOL_PREFUND_MAX_PTS || '2000000') || 2_000_000),
  ),
);

/** When Worker returns 401 on ingest or redeem shared secrets. */
const PTS_SECRET_MISMATCH_DETAIL =
    'The rewards API rejected the shared secrets. In Cloudflare Worker secrets, `PTS_INGEST_SECRET` secures ingest; `PTS_REDEEM_SECRET` secures redeem (if unset there, redeem falls back to the ingest secret). In Vercel Production env, set `PTS_INGEST_SECRET` to the Worker value. Set `PTS_REDEEM_SECRET` to the same value as on the Worker, or omit it on Vercel if this app may use only `PTS_INGEST_SECRET` (Next falls back the same way as the Worker). Values are compared after trimming leading or trailing whitespace. Redeploy the Worker and Next after saving.';

function isWorkerPtsSecretUnauthorized(status: number, err: string): boolean {
  if (status !== 401) return false;
  return (
    err === 'unauthorized' ||
    err === 'unauthorized_ingest' ||
    err === 'unauthorized_redeem'
  );
}

async function workerGetBalance(walletForQuery: string): Promise<number> {
  const u = `${API_BASE.replace(/\/$/, '')}/kasparex/pts/balance?wallet=${encodeURIComponent(walletForQuery)}`;
  const r = await fetch(u);
  const j = (await r.json().catch(() => ({}))) as { balance_pts?: number };
  if (!r.ok || typeof j.balance_pts !== 'number' || !Number.isFinite(j.balance_pts)) return 0;
  return Math.max(0, Math.floor(j.balance_pts));
}

async function workerPrefundIngest(args: {
  wallet_norm: string;
  delta_pts: number;
  idempotency_key: string;
  nonce: string;
}): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const ingestSecret = process.env.PTS_INGEST_SECRET?.trim();
  if (!ingestSecret) {
    return { ok: false, error: 'ingest_not_configured', status: 503 };
  }
  const url = `${API_BASE.replace(/\/$/, '')}/kasparex/pts/ingest`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Pts-Ingest-Secret': ingestSecret,
      },
      body: JSON.stringify({
        wallet: args.wallet_norm,
        delta_pts: args.delta_pts,
        source: 'pool_unified_prefund',
        idempotency_key: args.idempotency_key,
        meta: { pool_nonce: args.nonce },
      }),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      const err = typeof data.error === 'string' ? data.error : 'prefund_failed';
      return { ok: false, error: err, status: res.status };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'prefund_fetch_failed',
      status: 502,
    };
  }
}

/**
 * Public user route: Kaspa-signed pool redeem → Worker pts debit + voucher → client submits vault.claim on Igra.
 */
export async function POST(req: NextRequest) {
  const redeemSecret =
    process.env.PTS_REDEEM_SECRET?.trim() || process.env.PTS_INGEST_SECRET?.trim();
  if (!redeemSecret) {
    return NextResponse.json(
      {
        error: 'redeem_not_configured',
        detail: 'Set PTS_REDEEM_SECRET and/or PTS_INGEST_SECRET on Vercel to match the Worker.',
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const message = typeof b.message === 'string' ? b.message : '';
  const signature = typeof b.signature === 'string' ? b.signature : '';
  const address = typeof b.kaspa_address === 'string' ? b.kaspa_address.trim() : '';

  if (!message || !signature || !address) {
    return NextResponse.json({ error: 'missing message, signature, or kaspa_address' }, { status: 400 });
  }

  const auth = await verifyAuthFromRequest({ address, message, signature });
  if (!auth.valid) {
    return NextResponse.json({ error: 'invalid_kaspa_signature', detail: auth.error }, { status: 401 });
  }

  const parsed = parsePoolRedeemKaspaMessage(message);
  if (!parsed) {
    return NextResponse.json({ error: 'invalid_message_format' }, { status: 400 });
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (parsed.expiresUnix < nowSec) {
    return NextResponse.json({ error: 'message_expired' }, { status: 400 });
  }
  if (parsed.expiresUnix > nowSec + POOL_MESSAGE_MAX_AGE_SEC) {
    return NextResponse.json({ error: 'expiry_too_far' }, { status: 400 });
  }

  const walletNorm = parsed.walletKaspa.trim().toLowerCase();
  if (walletNorm !== address.trim().toLowerCase()) {
    return NextResponse.json({ error: 'wallet_mismatch' }, { status: 400 });
  }

  const catalogItem = UNIFIED_REWARD_CATALOG.find((i) => i.id === parsed.catalogItemId);
  if (
    !catalogItem ||
    !isTokenPoolClaimItem(catalogItem) ||
    catalogItem.fulfillment !== 'l2_contract' ||
    !catalogItem.tokenPoolRate
  ) {
    return NextResponse.json({ error: 'invalid_catalog_item' }, { status: 400 });
  }

  if (parsed.ptsSpent !== Math.floor(parsed.ptsSpent) || parsed.ptsSpent < 1) {
    return NextResponse.json({ error: 'invalid_pts' }, { status: 400 });
  }

  const evm = parsed.evmBeneficiary.trim().toLowerCase();
  if (!/^0x[a-f0-9]{40}$/.test(evm)) {
    return NextResponse.json({ error: 'invalid_evm' }, { status: 400 });
  }

  let tokenAddress: string;
  if (catalogItem.tokenPoolRate.payoutSymbol === 'GRID') {
    tokenAddress = (
      getContractAddress(IGRA_MAINNET_CHAIN_ID, 'GRIDToken') || '0x05E02a8b14CD7974c6102CDB855F2dCd8E1f4902'
    ).toLowerCase();
  } else {
    const krex = getL2KREXConfig(IGRA_MAINNET_CHAIN_ID);
    if (!krex) {
      return NextResponse.json({ error: 'krex_not_configured' }, { status: 503 });
    }
    tokenAddress = krex.tokenAddress.toLowerCase();
  }

  if (!tokenAddress.startsWith('0x') || tokenAddress.length !== 42) {
    return NextResponse.json({ error: 'token_resolve_failed' }, { status: 503 });
  }

  const wholeTokens = BigInt(parsed.ptsSpent) * BigInt(catalogItem.tokenPoolRate.tokensPerPoint);
  const amountWei = wholeTokens * 10n ** 18n;

  const balanceBefore = await workerGetBalance(parsed.walletKaspa);
  let shortfall = Math.max(0, parsed.ptsSpent - balanceBefore);
  if (shortfall > POOL_PREFUND_MAX_PTS) {
    return NextResponse.json(
      {
        error: 'prefund_cap_exceeded',
        detail: `Need ${shortfall} server pts alignment; cap is ${POOL_PREFUND_MAX_PTS}. Smaller claim or raise POOL_PREFUND_MAX_PTS.`,
      },
      { status: 400 },
    );
  }
  if (shortfall > 0) {
    const prefKey = `pool_prefund:${walletNorm}:${parsed.nonce}`;
    const pf = await workerPrefundIngest({
      wallet_norm: walletNorm,
      delta_pts: shortfall,
      idempotency_key: prefKey,
      nonce: parsed.nonce,
    });
    if (!pf.ok) {
      if (isWorkerPtsSecretUnauthorized(pf.status, pf.error)) {
        return NextResponse.json(
          { error: 'redeem_unauthorized', detail: PTS_SECRET_MISMATCH_DETAIL },
          { status: 401 },
        );
      }
      return NextResponse.json({ error: pf.error }, { status: pf.status });
    }
  }

  const url = `${API_BASE.replace(/\/$/, '')}/kasparex/pts/redeem`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Pts-Redeem-Secret': redeemSecret,
      },
      body: JSON.stringify({
        wallet_kaspa: walletNorm,
        evm_beneficiary: evm,
        token_address: tokenAddress,
        amount_wei: amountWei.toString(),
        pts_spent: parsed.ptsSpent,
        request_id: parsed.nonce,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const errStr = typeof data.error === 'string' ? data.error : '';
    if (isWorkerPtsSecretUnauthorized(res.status, errStr)) {
      return NextResponse.json(
        { error: 'redeem_unauthorized', detail: PTS_SECRET_MISMATCH_DETAIL },
        { status: 401 },
      );
    }
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { error: 'upstream_failed', detail: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }
}
