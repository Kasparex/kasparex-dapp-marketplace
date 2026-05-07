/**
 * Server-only: credit Worker D1 pts via ingest (same secret as Cloudflare `PTS_INGEST_SECRET`).
 */

import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';

const API_BASE =
  process.env.KASPAREX_INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_KASPAREX_API_URL ||
  'https://api.kasparex.com';

export async function postWorkerPtsIngest(args: {
  wallet: string;
  delta_pts: number;
  source: string;
  idempotency_key: string;
  meta?: Record<string, unknown>;
}): Promise<{ ok: boolean; status: number; error?: string }> {
  const secret = process.env.PTS_INGEST_SECRET?.trim();
  if (!secret) {
    return { ok: false, status: 503, error: 'ingest_not_configured' };
  }
  let walletNorm = args.wallet.trim();
  try {
    walletNorm = normalizeKaspaAddress(args.wallet).trim().toLowerCase();
  } catch {
    walletNorm = walletNorm.toLowerCase();
  }
  const url = `${API_BASE.replace(/\/$/, '')}/kasparex/pts/ingest`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Pts-Ingest-Secret': secret,
    },
    body: JSON.stringify({
      wallet: walletNorm,
      delta_pts: args.delta_pts,
      source: args.source,
      idempotency_key: args.idempotency_key,
      meta: args.meta,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: typeof data.error === 'string' ? data.error : 'ingest_failed',
    };
  }
  return { ok: true, status: res.status };
}
