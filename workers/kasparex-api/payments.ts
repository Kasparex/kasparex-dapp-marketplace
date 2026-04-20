/**
 * Kasparex API - Unified L1 payment verification
 *
 * Purpose:
 * - Verify KAS-paid actions (entry/boost/unlock/slots) in one standardized way.
 * - Provide idempotency so the same tx cannot mint Diamonds/rewards twice.
 * - Bind tx payload/note to (gameId, skuId, sessionId, evmAddress) to prevent replay.
 */

import type { Env } from '../index';
import { getCorsHeaders } from '../middleware';

const PAYMENT_NOTE_PREFIX = 'KASPAREX_PAY_V1:';

function numEnv(env: Env, key: keyof Env, fallback: number): number {
  const raw = (env[key] ?? '') as string;
  const n = Number(String(raw).trim());
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function cacheKeyDeck(addr: string): string {
  return `wallet:deck:${addr.toLowerCase()}`;
}

function cacheKeyDiamondsSummary(addr: string): string {
  return `diamonds:summary:${addr.toLowerCase()}`;
}

type VerifyL1PaymentBody = {
  txHash: string;
  payerKaspaAddress: string;
  toKaspaAddress: string;
  minAmountKas: number;
  gameId?: string;
  skuId?: string;
  purchaseType?: string;
  sessionId?: string;
  evmAddress?: string;
};

type KaspaRestTx = {
  payload?: string;
  outputs?: Array<any>;
  inputs?: Array<any>;
  verboseData?: any;
  verbose_data?: any;
};

function normalizeKaspaAddress(addr: string): string {
  const a = (addr || '').trim();
  if (!a) return '';
  const lower = a.toLowerCase();
  return lower.startsWith('kaspa:') ? lower : `kaspa:${lower}`;
}

function kasToSompi(kas: number): number {
  const v = Number(kas);
  if (!Number.isFinite(v) || v <= 0) return 0;
  return Math.floor(v * 100_000_000);
}

function outputAddress(o: any): string | undefined {
  return (
    o?.script_public_key_address ??
    o?.scriptPublicKeyAddress ??
    o?.address ??
    (typeof o?.script_public_key === 'object' && typeof o?.script_public_key?.address === 'string'
      ? o.script_public_key.address
      : undefined)
  );
}

function sumOutputsToAddress(tx: KaspaRestTx, targetNorm: string): number {
  let sum = 0;
  for (const o of tx.outputs ?? []) {
    const addr = outputAddress(o);
    if (!addr) continue;
    const norm = normalizeKaspaAddress(addr);
    if (norm !== targetNorm) continue;
    const amt = typeof o.amount === 'string' ? parseInt(o.amount, 10) : Number(o.amount ?? 0);
    if (Number.isFinite(amt) && amt > 0) sum += amt;
  }
  return sum;
}

function payerAddressesFromTx(tx: KaspaRestTx): Set<string> {
  const set = new Set<string>();
  for (const inp of tx.inputs ?? []) {
    const vd = (inp as any)?.verboseData ?? (inp as any)?.verbose_data;
    const fromVerbose = vd && typeof vd === 'object' && typeof vd.address === 'string' ? vd.address : undefined;
    const a = (inp as any)?.previous_outpoint_address ?? (inp as any)?.previousOutpointAddress ?? fromVerbose;
    if (a && typeof a === 'string') {
      set.add(normalizeKaspaAddress(a));
    }
  }
  return set;
}

function getTxPayload(tx: KaspaRestTx): string | null | undefined {
  const p = (tx as any).payload;
  if (typeof p === 'string' && p.length > 0) return p;
  const vd = (tx as any).verboseData ?? (tx as any).verbose_data;
  if (vd && typeof vd === 'object' && typeof vd.payload === 'string' && vd.payload.length > 0) return vd.payload;
  return undefined;
}

export function buildKasparexPaymentNote(input: {
  gameId?: string;
  skuId?: string;
  sessionId?: string;
  evmAddress?: string;
}): string {
  const gameId = (input.gameId ?? '').trim();
  const skuId = (input.skuId ?? '').trim();
  const sessionId = (input.sessionId ?? '').trim();
  const evm = (input.evmAddress ?? '').trim().toLowerCase();
  return `${PAYMENT_NOTE_PREFIX}${gameId}|${skuId}|${sessionId}|${evm}`;
}

function parseKasparexPaymentNote(payload: string | null | undefined): {
  gameId: string;
  skuId: string;
  sessionId: string;
  evmAddress: string;
} | null {
  if (!payload || typeof payload !== 'string') return null;
  const t = payload.trim();
  if (!t.startsWith(PAYMENT_NOTE_PREFIX)) return null;
  const rest = t.slice(PAYMENT_NOTE_PREFIX.length);
  const parts = rest.split('|');
  if (parts.length < 4) return null;
  const [gameId, skuId, sessionId, evmAddress] = parts.map((x) => (x ?? '').trim());
  return { gameId, skuId, sessionId, evmAddress: evmAddress.toLowerCase() };
}

async function getRestTransactionById(txId: string): Promise<KaspaRestTx | null> {
  const hash = txId.replace(/^0x/i, '').toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(hash)) return null;
  const query = 'inputs=true&outputs=true&resolve_previous_outpoints=light';
  const urls = [
    `https://api.kaspa.org/transactions/${hash}?${query}`,
    `https://api.kaspa.org/v1/transactions/${hash}?${query}`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
      if (!res.ok) continue;
      const data = (await res.json()) as any;
      if (data && typeof data === 'object') return data as KaspaRestTx;
    } catch {
      // next
    }
  }
  return null;
}

