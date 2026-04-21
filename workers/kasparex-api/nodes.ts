/**
 * Kasparex API — Krex Node registry, heartbeats, status, runtime config.
 */

import type { Env } from '../index';
import { getCorsHeaders } from '../middleware';
import { verifyNodeRequestHmac } from './node-crypto';
import {
  handleNodeChallenge,
  handleNodeVerifyWallet,
  handleNodeEnroll,
  handleNodeRotateSecret,
  handleNodeUpdateDetails,
} from './node-enrollment';
import { handleNodeVerifyOnchain } from './node-onchain';
import { handleGetNodeRewards } from './rewards';

export interface Node {
  node_id: string;
  node_name: string;
  role: 'light' | 'mirror' | 'super';
  owner_wallet: string;
  region: string;
  version: string;
  url: string;
  last_ping: number;
  uptime_hours: number;
  pinned_cids: string[];
  created_at: number;
  status?: string;
  requests_served_total?: number;
  requests_served_epoch?: number;
  last_seq?: number;
  verified_txid?: string | null;
  verified_at?: number | null;
}

export interface NodeRegistration {
  node_id: string;
  node_name: string;
  role: 'light' | 'mirror' | 'super';
  owner_wallet: string;
  region: string;
  version: string;
  url: string;
  pinned_cids?: string[];
}

export interface NodePing {
  node_id: string;
  status?: 'online' | 'offline';
  pinned_cids?: string[];
  /** Optional cumulative requests served (mirror); used for activity score. */
  requests_served_total?: number;
  /** Optional details refresh (requires enrolled HMAC secret). */
  node_name?: string;
  role?: 'light' | 'mirror' | 'super';
  region?: string;
  url?: string;
  version?: string;
  /** Monotonic wire sequence; rejects replays. */
  seq?: number;
  /** Unique id per request for replay protection (stored in KV). */
  nonce?: string;
}

async function getNodeHmacSecret(env: Env, nodeId: string): Promise<string | null> {
  return env.KASPAREX_CACHE.get(`node:hmac:${nodeId}`);
}

async function requireValidNodeHmac(
  env: Env,
  nodeId: string,
  request: Request,
  bodyText: string
): Promise<Response | null> {
  const strict = env.KREX_NODE_REQUIRE_HMAC === 'true';
  const secret = await getNodeHmacSecret(env, nodeId);
  if (!secret) {
    if (strict) {
      return new Response(JSON.stringify({ error: 'Node HMAC secret missing; enroll first.' }), {
        status: 403,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      });
    }
    return null;
  }

  const ts = request.headers.get('X-Krex-Timestamp');
  const nonce = request.headers.get('X-Krex-Nonce');
  const sig = request.headers.get('X-Krex-Signature');
  const v = await verifyNodeRequestHmac(secret, ts, nonce, bodyText, sig, 120);
  if (!v.ok) {
    return new Response(JSON.stringify({ error: v.error }), {
      status: 401,
      headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
    });
  }
  return null;
}

async function consumeNonce(env: Env, nodeId: string, nonce: string): Promise<boolean> {
  const key = `node:nonce:${nodeId}:${nonce}`;
  const existing = await env.RATE_LIMIT?.get(key);
  if (existing) return false;
  if (env.RATE_LIMIT) {
    await env.RATE_LIMIT.put(key, '1', { expirationTtl: 600 });
  }
  return true;
}

function hourBucketTs(ts: number): number {
  return Math.floor(ts / (60 * 60 * 1000)) * (60 * 60 * 1000);
}

async function recomputeUptimeFromSlices(env: Env, nodeId: string): Promise<number> {
  const since = Date.now() - 24 * 60 * 60 * 1000;
  const row = await env.NODES_DB.prepare(
    `SELECT COALESCE(SUM(ping_count), 0) as c FROM node_uptime_slices WHERE node_id = ? AND hour_ts >= ?`
  )
    .bind(nodeId, since)
    .first<{ c: number }>();
  const pings = Number(row?.c ?? 0) || 0;
  return pings / 60;
}

/**
 * POST /kasparex/node/register — legacy path; HMAC required when node has enrolled secret.
 */
