/**
 * Kasparex API - Public Data Endpoints
 * 
 * Public endpoints for nodes, stats, and dApp availability
 */

import type { Env } from '../index';
import { getCorsHeaders } from '../middleware';

/**
 * Get network statistics
 * GET /kasparex/stats
 */
export async function handleGetStats(env: Env): Promise<Response> {
  try {
    // Get total nodes
    const totalNodesResult = await env.NODES_DB.prepare(
      `SELECT COUNT(*) as count FROM nodes WHERE last_ping > ?`
    ).bind(Date.now() - (5 * 60 * 1000)).first<{ count: number }>();

    const totalNodes = totalNodesResult?.count || 0;

    // Get nodes by role
    await migrateLegacyMirrorRoles(env);

    const lightNodesResult = await env.NODES_DB.prepare(
      `SELECT COUNT(*) as count FROM nodes WHERE role = 'light' AND last_ping > ?`
    ).bind(Date.now() - (5 * 60 * 1000)).first<{ count: number }>();

    const edgeNodesResult = await env.NODES_DB.prepare(
      `SELECT COUNT(*) as count FROM nodes WHERE role IN ('edge', 'mirror') AND last_ping > ?`
    ).bind(Date.now() - (5 * 60 * 1000)).first<{ count: number }>();

    const superNodesResult = await env.NODES_DB.prepare(
      `SELECT COUNT(*) as count FROM nodes WHERE role = 'super' AND last_ping > ?`
    ).bind(Date.now() - (5 * 60 * 1000)).first<{ count: number }>();

    // Get total uptime
    const uptimeResult = await env.NODES_DB.prepare(
      `SELECT SUM(uptime_hours) as total FROM nodes WHERE last_ping > ?`
    ).bind(Date.now() - (5 * 60 * 1000)).first<{ total: number }>();

    // Get total rewards (today's epoch)
    const today = new Date().toISOString().split('T')[0];
    const rewardsResult = await env.NODES_DB.prepare(
      `SELECT SUM(COALESCE(final_grid, 0)) as total FROM rewards WHERE epoch_date = ?`
    ).bind(today).first<{ total: number }>();

    return new Response(
      JSON.stringify({
        total_nodes: totalNodes,
        light_nodes: lightNodesResult?.count || 0,
        edge_nodes: edgeNodesResult?.count || 0,
        super_nodes: superNodesResult?.count || 0,
        total_uptime_hours: uptimeResult?.total || 0,
        total_grid_rewards_today: rewardsResult?.total || 0,
        total_rewards_today: rewardsResult?.total || 0,
        timestamp: Date.now(),
      }),
      {
        status: 200,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Get stats error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch stats' }),
      {
        status: 500,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Get dApp mirror availability
 * GET /kasparex/dapps/availability
 */
export async function handleGetDAppAvailability(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const cid = url.searchParams.get('cid');

    if (!cid) {
      return new Response(
        JSON.stringify({ error: 'Missing cid parameter' }),
        {
          status: 400,
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
        }
      );
    }

    // Get nodes that have pinned this CID
    const nodesResult = await env.NODES_DB.prepare(
      `SELECT node_id, node_name, url, region, role, uptime_hours 
       FROM nodes 
       WHERE pinned_cids LIKE ? AND last_ping > ? 
       ORDER BY uptime_hours DESC`
    ).bind(`%${cid}%`, Date.now() - (5 * 60 * 1000)).all();

    const nodes = (nodesResult.results || [])
      .map((node: any) => {
        const pinnedCids = typeof node.pinned_cids === 'string'
          ? JSON.parse(node.pinned_cids)
          : [];
        
        if (Array.isArray(pinnedCids) && pinnedCids.includes(cid)) {
          return {
            node_id: node.node_id,
            node_name: node.node_name,
            url: node.url,
            region: node.region,
            role: node.role,
            uptime_hours: node.uptime_hours,
          };
        }
        return null;
      })
      .filter(Boolean);

    return new Response(
      JSON.stringify({
        cid,
        available_nodes: nodes.length,
        nodes,
      }),
      {
        status: 200,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Get dApp availability error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch dApp availability' }),
      {
        status: 500,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Route public requests
 */
export async function handlePublicRequest(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // GET /kasparex/stats
  if (pathname === '/kasparex/stats' && request.method === 'GET') {
    return handleGetStats(env);
  }

  // GET /kasparex/dapps/availability
  if (pathname === '/kasparex/dapps/availability' && request.method === 'GET') {
    return handleGetDAppAvailability(request, env);
  }

  // GET /kasparex/network/stats  -  same payload as /kasparex/stats (alias for node clients)
  if (pathname === '/kasparex/network/stats' && request.method === 'GET') {
    return handleGetStats(env);
  }

  return new Response('Not found', {
    status: 404,
    headers: getCorsHeaders(),
  });
}


