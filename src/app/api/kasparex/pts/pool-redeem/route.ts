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

/**
 * Public user route: Kaspa-signed pool redeem → Worker pts debit + voucher → client submits vault.claim on Igra.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.PTS_REDEEM_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'redeem_not_configured' }, { status: 503 });
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

  const url = `${API_BASE.replace(/\/$/, '')}/kasparex/pts/redeem`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Pts-Redeem-Secret': secret,
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
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { error: 'upstream_failed', detail: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }
}
