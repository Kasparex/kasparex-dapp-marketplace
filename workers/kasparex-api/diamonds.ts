/**
 * Kasparex API - Diamonds (off-chain ledger)
 *
 * Diamonds are a cross-game utility currency:
 * - Earned from gameplay and controlled cashback on paid actions (KASPayment).
 * - Spent on perks/boosts/unlocks across games.
 * - Not directly convertible to GRID/KAS at a fixed rate.
 *
 * Endpoints here are read-heavy and safe for node-first serving.
 * Writes (earn/spend) should be routed through verified flows (payment verify, signed server events).
 */

import type { Env } from '../index';
import { getCorsHeaders } from '../middleware';

type DiamondsSummaryResponse = {
  ok: boolean;
  address: string;
  balance: number;
  earnedTotal: number;
  spentTotal: number;
  lastEventAt?: number;
};

function normalizeKaspaAddress(addr: string): string {
  const a = addr.trim();
  if (!a) return '';
  return a.toLowerCase().startsWith('kaspa:') ? a : `kaspa:${a}`;
}

function cacheKeySummary(addr: string) {
  return `diamonds:summary:${addr.toLowerCase()}`;
}

function cacheKeyDeck(addr: string) {
  return `wallet:deck:${addr.toLowerCase()}`;
}

type DiamondsSpendBody = {
  userAddress: string;
  amount: number;
  sink:
    | 'perk'
    | 'boost'
    | 'unlock'
    | 'insurance'
    | 'reroll'
    | 'cooldown_skip'
    | 'slot_upgrade'
    | 'tournament'
    | 'cosmetic'
    | 'other';
  gameId?: string;
  reason?: string;
  idempotencyKey: string;
};

async function invalidateCaches(env: Env, address: string) {
  try {
    await env.KASPAREX_CACHE.delete(cacheKeySummary(address));
    await env.KASPAREX_CACHE.delete(cacheKeyDeck(address));
  } catch {
    // ignore
  }
}

export async function handleDiamondsSummary(request: Request, env: Env): Promise<Response> {
  const cors = getCorsHeaders();
  try {
    const url = new URL(request.url);
    const raw = (url.searchParams.get('address') ?? '').trim();
    if (!raw) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing address.' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    const address = normalizeKaspaAddress(raw);

    const key = cacheKeySummary(address);
    const cached = await env.KASPAREX_CACHE.get<DiamondsSummaryResponse>(key, { type: 'json' });
    if (cached) {
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=15', 'X-Cache': 'HIT' },
      });
    }

    const row = await env.REWARDS_DB.prepare(
      `SELECT balance, earned_total, spent_total, last_event_at
       FROM user_diamonds_summary
       WHERE user_address = ?`
    )
      .bind(address)
      .first<{ balance: number; earned_total: number; spent_total: number; last_event_at: number | null }>();

    const res: DiamondsSummaryResponse = {
      ok: true,
      address,
      balance: Number(row?.balance ?? 0) || 0,
      earnedTotal: Number(row?.earned_total ?? 0) || 0,
      spentTotal: Number(row?.spent_total ?? 0) || 0,
      lastEventAt: row?.last_event_at ?? undefined,
    };

    await env.KASPAREX_CACHE.put(key, JSON.stringify(res), { expirationTtl: 15 });

    return new Response(JSON.stringify(res), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=15', 'X-Cache': 'MISS' },
    });
  } catch (error) {
    console.error('Diamonds summary error:', error);
    return new Response(JSON.stringify({ ok: false, error: 'Failed to load diamonds summary.' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
}

/**
 * POST /kasparex/diamonds/spend
 *
 * Server-authoritative Diamonds spending:
 * - Enforces balance check
 * - Enforces idempotency via ledger id = `spend_<idempotencyKey>`
 * - Updates `user_diamonds_summary`
 */
export async function handleDiamondsSpend(request: Request, env: Env): Promise<Response> {
  const cors = getCorsHeaders();
  try {
    const body = (await request.json()) as DiamondsSpendBody;
    const rawAddr = (body?.userAddress ?? '').trim();
    const idempotencyKey = (body?.idempotencyKey ?? '').trim();
    const sink = body?.sink;
    const amount = Math.floor(Number(body?.amount ?? 0));

    if (!rawAddr || !idempotencyKey || !sink) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing required fields.' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    if (idempotencyKey.length < 8 || idempotencyKey.length > 120) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid idempotencyKey.' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid amount.' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const address = normalizeKaspaAddress(rawAddr);
    const now = Date.now();
    const ledgerId = `spend_${idempotencyKey}`;

    // If this spend already exists, return it as success (idempotent).
    const existing = await env.REWARDS_DB.prepare(`SELECT id FROM diamonds_ledger WHERE id = ?`)
      .bind(ledgerId)
      .first<{ id: string }>();
    if (existing?.id) {
      return new Response(JSON.stringify({ ok: true, alreadyProcessed: true, id: ledgerId }), {
        status: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Ensure summary row exists.
    await env.REWARDS_DB.prepare(
      `INSERT INTO user_diamonds_summary (user_address, balance, earned_total, spent_total, last_event_at, updated_at)
       VALUES (?, 0, 0, 0, ?, ?)
       ON CONFLICT(user_address) DO NOTHING`
    )
      .bind(address, now, now)
      .run();

    // Atomically decrement balance iff enough balance.
    const upd = await env.REWARDS_DB.prepare(
      `UPDATE user_diamonds_summary
       SET balance = balance - ?,
           spent_total = spent_total + ?,
           last_event_at = ?,
           updated_at = ?
       WHERE user_address = ? AND balance >= ?`
    )
      .bind(amount, amount, now, now, address, amount)
      .run();

    if (!upd.success || upd.meta.changes !== 1) {
      return new Response(JSON.stringify({ ok: false, error: 'Insufficient Diamonds.' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const ins = await env.REWARDS_DB.prepare(
      `INSERT INTO diamonds_ledger
        (id, user_address, direction, amount, source, game_id, reason, related_tx_hash, related_sku_id, created_at)
       VALUES (?, ?, 'spend', ?, ?, ?, ?, NULL, NULL, ?)`
    )
      .bind(
        ledgerId,
        address,
        amount,
        sink,
        body.gameId ?? null,
        body.reason ?? null,
        now
      )
      .run();

    if (!ins.success) {
      // Best-effort: we already decremented balance. In practice D1 insert should not fail due to unique id.
      // Return error so client can retry with same idempotencyKey (will be caught by existing check above if insert eventually succeeds).
      return new Response(JSON.stringify({ ok: false, error: 'Failed to record spend.' }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    await invalidateCaches(env, address);

    return new Response(JSON.stringify({ ok: true, id: ledgerId, spent: amount }), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Diamonds spend error:', error);
    return new Response(JSON.stringify({ ok: false, error: 'Failed to spend Diamonds.' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
}

export async function handleDiamondsRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (pathname === '/kasparex/diamonds/summary' && request.method === 'GET') {
    return handleDiamondsSummary(request, env);
  }

  if (pathname === '/kasparex/diamonds/spend' && request.method === 'POST') {
    return handleDiamondsSpend(request, env);
  }

  return new Response('Not found', {
    status: 404,
    headers: getCorsHeaders(),
  });
}

