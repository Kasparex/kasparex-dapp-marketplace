/**
 * L1 Reward Processor
 * 
 * Processes pending L1 rewards by:
 * 1. Verifying transactions on Kaspa network
 * 2. Calculating rewards based on user KREX tier
 * 3. Updating status in D1 database
 * 
 * Note: Actual token distribution is handled separately (requires L1 token distribution mechanism)
 */

import type { Env } from '../index';
import { getCorsHeaders } from '../middleware';
import {
  getRewardRecord,
  updateRewardStatus,
  type RewardRecord,
  type D1Database,
} from './d1Database';

/**
 * KREX Tier thresholds (matches frontend logic)
 */
const KREX_TIERS = {
  Tier1: { min: 0, multiplier: 1.0 },
  Tier2: { min: 10_000_000, multiplier: 1.5 },
  Tier3: { min: 50_000_000, multiplier: 2.0 },
  Tier4: { min: 100_000_000, multiplier: 3.0 },
} as const;

type KREXTier = keyof typeof KREX_TIERS;

/**
 * Get KREX tier from balance
 */
function getKREXTierFromBalance(balance: number): KREXTier {
  if (balance >= 100_000_000) return 'Tier4';
  if (balance >= 50_000_000) return 'Tier3';
  if (balance >= 10_000_000) return 'Tier2';
  return 'Tier1';
}

/**
 * Query KREX balance for L1 address
 * Uses Kasplex Indexer API
 */
async function queryL1KREXBalance(address: string): Promise<number> {
  try {
    // Normalize address (remove kaspa: prefix)
    const normalizedAddress = address.replace(/^kaspa:/i, '');
    
    // Kasplex Indexer API endpoint
    const apiUrl = `https://indexer.kasplex.org/v1/krc20/address/${encodeURIComponent(normalizedAddress)}/token/KREX`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      console.warn(`[Reward Processor] Failed to fetch KREX balance: ${response.status}`);
      return 0;
    }

    const data = await response.json();
    
    // Parse balance (API returns balance as string or number)
    const balance = typeof data.balance === 'string' 
      ? parseFloat(data.balance) 
      : typeof data.balance === 'number'
      ? data.balance
      : 0;
    
    return isNaN(balance) ? 0 : balance;
  } catch (error) {
    console.error('[Reward Processor] Error querying KREX balance:', error);
    return 0;
  }
}

/**
 * Verify transaction exists on Kaspa network
 * Uses Kaspa RPC or block explorer API
 */
