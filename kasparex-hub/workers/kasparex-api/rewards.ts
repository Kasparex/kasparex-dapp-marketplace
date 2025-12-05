/**
 * Reward Engine API
 * 
 * Handles reward calculations for Krex Nodes
 * Node multipliers: Light 2x, Mirror 3x, Super 5x
 */

import type { Env } from '../index';

// Node tier multipliers
const NODE_MULTIPLIERS = {
  light: 2.0,
  mirror: 3.0,
  super: 5.0,
} as const;

export async function handleRewardRequest(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // GET /kasparex/rewards/:nodeId
  const rewardsMatch = pathname.match(/^\/kasparex\/rewards\/(.+)$/);
  if (rewardsMatch && request.method === 'GET') {
    const nodeId = rewardsMatch[1];

    try {
      // Get node info
      const node = await env.NODES_DB.prepare(
        `SELECT * FROM nodes WHERE node_id = ?`
      ).bind(nodeId).first<{
        node_id: string;
        role: 'light' | 'mirror' | 'super';
        uptime_hours: number;
        region: string;
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

      // Calculate rewards
      const baseGRT = 100; // Base GRT per day
      const baseLRT = 50; // Base LRT per day

      // Role multiplier
      const roleMultiplier = NODE_MULTIPLIERS[node.role] || 1.0;

      // Region multiplier (underserved regions get 1.2x)
      const regionMultiplier = getRegionMultiplier(node.region);

      // KREX multiplier (would come from on-chain data, default 1.0)
      const krexMultiplier = 1.0;

      // Calculate total rewards
      const grtAmount = baseGRT * roleMultiplier * regionMultiplier * krexMultiplier;
      const lrtAmount = baseLRT * roleMultiplier * regionMultiplier * krexMultiplier;
      const totalReward = grtAmount + lrtAmount;

      // Get today's epoch date
      const epochDate = new Date().toISOString().split('T')[0];

      // Store or update reward
      await env.NODES_DB.prepare(
        `INSERT OR REPLACE INTO rewards (node_id, epoch_date, grt_amount, lrt_amount, krex_multiplier, region_multiplier, role_multiplier, total_reward)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        nodeId,
        epochDate,
        grtAmount,
        lrtAmount,
        krexMultiplier,
        regionMultiplier,
        roleMultiplier,
        totalReward
      ).run();

      return new Response(
        JSON.stringify({
          nodeId,
          epochDate,
          grtAmount,
          lrtAmount,
          krexMultiplier,
          regionMultiplier,
          roleMultiplier,
          totalReward,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('Error calculating rewards:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to calculate rewards' }),
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

/**
 * Get region multiplier based on node distribution
 * Underserved regions get 1.2x, oversaturated get 0.9x
 */
function getRegionMultiplier(region: string): number {
  // This would ideally check node distribution from database
  // For now, return default multiplier
  const underservedRegions = ['AF', 'SA', 'OC']; // Africa, South America, Oceania
  if (underservedRegions.includes(region)) {
    return 1.2;
  }
  return 1.0;
}



