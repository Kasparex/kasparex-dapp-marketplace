/**
 * Krex Node Management API
 * 
 * Handles node registration, pings, and discovery
 */

import type { Env } from '../index';

export async function handleNodeRequest(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // POST /kasparex/node/register
  if (pathname === '/kasparex/node/register' && request.method === 'POST') {
    try {
      const body = await request.json() as {
        nodeName: string;
        role: 'light' | 'mirror' | 'super';
        ownerWallet: string;
        version: string;
        region?: string;
        url?: string;
      };

      // Generate node ID
      const nodeId = `krex_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Insert into D1 database
      await env.NODES_DB.prepare(
        `INSERT INTO nodes (node_id, node_name, role, owner_wallet, region, version, url, last_ping, uptime_hours, pinned_cids, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        nodeId,
        body.nodeName,
        body.role,
        body.ownerWallet,
        body.region || 'unknown',
        body.version,
        body.url || '',
        Date.now(),
        0,
        '[]',
        Date.now()
      ).run();

      return new Response(
        JSON.stringify({ nodeId, status: 'registered' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('Error registering node:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to register node' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // POST /kasparex/node/ping
  if (pathname === '/kasparex/node/ping' && request.method === 'POST') {
    try {
      const body = await request.json() as {
        nodeId: string;
        status?: string;
        pinnedCids?: string[];
      };

      // Update last ping timestamp
      await env.NODES_DB.prepare(
        `UPDATE nodes SET last_ping = ?, pinned_cids = ? WHERE node_id = ?`
      ).bind(
        Date.now(),
        JSON.stringify(body.pinnedCids || []),
        body.nodeId
      ).run();

      // Record ping in node_pings table
      await env.NODES_DB.prepare(
        `INSERT INTO node_pings (node_id, timestamp, status) VALUES (?, ?, ?)`
      ).bind(
        body.nodeId,
        Date.now(),
        body.status || 'ok'
      ).run();

      // Calculate uptime (simplified - count successful pings in last 24 hours)
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      const pings = await env.NODES_DB.prepare(
        `SELECT COUNT(*) as count FROM node_pings WHERE node_id = ? AND timestamp > ? AND status = 'ok'`
      ).bind(body.nodeId, oneDayAgo).first<{ count: number }>();

      const uptimeHours = pings ? (pings.count / 24) : 0;

      // Update uptime
      await env.NODES_DB.prepare(
        `UPDATE nodes SET uptime_hours = ? WHERE node_id = ?`
      ).bind(uptimeHours, body.nodeId).run();

      return new Response(
        JSON.stringify({ success: true, uptimeHours }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('Error processing ping:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to process ping' }),
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



