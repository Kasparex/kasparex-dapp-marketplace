/**
 * Kasparex API - Wallet endpoints for the unified Deck
 *
 * These are read-heavy endpoints meant to be served node-first with fallback.
 * They summarize reward/points state so the UI doesn't need multiple round-trips.
 */

import type { Env } from '../index';
import { getCorsHeaders } from '../middleware';

type RewardRow = {
  id: string;
  tx_hash: string;
  dapp_id: string;
  action_type: string;
  action_value: number;
  grid_reward: number | null;
  status: string;
  created_at: number;
  updated_at: number;
  distributed_at: number | null;
};

export type WalletDeckResponse = {
  ok: boolean;
  address: string;
  rewards: {
    pendingCount: number;
    pendingGrid: number;
    totalGrid: number;
    totalRewards: number;
    lastRewardAt?: number;
    recent: Array<{
      id: string;
      txHash: string;
      dappId: string;
      actionType: string;
      actionValue: number;
      gridReward?: number;
      status: string;
      createdAt: number;
      distributedAt?: number;
    }>;
  };
  diamonds?: { balance: number; earnedTotal: number; spentTotal: number };
  perGame?: {
    rewardsByGame: Array<{ gameId: string; pendingGrid: number; totalGrid: number; count: number }>;
    diamondsByGame: Array<{ gameId: string; earned: number; spent: number }>;
  };
  settings?: { autoClaimEnabled: boolean; autoClaimMinGrid: number };
};

export type WalletHistoryResponse = {
  ok: boolean;
  address: string;
  items: Array<{
    id: string;
    txHash: string;
    network: 'L1' | 'L2' | 'vProgs';
    dappId: string;
    actionType: string;
    actionValue: number;
    status: string;
    gridReward?: number;
    createdAt: number;
    distributedAt?: number;
  }>;
  nextCursor?: string;
};

function normalizeKaspaAddress(addr: string): string {
  const a = addr.trim();
  if (!a) return '';
  return a.toLowerCase().startsWith('kaspa:') ? a : `kaspa:${a}`;
}

function cacheKeyDeck(addr: string): string {
  return `wallet:deck:${addr.toLowerCase()}`;
}