export async function handleNodeRegister(request: Request, env: Env): Promise<Response> {
  const cors = getCorsHeaders();
  try {
    const bodyText = await request.text();
    const body: NodeRegistration = JSON.parse(bodyText);

    if (!body.node_id || !body.node_name || !body.role || !body.owner_wallet || !body.url) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const hmacErr = await requireValidNodeHmac(env, body.node_id, request, bodyText);
    if (hmacErr) return hmacErr;

    if (!['light', 'mirror', 'super'].includes(body.role)) {
      return new Response(JSON.stringify({ error: 'Invalid role. Must be light, mirror, or super' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const now = Date.now();
    const pinnedCids = JSON.stringify(body.pinned_cids || []);

    await env.NODES_DB.prepare(
      `INSERT INTO nodes (
        node_id, node_name, role, owner_wallet, region, version, url,
        last_ping, uptime_hours, pinned_cids, created_at, status,
        requests_served_total, requests_served_epoch, last_seq, binding_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 'active', 0, 0, 0, 0)
      ON CONFLICT(node_id) DO UPDATE SET
        node_name = excluded.node_name,
        role = excluded.role,
        owner_wallet = excluded.owner_wallet,
        region = excluded.region,
        version = excluded.version,
        url = excluded.url,
        pinned_cids = excluded.pinned_cids`
    )
      .bind(
        body.node_id,
        body.node_name,
        body.role,
        body.owner_wallet,
        body.region || 'unknown',
        body.version || '1.0.0',
        body.url,
        now,
        pinnedCids,
        now
      )
      .run();

    return new Response(JSON.stringify({ success: true, node_id: body.node_id }), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Node registration error:', error);
    return new Response(JSON.stringify({ error: 'Failed to register node' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
}

/**
 * POST /kasparex/node/ping — updates slices + last_ping; optional HMAC when enrolled.
 */
export async function handleNodePing(request: Request, env: Env): Promise<Response> {
  const cors = getCorsHeaders();
  try {
    const bodyText = await request.text();
    const body: NodePing = JSON.parse(bodyText);

    if (!body.node_id) {
      return new Response(JSON.stringify({ error: 'Missing node_id' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Ensure node exists (avoid FK failures on node_uptime_slices).
    const exists = await env.NODES_DB.prepare(`SELECT node_id FROM nodes WHERE node_id = ?`)
      .bind(body.node_id)
      .first<{ node_id: string }>();
    if (!exists) {
      return new Response(JSON.stringify({ error: 'Node not registered. Enroll first.' }), {
        status: 404,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const hmacErr = await requireValidNodeHmac(env, body.node_id, request, bodyText);
    if (hmacErr) return hmacErr;

    if (body.nonce && env.RATE_LIMIT) {
      const ok = await consumeNonce(env, body.node_id, body.nonce);
      if (!ok) {
        return new Response(JSON.stringify({ error: 'Replay or duplicate nonce' }), {
          status: 409,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }
    }

    if (body.seq != null) {
      const row = await env.NODES_DB.prepare(`SELECT last_seq FROM nodes WHERE node_id = ?`)
        .bind(body.node_id)
        .first<{ last_seq: number | null }>();
      const last = Number(row?.last_seq ?? 0) || 0;
      if (body.seq <= last) {
        return new Response(JSON.stringify({ error: 'seq must increase' }), {
          status: 400,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }
      await env.NODES_DB.prepare(`UPDATE nodes SET last_seq = ? WHERE node_id = ?`)
        .bind(body.seq, body.node_id)
        .run();
    }

    const now = Date.now();
    const status = body.status || 'online';
    const hourTs = hourBucketTs(now);

    await env.NODES_DB.prepare(
      `INSERT INTO node_uptime_slices (node_id, hour_ts, ping_count) VALUES (?, ?, 1)
       ON CONFLICT(node_id, hour_ts) DO UPDATE SET ping_count = ping_count + 1`
    )
      .bind(body.node_id, hourTs)
      .run();

    await env.NODES_DB.prepare(`UPDATE nodes SET last_ping = ? WHERE node_id = ?`).bind(now, body.node_id).run();

    // Allow details refresh only for enrolled nodes (KV secret exists).
    const hasSecret = Boolean(await getNodeHmacSecret(env, body.node_id));
    if (hasSecret) {
      const sets: string[] = [];
      const binds: unknown[] = [];

      if (typeof body.node_name === 'string' && body.node_name.trim()) {
        sets.push('node_name = ?');
        binds.push(body.node_name.trim());
      }
      if (typeof body.role === 'string' && ['light', 'mirror', 'super'].includes(body.role)) {
        sets.push('role = ?');
        binds.push(body.role);
      }
      if (typeof body.region === 'string' && body.region.trim()) {
        sets.push('region = ?');
        binds.push(body.region.trim());
      }
      if (typeof body.url === 'string' && body.url.trim()) {
        sets.push('url = ?');
        binds.push(body.url.trim());
      }
      if (typeof body.version === 'string' && body.version.trim()) {
        sets.push('version = ?');
        binds.push(body.version.trim());
      }

      if (sets.length) {
        await env.NODES_DB.prepare(`UPDATE nodes SET ${sets.join(', ')} WHERE node_id = ?`)
          .bind(...binds, body.node_id)
          .run();
      }
    }

    if (body.pinned_cids) {
      const pinnedCids = JSON.stringify(body.pinned_cids);
      await env.NODES_DB.prepare(`UPDATE nodes SET pinned_cids = ? WHERE node_id = ?`)
        .bind(pinnedCids, body.node_id)
        .run();
    }

    if (body.requests_served_total != null && Number.isFinite(body.requests_served_total)) {
      const v = Math.max(0, Math.floor(body.requests_served_total));
      await env.NODES_DB.prepare(`UPDATE nodes SET requests_served_total = ? WHERE node_id = ?`)
        .bind(v, body.node_id)
        .run();
    }

    const uptimeHours = await recomputeUptimeFromSlices(env, body.node_id);
    await env.NODES_DB.prepare(`UPDATE nodes SET uptime_hours = ? WHERE node_id = ?`)
      .bind(uptimeHours, body.node_id)
      .run();

    return new Response(JSON.stringify({ success: true, uptime_hours: uptimeHours, status }), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Node ping error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process ping' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
}

export async function handleGetNodes(request: Request, env: Env): Promise<Response> {
  const cors = getCorsHeaders();
  try {
    const url = new URL(request.url);
    const region = url.searchParams.get('region');
    const role = url.searchParams.get('role');

    let query = `SELECT node_id, node_name, role, owner_wallet, region, version, url, last_ping, uptime_hours, pinned_cids, created_at, status FROM nodes WHERE last_ping > ?`;
    const params: unknown[] = [Date.now() - 5 * 60 * 1000];

    if (region) {
      query += ` AND region = ?`;
      params.push(region);
    }

    if (role) {
      query += ` AND role = ?`;
      params.push(role);
    }

    query += ` ORDER BY uptime_hours DESC`;

    const result = await env.NODES_DB.prepare(query).bind(...params).all<Node>();

    const nodes = (result.results || []).map((node) => ({
      ...node,
      pinned_cids:
        typeof node.pinned_cids === 'string' ? JSON.parse(node.pinned_cids as unknown as string) : node.pinned_cids,
    }));

    return new Response(JSON.stringify({ nodes }), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get nodes error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch nodes' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
}

export async function handleGetNode(nodeId: string, env: Env): Promise<Response> {
  const cors = getCorsHeaders();
  try {
    const result = await env.NODES_DB.prepare(`SELECT * FROM nodes WHERE node_id = ?`).bind(nodeId).first<Node>();

    if (!result) {
      return new Response(JSON.stringify({ error: 'Node not found' }), {
        status: 404,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const node = {
      ...result,
      pinned_cids:
        typeof result.pinned_cids === 'string'
          ? JSON.parse(result.pinned_cids as unknown as string)
          : result.pinned_cids,
    };

    return new Response(JSON.stringify({ node }), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get node error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch node' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
}

export async function handleGetNodeStatus(nodeId: string, env: Env): Promise<Response> {
  const cors = getCorsHeaders();
  try {
    const n = await env.NODES_DB.prepare(`SELECT * FROM nodes WHERE node_id = ?`).bind(nodeId).first<Node>();
    if (!n) {
      return new Response(JSON.stringify({ error: 'Node not found' }), {
        status: 404,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    const now = Date.now();
    const online = n.last_ping != null && n.last_ping > now - 5 * 60 * 1000;
    const epoch = new Date().toISOString().split('T')[0]!;
    const rw = await env.NODES_DB.prepare(
      `SELECT final_grid, base_grid, payout_status FROM rewards WHERE node_id = ? AND epoch_date = ?`
    )
      .bind(nodeId, epoch)
      .first<{ final_grid: number; base_grid: number; payout_status: string }>();

    return new Response(
      JSON.stringify({
        node_id: nodeId,
        online,
        last_ping: n.last_ping,
        uptime_hours: n.uptime_hours,
        role: n.role,
        region: n.region,
        version: n.version,
        status: n.status ?? 'active',
        requests_served_total: n.requests_served_total ?? 0,
        epoch_grid_final: rw?.final_grid ?? 0,
        epoch_grid_base: rw?.base_grid ?? 0,
        payout_status: rw?.payout_status ?? null,
      }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('status', e);
    return new Response(JSON.stringify({ error: 'Failed' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
}

export async function handleRuntimeConfig(env: Env): Promise<Response> {
  const cors = getCorsHeaders();
  const verifyTo = (env.NODE_VERIFY_TO_ADDRESS || '').trim();
  const verifyMinKas = (env.NODE_VERIFY_MIN_KAS || '1').trim() || '1';
  return new Response(
    JSON.stringify({
      minNodeVersion: '1.0.0',
      heartbeatMinIntervalSec: 45,
      heartbeatMaxIntervalSec: 180,
      apiVersion: 1,
      enrollmentEnabled: Boolean(env.NODE_ENROLLMENT_SECRET),
      onchainVerify: {
        enabled: Boolean(verifyTo),
        toAddress: verifyTo || null,
        minKas: verifyMinKas,
      },
    }),
    { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
  );
}

export async function handleGetNodesByPinnedCid(cid: string, request: Request, env: Env): Promise<Response> {
  const cors = getCorsHeaders();
  try {
    const url = new URL(request.url);
    const region = url.searchParams.get('region');

    let query = `SELECT * FROM nodes WHERE pinned_cids LIKE ? AND last_ping > ?`;
    const params: unknown[] = [`%${cid}%`, Date.now() - 5 * 60 * 1000];

    if (region) {
      query += ` AND region = ?`;
      params.push(region);
    }

    query += ` ORDER BY uptime_hours DESC`;

    const result = await env.NODES_DB.prepare(query).bind(...params).all<Node>();

    const nodes = (result.results || [])
      .map((node) => {
        const pinnedCids =
          typeof node.pinned_cids === 'string'
            ? JSON.parse(node.pinned_cids as unknown as string)
            : node.pinned_cids;

        if (Array.isArray(pinnedCids) && pinnedCids.includes(cid)) {
          return {
            ...node,
            pinnedCids,
            url: node.url,
            uptime: node.uptime_hours,
            region: node.region,
          };
        }
        return null;
      })
      .filter(Boolean);

    return new Response(JSON.stringify({ nodes }), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get nodes by CID error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch nodes' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
}

export async function handleNodeRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (pathname === '/kasparex/node/challenge' && request.method === 'POST') {
    return handleNodeChallenge(request, env);
  }
  if (pathname === '/kasparex/node/verify-wallet' && request.method === 'POST') {
    return handleNodeVerifyWallet(request, env);
  }
  if (pathname === '/kasparex/node/enroll' && request.method === 'POST') {
    return handleNodeEnroll(request, env);
  }
  if (pathname === '/kasparex/node/verify-onchain' && request.method === 'POST') {
    return handleNodeVerifyOnchain(request, env);
  }
  if (pathname === '/kasparex/node/update-details' && request.method === 'POST') {
    return handleNodeUpdateDetails(request, env);
  }
  if (pathname === '/kasparex/node/rotate-secret' && request.method === 'POST') {
    return handleNodeRotateSecret(request, env);
  }

  if (pathname === '/kasparex/node/runtime-config' && request.method === 'GET') {
    return handleRuntimeConfig(env);
  }

  if (pathname === '/kasparex/node/register' && request.method === 'POST') {
    return handleNodeRegister(request, env);
  }

  if (pathname === '/kasparex/node/ping' && request.method === 'POST') {
    return handleNodePing(request, env);
  }

  const statusMatch = pathname.match(/^\/kasparex\/node\/([^/]+)\/status$/);
  if (statusMatch && request.method === 'GET') {
    return handleGetNodeStatus(statusMatch[1]!, env);
  }

  const rewardsMatch = pathname.match(/^\/kasparex\/node\/([^/]+)\/rewards$/);
  if (rewardsMatch && request.method === 'GET') {
    return handleGetNodeRewards(rewardsMatch[1]!, request, env);
  }

  const pinnedMatch = pathname.match(/^\/kasparex\/nodes\/pinned\/(.+)$/);
  if (pinnedMatch && request.method === 'GET') {
    return handleGetNodesByPinnedCid(pinnedMatch[1]!, request, env);
  }

  const nodeMatch = pathname.match(/^\/kasparex\/node\/(.+)$/);
  if (nodeMatch && request.method === 'GET') {
    return handleGetNode(nodeMatch[1]!, env);
  }

  if (pathname === '/kasparex/nodes' && request.method === 'GET') {
    return handleGetNodes(request, env);
  }

  return new Response('Not found', {
    status: 404,
    headers: getCorsHeaders(),
  });
}
