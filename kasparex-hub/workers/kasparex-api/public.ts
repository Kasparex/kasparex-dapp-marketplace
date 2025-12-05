/**
 * Public Data Endpoints
 * 
 * Provides public data about nodes, dApp availability, and network statistics
 */

import type { Env } from '../index';

export async function handlePublicRequest(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // GET /kasparex/nodes
  if (pathname === '/kasparex/nodes' && request.method === 'GET') {
    try {
      const region = url.searchParams.get('region');
      let query = 'SELECT * FROM nodes WHERE last_ping > ?';
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      const params: any[] = [oneHourAgo];

      if (region) {
        query += ' AND region = ?';
        params.push(region);
      }

      const nodes = await env.NODES_DB.prepare(query)
        .bind(...params)
        .all<{
          node_id: string;
          node_name: string;
          role: string;
          owner_wallet: string;
          region: string;
          version: string;
          url: string;
          last_ping: number;
          uptime_hours: number;
          pinned_cids: string;
        }>();

      const formattedNodes = nodes.results.map(node => ({
        nodeId: node.node_id,
        nodeName: node.node_name,
        role: node.role,
        ownerWallet: node.owner_wallet,
        region: node.region,
        version: node.version,
        url: node.url,
        lastPing: node.last_ping,
        uptime: node.uptime_hours,
        pinnedCids: JSON.parse(node.pinned_cids || '[]'),
      }));

      return new Response(
        JSON.stringify(formattedNodes),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('Error fetching nodes:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch nodes' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // GET /kasparex/nodes/pinned/:cid
  const pinnedMatch = pathname.match(/^\/kasparex\/nodes\/pinned\/(.+)$/);
  if (pinnedMatch && request.method === 'GET') {
    const cid = pinnedMatch[1];
    const region = url.searchParams.get('region');

    try {
      let query = `SELECT * FROM nodes WHERE last_ping > ? AND pinned_cids LIKE ?`;
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      const params: any[] = [oneHourAgo, `%${cid}%`];

      if (region && region !== 'auto') {
        query += ' AND region = ?';
        params.push(region);
      }

      const nodes = await env.NODES_DB.prepare(query)
        .bind(...params)
        .all<{
          node_id: string;
          url: string;
          region: string;
          uptime_hours: number;
          pinned_cids: string;
        }>();

      const formattedNodes = nodes.results
        .filter(node => {
          const cids = JSON.parse(node.pinned_cids || '[]');
          return Array.isArray(cids) && cids.includes(cid);
        })
        .map(node => ({
          nodeId: node.node_id,
          url: node.url,
          region: node.region,
          uptime: node.uptime_hours,
          pinnedCids: JSON.parse(node.pinned_cids || '[]'),
        }))
        .sort((a, b) => {
          // Sort by region match first, then uptime
          if (region && region !== 'auto') {
            if (a.region === region && b.region !== region) return -1;
            if (b.region === region && a.region !== region) return 1;
          }
          return b.uptime - a.uptime;
        });

      return new Response(
        JSON.stringify(formattedNodes),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('Error fetching nodes by CID:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch nodes' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // GET /kasparex/node/:id
  const nodeMatch = pathname.match(/^\/kasparex\/node\/(.+)$/);
  if (nodeMatch && request.method === 'GET') {
    const nodeId = nodeMatch[1];

    try {
      const node = await env.NODES_DB.prepare(
        `SELECT * FROM nodes WHERE node_id = ?`
      ).bind(nodeId).first<{
        node_id: string;
        node_name: string;
        role: string;
        owner_wallet: string;
        region: string;
        version: string;
        url: string;
        last_ping: number;
        uptime_hours: number;
        pinned_cids: string;
        created_at: number;
      }>();

      if (!node) {
        return new Response(
          JSON.stringify({ error: 'Node not found' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({
          nodeId: node.node_id,
          nodeName: node.node_name,
          role: node.role,
          ownerWallet: node.owner_wallet,
          region: node.region,
          version: node.version,
          url: node.url,
          lastPing: node.last_ping,
          uptime: node.uptime_hours,
          pinnedCids: JSON.parse(node.pinned_cids || '[]'),
          createdAt: node.created_at,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('Error fetching node:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch node' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // GET /kasparex/stats
  if (pathname === '/kasparex/stats' && request.method === 'GET') {
    try {
      const totalNodes = await env.NODES_DB.prepare(
        `SELECT COUNT(*) as count FROM nodes WHERE last_ping > ?`
      ).bind(Date.now() - (60 * 60 * 1000)).first<{ count: number }>();

      const nodesByRole = await env.NODES_DB.prepare(
        `SELECT role, COUNT(*) as count FROM nodes WHERE last_ping > ? GROUP BY role`
      ).bind(Date.now() - (60 * 60 * 1000)).all<{ role: string; count: number }>();

      const nodesByRegion = await env.NODES_DB.prepare(
        `SELECT region, COUNT(*) as count FROM nodes WHERE last_ping > ? GROUP BY region`
      ).bind(Date.now() - (60 * 60 * 1000)).all<{ region: string; count: number }>();

      return new Response(
        JSON.stringify({
          totalNodes: totalNodes?.count || 0,
          nodesByRole: nodesByRole.results.reduce((acc, item) => {
            acc[item.role] = item.count;
            return acc;
          }, {} as Record<string, number>),
          nodesByRegion: nodesByRegion.results.reduce((acc, item) => {
            acc[item.region] = item.count;
            return acc;
          }, {} as Record<string, number>),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('Error fetching stats:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch stats' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  }

  return new Response('Not found', {
    status: 404,
    headers: corsHeaders,
  });
}