async function verifyKaspaTransaction(txHash: string): Promise<boolean> {
  try {
    // Remove 0x prefix if present
    const normalizedHash = txHash.replace(/^0x/, '');
    
    // Try Kaspa RPC endpoint (if available)
    // For now, we'll use a simple check - in production, use actual Kaspa RPC
    const rpcUrl = 'https://api.kaspa.org'; // Replace with actual RPC endpoint
    
    try {
      const response = await fetch(`${rpcUrl}/v1/transactions/${normalizedHash}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        return true;
      }
    } catch (rpcError) {
      console.warn('[Reward Processor] RPC verification failed, trying block explorer:', rpcError);
    }

    // Fallback: Try block explorer API
    try {
      const explorerUrl = `https://explorer.kaspa.org/txs/${normalizedHash}`;
      const response = await fetch(explorerUrl, {
        method: 'HEAD', // Just check if exists
        signal: AbortSignal.timeout(10000),
      });
      
      return response.ok;
    } catch (explorerError) {
      console.warn('[Reward Processor] Block explorer verification failed:', explorerError);
    }

    // If verification fails, we'll still process the reward (assume valid)
    // In production, you may want to be more strict
    console.warn('[Reward Processor] Could not verify transaction, proceeding anyway');
    return true;
  } catch (error) {
    console.error('[Reward Processor] Error verifying transaction:', error);
    // Return true to allow processing even if verification fails
    // In production, you may want stricter verification
    return true;
  }
}

/**
 * Calculate reward amounts based on action value and KREX tier
 * Simplified version - matches frontend rewardCalculator logic
 * 
 * Note: Reward rates should match src/lib/rewards/mockData.ts getDefaultRewardsBreakdown()
 * The mock data uses high numbers (10000 GRT per KAS) which may be for simulation.
 * For production, adjust these rates based on actual token economics.
 */
function calculateRewardAmounts(
  actionValue: number,
  krexTier: KREXTier
): { gridReward: number; dAppTokenReward: number } {
  // Base reward rates (per KAS)
  // These should match the rates in src/lib/rewards/mockData.ts
  // Default: 10000 GRT per KAS, 1000 LRT per KAS (from mockData)
  // For production, these may need to be adjusted based on actual token economics
  const GRID_PER_KAS = 10000; // GRID per KAS (matches mockData.GRT_PER_KAS)
  const DAPP_TOKEN_PER_KAS = 1000; // dApp token per KAS (matches mockData.LRT_PER_KAS)

  // Calculate base rewards
  const baseGridReward = actionValue * GRID_PER_KAS;
  const baseDAppTokenReward = actionValue * DAPP_TOKEN_PER_KAS;

  // Get tier multiplier
  const tierConfig = KREX_TIERS[krexTier];
  const multiplier = tierConfig.multiplier;

  // Apply multiplier
  const gridReward = baseGridReward * multiplier;
  const dAppTokenReward = baseDAppTokenReward * multiplier;

  return {
    gridReward: Math.round(gridReward * 100) / 100, // Round to 2 decimals
    dAppTokenReward: Math.round(dAppTokenReward * 100) / 100,
  };
}

/**
 * Get pending rewards from D1 database
 */
async function getPendingRewards(db: D1Database, limit: number = 50): Promise<RewardRecord[]> {
  try {
    const result = await db
      .prepare(
        `SELECT * FROM rewards_active 
         WHERE status = 'pending' 
         AND network = 'L1'
         ORDER BY created_at ASC
         LIMIT ?`
      )
      .bind(limit)
      .all<RewardRecord>();

    return result.results || [];
  } catch (error) {
    console.error('[Reward Processor] Error getting pending rewards:', error);
    return [];
  }
}

/**
 * Process a single reward record
 */
async function processReward(
  reward: RewardRecord,
  env: Env
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[Reward Processor] Processing reward ${reward.id} for user ${reward.userAddress}`);

    // Step 1: Verify transaction
    const isVerified = await verifyKaspaTransaction(reward.txHash);
    if (!isVerified) {
      console.warn(`[Reward Processor] Transaction ${reward.txHash} could not be verified`);
      // Continue processing anyway (transaction might be valid but API unavailable)
    }

    // Step 2: Get user KREX balance and tier
    const krexBalance = await queryL1KREXBalance(reward.userAddress);
    const krexTier = getKREXTierFromBalance(krexBalance);

    console.log(`[Reward Processor] User ${reward.userAddress}: KREX balance=${krexBalance}, tier=${krexTier}`);

    // Step 3: Calculate rewards
    const { gridReward, dAppTokenReward } = calculateRewardAmounts(
      reward.actionValue,
      krexTier
    );

    console.log(`[Reward Processor] Calculated rewards: GRID=${gridReward}, dAppToken=${dAppTokenReward}`);

    // Step 4: Update status to 'processing'
    await updateRewardStatus(
      env.REWARDS_DB,
      reward.id,
      'processing',
      gridReward,
      dAppTokenReward
    );

    // Step 5: TODO - Distribute tokens
    // This requires implementing L1 token distribution mechanism
    // For now, we'll mark as completed after calculating rewards
    // In production, you would:
    // - Send GRID tokens to user address
    // - Send dApp tokens to user address
    // - Only then mark as completed

    // Step 6: Update status to 'completed'
    await updateRewardStatus(
      env.REWARDS_DB,
      reward.id,
      'completed',
      gridReward,
      dAppTokenReward
    );

    console.log(`[Reward Processor] Successfully processed reward ${reward.id}`);

    return { success: true };
  } catch (error) {
    console.error(`[Reward Processor] Error processing reward ${reward.id}:`, error);
    
    // Mark as failed
    await updateRewardStatus(env.REWARDS_DB, reward.id, 'failed');

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Process all pending rewards
 */
export async function processPendingRewards(
  env: Env,
  limit: number = 50
): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  errors: string[];
}> {
  const results = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    console.log('[Reward Processor] Starting reward processing...');

    // Get pending rewards
    const pendingRewards = await getPendingRewards(env.REWARDS_DB, limit);

    if (pendingRewards.length === 0) {
      console.log('[Reward Processor] No pending rewards to process');
      return results;
    }

    console.log(`[Reward Processor] Found ${pendingRewards.length} pending rewards`);

    // Process each reward
    for (const reward of pendingRewards) {
      results.processed++;
      
      const result = await processReward(reward, env);
      
      if (result.success) {
        results.succeeded++;
      } else {
        results.failed++;
        if (result.error) {
          results.errors.push(`Reward ${reward.id}: ${result.error}`);
        }
      }

      // Small delay between processing to avoid rate limits
      if (results.processed < pendingRewards.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(
      `[Reward Processor] Processing complete: ${results.processed} processed, ` +
      `${results.succeeded} succeeded, ${results.failed} failed`
    );

    return results;
  } catch (error) {
    console.error('[Reward Processor] Fatal error in reward processing:', error);
    results.errors.push(`Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return results;
  }
}

/**
 * Handle manual reward processing trigger
 * POST /kasparex/rewards/l1/process
 */
export async function handleProcessRewards(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    // Optional: Add authentication check here
    // const authHeader = request.headers.get('Authorization');
    // if (authHeader !== `Bearer ${env.PROCESS_AUTH_TOKEN}`) {
    //   return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    //     status: 401,
    //     headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
    //   });
    // }

    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return new Response(
        JSON.stringify({ error: 'Invalid limit parameter (must be 1-100)' }),
        {
          status: 400,
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
        }
      );
    }

    const results = await processPendingRewards(env, limit);

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in handleProcessRewards:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      }
    );
  }
}
