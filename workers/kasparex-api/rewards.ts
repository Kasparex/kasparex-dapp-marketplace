/**
 * Kasparex API  -  Krex Node operator rewards (GRID only, per epoch).
 */

import type { Env } from '../index';
import { getCorsHeaders } from '../middleware';
import tiers from '../config/node-reward-tiers.json';
import { resolveKrexHubPointsMultiplier } from './krex-tier';

export interface NodeRewardRow {
  id: number;
  node_id: string;
  wallet: string;
  epoch_date: string;
  base_grid: number;
  final_grid: number;
  krex_multiplier: number;
  region_multiplier: number;
  role_multiplier: number;
  inputs_json: string | null;
  multipliers_json: string | null;
  payout_status: string;
}

function roleMultiplier(role: string): number {
  const m = tiers.roleMultipliers as Record<string, number>;
  return m[role] ?? 1;
}

function regionMultiplier(region: string): number {
  const r = (region || '').toLowerCase();
  return tiers.underservedRegions.includes(r) ? tiers.regionMultiplierUnderserved : tiers.regionMultiplierDefault;
}

/**
 * On-demand preview (does not persist). Full settlement runs via cron in node-rewards-settle.ts.
 */
async function previewNodeRewardGrid(
  nodeId: string,
  epochDate: string,
  env: Env
): Promise<{
  node_id: string;
  epoch_date: string;
  base_grid: number;
  final_grid: number;
  krex_multiplier: number;
  region_multiplier: number;
  role_multiplier: number;
  role: string;
  region: string;
} | null> {
  const nodeResult = await env.NODES_DB.prepare(
    `SELECT role, region, uptime_hours, owner_wallet, requests_served_total
     FROM nodes
     WHERE node_id = ? AND COALESCE(status, 'active') = 'active'`
  )
    .bind(nodeId)
    .first<{
      role: string;
      region: string;
      uptime_hours: number;
      owner_wallet: string;
      requests_served_total: number;
    }>();

  if (!nodeResult) return null;

  const s = tiers.settlement;
  const uptimeScore = Math.min(Math.max(0, (nodeResult.uptime_hours || 0) / s.targetUptimeHours), 1);
  const req = Math.max(0, Number(nodeResult.requests_served_total) || 0);
  const activityScore = Math.min(Math.log(1 + req) / s.activityLogNorm, 1);
  let baseGrid = s.gridPerEpochBase * (s.alpha * uptimeScore + s.beta * activityScore);
  if ((nodeResult.uptime_hours || 0) < s.minUptimeHoursForEpoch) baseGrid = 0;

  const krexMultiplier = await resolveKrexHubPointsMultiplier(env, nodeResult.owner_wallet || '');

  const roleM = roleMultiplier(nodeResult.role);
  const regionM = regionMultiplier(nodeResult.region);
  let finalGrid = baseGrid * roleM * krexMultiplier * regionM;
  finalGrid = Math.min(finalGrid, s.capPerNodePerEpoch);

  return {
    node_id: nodeId,
    epoch_date: epochDate,
    base_grid: baseGrid,
    final_grid: finalGrid,
    krex_multiplier: krexMultiplier,
    region_multiplier: regionM,
    role_multiplier: roleM,
    role: nodeResult.role,
    region: nodeResult.region,
  };
}

/**
 * GET /kasparex/rewards/:nodeId  -  returns stored epoch row or computes preview (stores if missing and base > 0).
 */
export async function handleGetNodeRewards(
  nodeId: string,
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const epochDate = url.searchParams.get('epoch') || new Date().toISOString().split('T')[0];

    const storedReward = await env.NODES_DB.prepare(
      `SELECT * FROM rewards WHERE node_id = ? AND epoch_date = ?`
    )
      .bind(nodeId, epochDate)
      .first<NodeRewardRow>();

    if (storedReward) {
      return new Response(
        JSON.stringify({
          node_id: nodeId,
          epoch_date: epochDate,
          base_grid: storedReward.base_grid,
          final_grid: storedReward.final_grid,
          krex_multiplier: storedReward.krex_multiplier,
          region_multiplier: storedReward.region_multiplier,
          role_multiplier: storedReward.role_multiplier,
          payout_status: storedReward.payout_status,
          inputs_json: storedReward.inputs_json,
          multipliers_json: storedReward.multipliers_json,
          wallet: storedReward.wallet,
        }),
        {
          status: 200,
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
        }
      );
    }

    const preview = await previewNodeRewardGrid(nodeId, epochDate, env);

    if (!preview) {
      return new Response(JSON.stringify({ error: 'Node not found' }), {
        status: 404,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      });
    }

    if (preview.final_grid > 0) {
      const walletRow = await env.NODES_DB.prepare(`SELECT owner_wallet FROM nodes WHERE node_id = ?`)
        .bind(nodeId)
        .first<{ owner_wallet: string }>();
      const wallet = walletRow?.owner_wallet ?? '';

      await env.NODES_DB.prepare(
        `INSERT INTO rewards (
          node_id, wallet, epoch_date, base_grid, final_grid,
          krex_multiplier, region_multiplier, role_multiplier,
          inputs_json, multipliers_json, payout_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'accrued')`
      )
        .bind(
          preview.node_id,
          wallet,
          preview.epoch_date,
          preview.base_grid,
          preview.final_grid,
          preview.krex_multiplier,
          preview.region_multiplier,
          preview.role_multiplier,
          '{}',
          '{}'
        )
        .run();
    }

    return new Response(JSON.stringify(preview), {
      status: 200,
      headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get node rewards error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch rewards' }), {
      status: 500,
      headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
    });
  }
}

export async function handleGetEpochRewards(epochDate: string, env: Env): Promise<Response> {
  try {
    const rewards = await env.NODES_DB.prepare(
      `SELECT * FROM rewards WHERE epoch_date = ? ORDER BY final_grid DESC`
    )
      .bind(epochDate)
      .all<NodeRewardRow>();

    const totalGrid = rewards.results?.reduce((sum, r) => sum + r.final_grid, 0) || 0;
    const totalBase = rewards.results?.reduce((sum, r) => sum + r.base_grid, 0) || 0;

    return new Response(
      JSON.stringify({
        epoch_date: epochDate,
        total_nodes: rewards.results?.length || 0,
        total_base_grid: totalBase,
        total_final_grid: totalGrid,
        rewards: rewards.results || [],
      }),
      {
        status: 200,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Get epoch rewards error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch epoch rewards' }), {
      status: 500,
      headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
    });
  }
}

export async function handleRewardRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (pathname.match(/^\/kasparex\/rewards\/epoch\//) && request.method === 'GET') {
    const epochMatch = pathname.match(/^\/kasparex\/rewards\/epoch\/(.+)$/);
    if (epochMatch) return handleGetEpochRewards(epochMatch[1]!, env);
  }

  const nodeRewardMatch = pathname.match(/^\/kasparex\/rewards\/(.+)$/);
  if (nodeRewardMatch && request.method === 'GET') {
    const seg = nodeRewardMatch[1]!;
    if (seg.startsWith('epoch/')) {
      const em = seg.match(/^epoch\/(.+)$/);
      if (em) return handleGetEpochRewards(em[1]!, env);
    }
    return handleGetNodeRewards(seg, request, env);
  }

  return new Response('Not found', {
    status: 404,
    headers: getCorsHeaders(),
  });
}