export async function handleVerifyL1Payment(request: Request, env: Env): Promise<Response> {
  const cors = getCorsHeaders();
  try {
    const body = (await request.json()) as VerifyL1PaymentBody;
    if (!body?.txHash || !body?.payerKaspaAddress || !body?.toKaspaAddress) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing required fields.' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const txHash = body.txHash.replace(/^0x/i, '').toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(txHash)) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid txHash format.' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const payer = normalizeKaspaAddress(body.payerKaspaAddress);
    const to = normalizeKaspaAddress(body.toKaspaAddress);
    const minSompi = kasToSompi(Math.max(0.001, Number(body.minAmountKas || 0)));

    // Idempotency check (tx hash unique).
    const existing = await env.REWARDS_DB.prepare(`SELECT id FROM l1_payments_verified WHERE tx_hash = ?`)
      .bind(txHash)
      .first<{ id: string }>();
    if (existing?.id) {
      return new Response(JSON.stringify({ ok: true, alreadyVerified: true, paymentId: existing.id }), {
        status: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const tx = await getRestTransactionById(txHash);
    if (!tx) {
      return new Response(JSON.stringify({ ok: false, error: 'Transaction not found yet.' }), {
        status: 404,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const paidSompi = sumOutputsToAddress(tx, to);
    if (paidSompi < minSompi) {
      return new Response(JSON.stringify({ ok: false, error: 'Payment output too low.', paidSompi }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const payload = getTxPayload(tx) ?? null;
    const binding = parseKasparexPaymentNote(payload);
    if (binding) {
      if ((body.gameId ?? '').trim() && binding.gameId !== (body.gameId ?? '').trim()) {
        return new Response(JSON.stringify({ ok: false, error: 'Payment note gameId mismatch.' }), {
          status: 400,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }
      if ((body.skuId ?? '').trim() && binding.skuId !== (body.skuId ?? '').trim()) {
        return new Response(JSON.stringify({ ok: false, error: 'Payment note skuId mismatch.' }), {
          status: 400,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }
      if ((body.sessionId ?? '').trim() && binding.sessionId !== (body.sessionId ?? '').trim()) {
        return new Response(JSON.stringify({ ok: false, error: 'Payment note sessionId mismatch.' }), {
          status: 400,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }
      if ((body.evmAddress ?? '').trim() && binding.evmAddress !== (body.evmAddress ?? '').trim().toLowerCase()) {
        return new Response(JSON.stringify({ ok: false, error: 'Payment note evmAddress mismatch.' }), {
          status: 400,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }
    } else {
      // Require note for game payments (prevents replay across games).
      return new Response(JSON.stringify({ ok: false, error: 'Missing or invalid payment note payload.' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const payers = payerAddressesFromTx(tx);
    if (payers.size > 0 && !payers.has(payer)) {
      return new Response(JSON.stringify({ ok: false, error: 'Payer address mismatch (inputs do not match sender).' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const now = Date.now();
    const paymentId = `pay_${now}_${txHash.slice(0, 16)}`;
    const result = await env.REWARDS_DB.prepare(
      `INSERT INTO l1_payments_verified
        (id, tx_hash, user_address, to_address, amount_sompi, game_id, sku_id, purchase_type, session_id, evm_address, verified_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        paymentId,
        txHash,
        payer,
        to,
        paidSompi,
        body.gameId ?? null,
        body.skuId ?? null,
        body.purchaseType ?? null,
        body.sessionId ?? null,
        body.evmAddress ?? null,
        now
      )
      .run();

    if (!result.success) {
      return new Response(JSON.stringify({ ok: false, error: 'Failed to persist verification.' }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Diamonds cashback (payment_bonus) — idempotent and capped.
    // This is the sustainable “paid-action Diamonds bonus” from the plan.
    let diamondsMinted = 0;
    try {
      const rate = numEnv(env, 'DIAMONDS_PAYMENT_BONUS_PER_KAS', 10); // default: 10 diamonds per 1 KAS
      const txCap = Math.floor(numEnv(env, 'DIAMONDS_PAYMENT_BONUS_TX_CAP', 250));
      const dailyCap = Math.floor(numEnv(env, 'DIAMONDS_PAYMENT_BONUS_DAILY_CAP', 1000));

      const paidKas = paidSompi / 100_000_000;
      const base = Math.floor(paidKas * rate);
      const target = Math.max(0, Math.min(txCap, base));

      if (target > 0) {
        // If already minted for this tx, skip.
        const existingBonus = await env.REWARDS_DB.prepare(
          `SELECT id FROM diamonds_ledger WHERE related_tx_hash = ? AND source = 'payment_bonus' LIMIT 1`
        )
          .bind(txHash)
          .first<{ id: string }>();

        if (!existingBonus?.id) {
          const dayStart = new Date();
          dayStart.setUTCHours(0, 0, 0, 0);
          const dayStartMs = dayStart.getTime();

          const earnedToday = await env.REWARDS_DB.prepare(
            `SELECT COALESCE(SUM(amount), 0) as sum
             FROM diamonds_ledger
             WHERE user_address = ?
               AND direction = 'earn'
               AND source = 'payment_bonus'
               AND created_at >= ?`
          )
            .bind(payer, dayStartMs)
            .first<{ sum: number }>();

          const already = Math.floor(Number(earnedToday?.sum ?? 0) || 0);
          const remaining = Math.max(0, dailyCap - already);
          const mint = Math.max(0, Math.min(target, remaining));

          if (mint > 0) {
            const ledgerId = `dia_${now}_${txHash.slice(0, 12)}`;
            const insert = await env.REWARDS_DB.prepare(
              `INSERT INTO diamonds_ledger
                (id, user_address, direction, amount, source, game_id, reason, related_tx_hash, related_sku_id, created_at)
               VALUES (?, ?, 'earn', ?, 'payment_bonus', ?, ?, ?, ?, ?)`
            )
              .bind(
                ledgerId,
                payer,
                mint,
                body.gameId ?? null,
                `cashback:${body.purchaseType ?? 'other'}`,
                txHash,
                body.skuId ?? null,
                now
              )
              .run();

            if (insert.success) {
              // Upsert summary
              await env.REWARDS_DB.prepare(
                `INSERT INTO user_diamonds_summary (user_address, balance, earned_total, spent_total, last_event_at, updated_at)
                 VALUES (?, ?, ?, 0, ?, ?)
                 ON CONFLICT(user_address) DO UPDATE SET
                   balance = balance + excluded.balance,
                   earned_total = earned_total + excluded.earned_total,
                   last_event_at = excluded.last_event_at,
                   updated_at = excluded.updated_at`
              )
                .bind(payer, mint, mint, now, now)
                .run();

              diamondsMinted = mint;

              // Invalidate caches (best-effort)
              try {
                await env.KASPAREX_CACHE.delete(cacheKeyDeck(payer));
                await env.KASPAREX_CACHE.delete(cacheKeyDiamondsSummary(payer));
              } catch {
                // ignore
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('Diamonds cashback mint skipped:', e);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        paymentId,
        paidSompi,
        paidKas: paidSompi / 100_000_000,
        diamondsMinted,
      }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Verify L1 payment error:', error);
    return new Response(JSON.stringify({ ok: false, error: 'Internal error.' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
}

export async function handlePaymentsRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (pathname === '/kasparex/payments/l1/verify' && request.method === 'POST') {
    return handleVerifyL1Payment(request, env);
  }

  return new Response('Not found', {
    status: 404,
    headers: getCorsHeaders(),
  });
}

