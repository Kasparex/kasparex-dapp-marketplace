/**
 * Kasparex API - Krex Node Management
 * 
 * Handles node registration, pings, and node queries
 */

import type { Env } from '../index';
import { getCorsHeaders } from '../middleware';

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
  status: 'online' | 'offline';
  pinned_cids?: string[];
}

/**
 * Register a new Krex Node
 * POST /kasparex/node/register
 */
export async function handleNodeRegister(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const body: NodeRegistration = await request.json();

    // Validate required fields
    if (!body.node_id || !body.node_name || !body.role || !body.owner_wallet || !body.url) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate role
    if (!['light', 'mirror', 'super'].includes(body.role)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role. Must be light, mirror, or super' }),
        {
          status: 400,
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
        }
      );
    }

    const now = Date.now();
    const pinnedCids = JSON.stringify(body.pinned_cids || []);

    // Insert or update node
    await env.NODES_DB.prepare(
      `INSERT INTO nodes (
        node_id, node_name, role, owner_wallet, region, version, url,
        last_ping, uptime_hours, pinned_cids, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(node_id) DO UPDATE SET
        node_name = excluded.node_name,
        role = excluded.role,
        owner_wallet = excluded.owner_wallet,
        region = excluded.region,
        version = excluded.version,
        url = excluded.url,
        pinned_cids = excluded.pinned_cids`
    ).bind(
      body.node_id,
      body.node_name,
      body.role,
      body.owner_wallet,
      body.region || 'unknown',
      body.version || '1.0.0',
      body.url,
      now,
      0,
      pinnedCids,
      now
    ).run();

    return new Response(
      JSON.stringify({ success: true, node_id: body.node_id }),
      {
        status: 200,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Node registration error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to register node' }),
      {
        status: 500,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Handle node ping (heartbeat)
 * POST /kasparex/node/ping
 */
export async function handleNodePing(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const body: NodePing = await request.json();

    if (!body.node_id) {
      return new Response(
        JSON.stringify({ error: 'Missing node_id' }),
        {
          status: 400,
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
        }
      );
    }

    const now = Date.now();
    const status = body.status || 'online';

    // Update node last_ping
    await env.NODES_DB.prepare(
      `UPDATE nodes SET last_ping = ? WHERE node_id = ?`
    ).bind(now, body.node_id).run();

    // Update pinned_cids if provided
    if (body.pinned_cids) {
      const pinnedCids = JSON.stringify(body.pinned_cids);
      await env.NODES_DB.prepare(
        `UPDATE nodes SET pinned_cids = ? WHERE node_id = ?`
      ).bind(pinnedCids, body.node_id).run();
    }

    // Record ping in node_pings table
    await env.NODES_DB.prepare(
      `INSERT INTO node_pings (node_id, timestamp, status) VALUES (?, ?, ?)`
    ).bind(body.node_id, now, status).run();

    // Calculate uptime (simplified: count successful pings in last 24 hours)
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const pingsResult = await env.NODES_DB.prepare(
      `SELECT COUNT(*) as count FROM node_pings 
       WHERE node_id = ? AND timestamp > ? AND status = 'online'`
    ).bind(body.node_id, oneDayAgo).first<{ count: number }>();

    const uptimeHours = (pingsResult?.count || 0) / 60; // Assuming 1 ping per minute

    await env.NODES_DB.prepare(
      `UPDATE nodes SET uptime_hours = ? WHERE node_id = ?`
    ).bind(uptimeHours, body.node_id).run();

    return new Response(
      JSON.stringify({ success: true, uptime_hours: uptimeHours }),
      {
        status: 200,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Node ping error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process ping' }),
      {
        status: 500,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Get all active nodes
 * GET /kasparex/nodes
 */
export async function handleGetNodes(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const region = url.searchParams.get('region');
    const role = url.searchParams.get('role');

    let query = `SELECT * FROM nodes WHERE last_ping > ?`;
    const params: any[] = [Date.now() - (5 * 60 * 1000)]; // Active if pinged in last 5 minutes

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

    const nodes = (result.results || []).map(node => ({
      ...node,
      pinned_cids: typeof node.pinned_cids === 'string' 
        ? JSON.parse(node.pinned_cids) 
        : node.pinned_cids,
    }));

    return new Response(
      JSON.stringify({ nodes }),
      {
        status: 200,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Get nodes error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch nodes' }),
      {
        status: 500,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Get node by ID
 * GET /kasparex/node/:id
 */
export async function handleGetNode(
  nodeId: string,
  env: Env
): Promise<Response> {
  try {
    const result = await env.NODES_DB.prepare(
      `SELECT * FROM nodes WHERE node_id = ?`
    ).bind(nodeId).first<Node>();

    if (!result) {
      return new Response(
        JSON.stringify({ error: 'Node not found' }),
        {
          status: 404,
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
        }
      );
    }

    const node = {
      ...result,
      pinned_cids: typeof result.pinned_cids === 'string'
        ? JSON.parse(result.pinned_cids)
        : result.pinned_cids,
    };

    return new Response(
      JSON.stringify({ node }),
      {
        status: 200,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Get node error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch node' }),
      {
        status: 500,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Get nodes that have pinned a specific CID
 * GET /kasparex/nodes/pinned/:cid
 */
export async function handleGetNodesByPinnedCid(
  cid: string,
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const region = url.searchParams.get('region');

    let query = `SELECT * FROM nodes WHERE pinned_cids LIKE ? AND last_ping > ?`;
    const params: any[] = [`%${cid}%`, Date.now() - (5 * 60 * 1000)];

    if (region) {
      query += ` AND region = ?`;
      params.push(region);
    }

    query += ` ORDER BY uptime_hours DESC`;

    const result = await env.NODES_DB.prepare(query).bind(...params).all<Node>();

    const nodes = (result.results || [])
      .map(node => {
        const pinnedCids = typeof node.pinned_cids === 'string'
          ? JSON.parse(node.pinned_cids)
          : node.pinned_cids;
        
        // Filter to only include nodes that actually have this CID
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

    return new Response(
      JSON.stringify({ nodes }),
      {
        status: 200,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Get nodes by CID error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch nodes' }),
      {
        status: 500,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Route node requests
 */
export async function handleNodeRequest(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // POST /kasparex/node/register
  if (pathname === '/kasparex/node/register' && request.method === 'POST') {
    return handleNodeRegister(request, env);
  }

  // POST /kasparex/node/ping
  if (pathname === '/kasparex/node/ping' && request.method === 'POST') {
    return handleNodePing(request, env);
  }

  // GET /kasparex/nodes/pinned/:cid
  const pinnedMatch = pathname.match(/^\/kasparex\/nodes\/pinned\/(.+)$/);
  if (pinnedMatch && request.method === 'GET') {
    return handleGetNodesByPinnedCid(pinnedMatch[1], request, env);
  }

  // GET /kasparex/node/:id
  const nodeMatch = pathname.match(/^\/kasparex\/node\/(.+)$/);
  if (nodeMatch && request.method === 'GET') {
    return handleGetNode(nodeMatch[1], env);
  }

  // GET /kasparex/nodes
  if (pathname === '/kasparex/nodes' && request.method === 'GET') {
    return handleGetNodes(request, env);
  }

  return new Response('Not found', {
    status: 404,
    headers: getCorsHeaders(),
  });
}


