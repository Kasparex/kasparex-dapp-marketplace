/**
 * Kasparex API - Reward Engine
 * 
 * Handles GRT (Global Reward Token) and LRT (Local Reward Token) calculations
 * with node-tier multipliers (Light 2x, Mirror 3x, Super 5x)
 */

import type { Env } from '../index';
import { getCorsHeaders } from '../middleware';

export interface Reward {
  id: number;
  node_id: string;
  epoch_date: string;
  grt_amount: number;
  lrt_amount: number;
  krex_multiplier: number;
  region_multiplier: number;
  role_multiplier: number;
  total_reward: number;
}

export interface NodeRewardInfo {
  node_id: string;
  epoch_date: string;
  grt_amount: number;
  lrt_amount: number;
  krex_multiplier: number;
  region_multiplier: number;
  role_multiplier: number;
  total_reward: number;
  role: string;
  region: string;
}

/**
 * Get role multiplier
 */
function getRoleMultiplier(role: string): number {
  switch (role) {
    case 'light':
      return 2.0;
    case 'mirror':
      return 3.0;
    case 'super':
      return 5.0;
    default:
      return 1.0;
  }
}

/**
 * Get region multiplier (underserved regions get 1.2x)
 */
function getRegionMultiplier(region: string): number {
  const underservedRegions = ['africa', 'south-america', 'southeast-asia'];
  return underservedRegions.includes(region.toLowerCase()) ? 1.2 : 1.0;
}

/**
 * Calculate rewards for a node for a specific epoch
 */
async function calculateNodeRewards(
  nodeId: string,
  epochDate: string,
  env: Env
): Promise<NodeRewardInfo | null> {
  try {
    // Get node info
    const nodeResult = await env.NODES_DB.prepare(
      `SELECT role, region, uptime_hours FROM nodes WHERE node_id = ?`
    ).bind(nodeId).first<{ role: string; region: string; uptime_hours: number }>();

    if (!nodeResult) {
      return null;
    }

    // Base GRT calculation (simplified - can be enhanced)
    const baseGRT = 100; // Base reward per epoch
    const uptimeBonus = Math.min(nodeResult.uptime_hours / 24, 1.0); // Max 1.0
    const grtAmount = baseGRT * uptimeBonus;

    // Base LRT calculation (per dApp, simplified)
    const baseLRT = 50; // Base LRT per dApp per epoch
    const lrtAmount = baseLRT * uptimeBonus;

    // Get KREX multiplier (placeholder - should come from staking/balance)
    const krexMultiplier = 1.0; // Default, can be enhanced with KREX balance check

    // Get multipliers
    const roleMultiplier = getRoleMultiplier(nodeResult.role);
    const regionMultiplier = getRegionMultiplier(nodeResult.region);

    // Calculate total reward
    const totalReward = (grtAmount + lrtAmount) * krexMultiplier * regionMultiplier * roleMultiplier;

    return {
      node_id: nodeId,
      epoch_date: epochDate,
      grt_amount: grtAmount,
      lrt_amount: lrtAmount,
      krex_multiplier: krexMultiplier,
      region_multiplier: regionMultiplier,
      role_multiplier: roleMultiplier,
      total_reward: totalReward,
      role: nodeResult.role,
      region: nodeResult.region,
    };
  } catch (error) {
    console.error('Calculate rewards error:', error);
    return null;
  }
}

/**
 * Get rewards for a specific node
 * GET /kasparex/rewards/:nodeId
 */
export async function handleGetNodeRewards(
  nodeId: string,
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const epochDate = url.searchParams.get('epoch') || new Date().toISOString().split('T')[0];

    // Check if rewards already calculated and stored
    const storedReward = await env.NODES_DB.prepare(
      `SELECT * FROM rewards WHERE node_id = ? AND epoch_date = ?`
    ).bind(nodeId, epochDate).first<Reward>();

    if (storedReward) {
      return new Response(
        JSON.stringify({
          node_id: nodeId,
          epoch_date: epochDate,
          grt_amount: storedReward.grt_amount,
          lrt_amount: storedReward.lrt_amount,
          krex_multiplier: storedReward.krex_multiplier,
          region_multiplier: storedReward.region_multiplier,
          role_multiplier: storedReward.role_multiplier,
          total_reward: storedReward.total_reward,
        }),
        {
          status: 200,
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate rewards
    const rewardInfo = await calculateNodeRewards(nodeId, epochDate, env);

    if (!rewardInfo) {
      return new Response(
        JSON.stringify({ error: 'Node not found' }),
        {
          status: 404,
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
        }
      );
    }

    // Store calculated rewards
    await env.NODES_DB.prepare(
      `INSERT INTO rewards (
        node_id, epoch_date, grt_amount, lrt_amount, krex_multiplier,
        region_multiplier, role_multiplier, total_reward
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      rewardInfo.node_id,
      rewardInfo.epoch_date,
      rewardInfo.grt_amount,
      rewardInfo.lrt_amount,
      rewardInfo.krex_multiplier,
      rewardInfo.region_multiplier,
      rewardInfo.role_multiplier,
      rewardInfo.total_reward
    ).run();

    return new Response(
      JSON.stringify(rewardInfo),
      {
        status: 200,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Get node rewards error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch rewards' }),
      {
        status: 500,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Get epoch summary
 * GET /kasparex/rewards/epoch/:epochDate
 */
export async function handleGetEpochRewards(
  epochDate: string,
  env: Env
): Promise<Response> {
  try {
    const rewards = await env.NODES_DB.prepare(
      `SELECT * FROM rewards WHERE epoch_date = ? ORDER BY total_reward DESC`
    ).bind(epochDate).all<Reward>();

    const totalGRT = rewards.results?.reduce((sum, r) => sum + r.grt_amount, 0) || 0;
    const totalLRT = rewards.results?.reduce((sum, r) => sum + r.lrt_amount, 0) || 0;
    const totalRewards = rewards.results?.reduce((sum, r) => sum + r.total_reward, 0) || 0;

    return new Response(
      JSON.stringify({
        epoch_date: epochDate,
        total_nodes: rewards.results?.length || 0,
        total_grt: totalGRT,
        total_lrt: totalLRT,
        total_rewards: totalRewards,
        rewards: rewards.results || [],
      }),
      {
        status: 200,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Get epoch rewards error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch epoch rewards' }),
      {
        status: 500,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Route reward requests
 */
export async function handleRewardRequest(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // GET /kasparex/rewards/:nodeId
  const nodeRewardMatch = pathname.match(/^\/kasparex\/rewards\/(.+)$/);
  if (nodeRewardMatch && request.method === 'GET') {
    const epochMatch = pathname.match(/^\/kasparex\/rewards\/epoch\/(.+)$/);
    if (epochMatch) {
      return handleGetEpochRewards(epochMatch[1], env);
    }
    return handleGetNodeRewards(nodeRewardMatch[1], request, env);
  }

  // GET /kasparex/rewards/epoch/:epochDate
  const epochMatch = pathname.match(/^\/kasparex\/rewards\/epoch\/(.+)$/);
  if (epochMatch && request.method === 'GET') {
    return handleGetEpochRewards(epochMatch[1], env);
  }

  return new Response('Not found', {
    status: 404,
    headers: getCorsHeaders(),
  });
}