export async function handleWalletDeck(request: Request, env: Env): Promise<Response> {
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

    const key = cacheKeyDeck(address);
    const cached = await env.KASPAREX_CACHE.get<WalletDeckResponse>(key, { type: 'json' });
    if (cached) {
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: {
          ...cors,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=10',
          'X-Cache': 'HIT',
        },
      });
    }

    // Summary row (if it exists).
    const summary = await env.REWARDS_DB.prepare(
      `SELECT total_rewards, total_grid_reward, last_reward_at
       FROM user_reward_summary
       WHERE user_address = ?`
    )
      .bind(address)
      .first<{ total_rewards: number; total_grid_reward: number; last_reward_at: number | null }>();

    // Pending aggregates (active table).
    const pending = await env.REWARDS_DB.prepare(
      `SELECT
         COUNT(*) as pending_count,
         COALESCE(SUM(COALESCE(grid_reward, 0)), 0) as pending_grid
       FROM rewards_active
       WHERE user_address = ?
         AND status IN ('pending','processing')`
    )
      .bind(address)
      .first<{ pending_count: number; pending_grid: number }>();

    // Recent rows for auditability/UI tables.
    const recent = await env.REWARDS_DB.prepare(
      `SELECT id, tx_hash, dapp_id, action_type, action_value, grid_reward, status, created_at, updated_at, distributed_at
       FROM rewards_active
       WHERE user_address = ?
       ORDER BY created_at DESC
       LIMIT 20`
    )
      .bind(address)
      .all<RewardRow>();

    const diamondsSummary = await env.REWARDS_DB.prepare(
      `SELECT balance, earned_total, spent_total
       FROM user_diamonds_summary
       WHERE user_address = ?`
    )
      .bind(address)
      .first<{ balance: number; earned_total: number; spent_total: number }>();

    const settingsRow = await env.REWARDS_DB.prepare(
      `SELECT auto_claim_enabled, auto_claim_min_grid
       FROM user_reward_settings
       WHERE user_address = ?`
    )
      .bind(address)
      .first<{ auto_claim_enabled: number; auto_claim_min_grid: number }>();

    const rewardsByGame = await env.REWARDS_DB.prepare(
      `SELECT
         dapp_id as game_id,
         COUNT(*) as count,
         COALESCE(SUM(CASE WHEN status IN ('pending','processing') THEN COALESCE(grid_reward,0) ELSE 0 END), 0) as pending_grid,
         COALESCE(SUM(COALESCE(grid_reward,0)), 0) as total_grid
       FROM rewards_active
       WHERE user_address = ?
       GROUP BY dapp_id
       ORDER BY total_grid DESC
       LIMIT 30`
    )
      .bind(address)
      .all<{ game_id: string; count: number; pending_grid: number; total_grid: number }>();

    const diamondsByGame = await env.REWARDS_DB.prepare(
      `SELECT
         COALESCE(game_id,'unknown') as game_id,
         COALESCE(SUM(CASE WHEN direction='earn' THEN amount ELSE 0 END),0) as earned,
         COALESCE(SUM(CASE WHEN direction='spend' THEN amount ELSE 0 END),0) as spent
       FROM diamonds_ledger
       WHERE user_address = ?
       GROUP BY COALESCE(game_id,'unknown')
       ORDER BY earned DESC
       LIMIT 30`
    )
      .bind(address)
      .all<{ game_id: string; earned: number; spent: number }>();

    const response: WalletDeckResponse = {
      ok: true,
      address,
      rewards: {
        pendingCount: pending?.pending_count ?? 0,
        pendingGrid: Number(pending?.pending_grid ?? 0) || 0,
        totalGrid: Number(summary?.total_grid_reward ?? 0) || 0,
        totalRewards: Number(summary?.total_rewards ?? 0) || 0,
        lastRewardAt: summary?.last_reward_at ?? undefined,
        recent: (recent.results ?? []).map((r) => ({
          id: r.id,
          txHash: r.tx_hash,
          dappId: r.dapp_id,
          actionType: r.action_type,
          actionValue: Number(r.action_value ?? 0) || 0,
          gridReward: r.grid_reward == null ? undefined : Number(r.grid_reward) || 0,
          status: r.status,
          createdAt: r.created_at,
          distributedAt: r.distributed_at == null ? undefined : r.distributed_at,
        })),
      },
      diamonds: {
        balance: Number(diamondsSummary?.balance ?? 0) || 0,
        earnedTotal: Number(diamondsSummary?.earned_total ?? 0) || 0,
        spentTotal: Number(diamondsSummary?.spent_total ?? 0) || 0,
      },
      perGame: {
        rewardsByGame: (rewardsByGame.results ?? []).map((r) => ({
          gameId: r.game_id,
          pendingGrid: Number(r.pending_grid ?? 0) || 0,
          totalGrid: Number(r.total_grid ?? 0) || 0,
          count: Number(r.count ?? 0) || 0,
        })),
        diamondsByGame: (diamondsByGame.results ?? []).map((r) => ({
          gameId: r.game_id,
          earned: Number(r.earned ?? 0) || 0,
          spent: Number(r.spent ?? 0) || 0,
        })),
      },
      settings: {
        autoClaimEnabled: Boolean((settingsRow?.auto_claim_enabled ?? 0) === 1),
        autoClaimMinGrid: Number(settingsRow?.auto_claim_min_grid ?? 0) || 0,
      },
    };

    await env.KASPAREX_CACHE.put(key, JSON.stringify(response), { expirationTtl: 10 });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...cors,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=10',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('Wallet deck error:', error);
    return new Response(JSON.stringify({ ok: false, error: 'Failed to load wallet deck.' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
}

function cacheKeyHistory(addr: string, cursor: string, limit: number): string {
  return `wallet:history:${addr.toLowerCase()}:${cursor || 'start'}:${limit}`;
}

function encodeCursor(createdAt: number, id: string): string {
  return `${createdAt}:${id}`;
}

function decodeCursor(cursor: string | null): { createdAt: number; id: string } | null {
  if (!cursor) return null;
  const parts = cursor.split(':');
  if (parts.length < 2) return null;
  const createdAt = Number(parts[0]);
  if (!Number.isFinite(createdAt) || createdAt <= 0) return null;
  const id = parts.slice(1).join(':');
  if (!id) return null;
  return { createdAt, id };
}

/**
 * GET /kasparex/wallet/history?address=...&cursor=...&limit=...
 *
 * Node-first friendly history feed (rewards ledger right now).
 */
export async function handleWalletHistory(request: Request, env: Env): Promise<Response> {
  const cors = getCorsHeaders();
  try {
    const url = new URL(request.url);
    const raw = (url.searchParams.get('address') ?? '').trim();
    const limitRaw = (url.searchParams.get('limit') ?? '').trim();
    const cursor = (url.searchParams.get('cursor') ?? '').trim();
    if (!raw) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing address.' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    const address = normalizeKaspaAddress(raw);
    const limit = Math.max(5, Math.min(50, Number(limitRaw || '20') || 20));

    const key = cacheKeyHistory(address, cursor, limit);
    const cached = await env.KASPAREX_CACHE.get<WalletHistoryResponse>(key, { type: 'json' });
    if (cached) {
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: {
          ...cors,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=10',
          'X-Cache': 'HIT',
        },
      });
    }

    const c = decodeCursor(cursor);
    const whereCursor = c ? 'AND (created_at < ? OR (created_at = ? AND id < ?))' : '';

    const stmt = env.REWARDS_DB.prepare(
      `SELECT id, tx_hash, dapp_id, action_type, action_value, grid_reward, status, network, created_at, distributed_at
       FROM rewards_active
       WHERE user_address = ?
       ${whereCursor}
       ORDER BY created_at DESC, id DESC
       LIMIT ?`
    );

    const bound = c
      ? stmt.bind(address, c.createdAt, c.createdAt, c.id, limit)
      : stmt.bind(address, limit);

    const rows = await bound.all<
      RewardRow & { network: 'L1' | 'L2' | 'vProgs' }
    >();

    const items = (rows.results ?? []).map((r) => ({
      id: r.id,
      txHash: r.tx_hash,
      network: (r as any).network ?? 'L1',
      dappId: r.dapp_id,
      actionType: r.action_type,
      actionValue: Number(r.action_value ?? 0) || 0,
      status: r.status,
      gridReward: r.grid_reward == null ? undefined : Number(r.grid_reward) || 0,
      createdAt: r.created_at,
      distributedAt: r.distributed_at == null ? undefined : r.distributed_at,
    }));

    const nextCursor = items.length > 0 ? encodeCursor(items[items.length - 1].createdAt, items[items.length - 1].id) : undefined;

    const response: WalletHistoryResponse = {
      ok: true,
      address,
      items,
      nextCursor,
    };

    await env.KASPAREX_CACHE.put(key, JSON.stringify(response), { expirationTtl: 10 });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...cors,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=10',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('Wallet history error:', error);
    return new Response(JSON.stringify({ ok: false, error: 'Failed to load wallet history.' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
}

type WalletSettingsBody = {
  userAddress: string;
  autoClaimEnabled: boolean;
  autoClaimMinGrid: number;
};

export async function handleWalletSettingsGet(request: Request, env: Env): Promise<Response> {
  const cors = getCorsHeaders();
  const url = new URL(request.url);
  const raw = (url.searchParams.get('address') ?? '').trim();
  if (!raw) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing address.' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
  const address = normalizeKaspaAddress(raw);
  const row = await env.REWARDS_DB.prepare(
    `SELECT auto_claim_enabled, auto_claim_min_grid FROM user_reward_settings WHERE user_address = ?`
  )
    .bind(address)
    .first<{ auto_claim_enabled: number; auto_claim_min_grid: number }>();
  return new Response(
    JSON.stringify({
      ok: true,
      address,
      autoClaimEnabled: Boolean((row?.auto_claim_enabled ?? 0) === 1),
      autoClaimMinGrid: Number(row?.auto_claim_min_grid ?? 0) || 0,
    }),
    { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
  );
}

export async function handleWalletSettingsSet(request: Request, env: Env): Promise<Response> {
  const cors = getCorsHeaders();
  try {
    const body = (await request.json()) as WalletSettingsBody;
    const raw = (body?.userAddress ?? '').trim();
    if (!raw) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing userAddress.' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    const address = normalizeKaspaAddress(raw);
    const enabled = Boolean(body.autoClaimEnabled);
    const minGrid = Math.max(0, Number(body.autoClaimMinGrid ?? 0) || 0);
    const now = Date.now();

    await env.REWARDS_DB.prepare(
      `INSERT INTO user_reward_settings (user_address, auto_claim_enabled, auto_claim_min_grid, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_address) DO UPDATE SET
         auto_claim_enabled = excluded.auto_claim_enabled,
         auto_claim_min_grid = excluded.auto_claim_min_grid,
         updated_at = excluded.updated_at`
    )
      .bind(address, enabled ? 1 : 0, minGrid, now)
      .run();

    try {
      await env.KASPAREX_CACHE.delete(cacheKeyDeck(address));
    } catch {
      // ignore
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Wallet settings set error:', error);
    return new Response(JSON.stringify({ ok: false, error: 'Failed to save settings.' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
}

/**
 * GET /kasparex/wallet/nodes?address=kaspa:...
 * Lists Krex nodes registered to a wallet (for operator dashboard).
 */
export async function handleWalletNodes(request: Request, env: Env): Promise<Response> {
  const cors = getCorsHeaders();
  const url = new URL(request.url);
  const raw = (url.searchParams.get('address') ?? '').trim();
  if (!raw) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing address.' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
  const address = normalizeKaspaAddress(raw);
  try {
    const rows = await env.NODES_DB.prepare(
      `SELECT node_id, node_name, role, region, url, version, last_ping, uptime_hours, status, requests_served_total, created_at,
              verified_txid, verified_at
       FROM nodes WHERE LOWER(owner_wallet) = LOWER(?)
       ORDER BY created_at DESC`
    )
      .bind(address)
      .all<{
        node_id: string;
        node_name: string;
        role: string;
        region: string;
        url: string;
        version: string;
        last_ping: number;
        uptime_hours: number;
        status: string;
        requests_served_total: number;
        created_at: number;
        verified_txid: string | null;
        verified_at: number | null;
      }>();

    return new Response(
      JSON.stringify({ ok: true, address, nodes: rows.results ?? [] }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Wallet nodes error:', error);
    return new Response(JSON.stringify({ ok: false, error: 'Failed to load nodes.' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
}

export async function handleWalletRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (pathname === '/kasparex/wallet/nodes' && request.method === 'GET') {
    return handleWalletNodes(request, env);
  }

  if (pathname === '/kasparex/wallet/deck' && request.method === 'GET') {
    return handleWalletDeck(request, env);
  }

  if (pathname === '/kasparex/wallet/history' && request.method === 'GET') {
    return handleWalletHistory(request, env);
  }

  if (pathname === '/kasparex/wallet/settings' && request.method === 'GET') {
    return handleWalletSettingsGet(request, env);
  }

  if (pathname === '/kasparex/wallet/settings' && request.method === 'POST') {
    return handleWalletSettingsSet(request, env);
  }

  return new Response('Not found', {
    status: 404,
    headers: getCorsHeaders(),
  });
}

