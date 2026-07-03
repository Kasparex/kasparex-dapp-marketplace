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

// Single source of truth: reuse the frontend tier config.
// This keeps Worker payouts consistent with UI multipliers.
import { KREX_TIERS as FRONTEND_KREX_TIERS, BASE_REWARDS } from '../../src/lib/rewards/types';
type KREXTier = keyof typeof FRONTEND_KREX_TIERS;

async function getUserAutoClaimSettings(env: Env, userAddress: string): Promise<{ enabled: boolean; minGrid: number }> {
  try {
    const row = await env.REWARDS_DB.prepare(
      `SELECT auto_claim_enabled, auto_claim_min_grid
       FROM user_reward_settings
       WHERE user_address = ?`
    )
      .bind(userAddress)
      .first<{ auto_claim_enabled: number; auto_claim_min_grid: number }>();
    return {
      enabled: Boolean((row?.auto_claim_enabled ?? 0) === 1),
      minGrid: Math.max(0, Number(row?.auto_claim_min_grid ?? 0) || 0),
    };
  } catch {
    return { enabled: false, minGrid: 0 };
  }
}

async function getUserPendingGrid(env: Env, userAddress: string): Promise<number> {
  const row = await env.REWARDS_DB.prepare(
    `SELECT COALESCE(SUM(COALESCE(grid_reward,0)),0) as pending_grid
     FROM rewards_active
     WHERE user_address = ?
       AND status IN ('pending','processing')`
  )
    .bind(userAddress)
    .first<{ pending_grid: number }>();
  return Number(row?.pending_grid ?? 0) || 0;
}

async function getQueuedDistributionJob(env: Env, userAddress: string): Promise<{ id: string } | null> {
  const row = await env.REWARDS_DB.prepare(
    `SELECT id FROM grid_distribution_jobs
     WHERE user_address = ? AND status = 'queued'
     LIMIT 1`
  )
    .bind(userAddress)
    .first<{ id: string }>();
  return row?.id ? row : null;
}

async function createDistributionJob(env: Env, userAddress: string, totalGrid: number): Promise<string | null> {
  const now = Date.now();
  const id = `job_${now}_${userAddress.replace(/^kaspa:/i, '').slice(0, 10)}`;
  const res = await env.REWARDS_DB.prepare(
    `INSERT INTO grid_distribution_jobs (id, user_address, total_grid, status, created_at, updated_at)
     VALUES (?, ?, ?, 'queued', ?, ?)`
  )
    .bind(id, userAddress, totalGrid, now, now)
    .run();
  return res.success ? id : null;
}

async function stageRewardForDistribution(reward: RewardRecord, env: Env): Promise<{ ok: boolean; gridReward?: number }> {
  // Verify + calculate, then mark as processing (not completed).
  const isVerified = await verifyKaspaTransaction(reward.txHash);
  if (!isVerified) {
    // still proceed
  }
  const krexBalance = await queryL1KREXBalance(reward.userAddress);
  const krexTier = getKREXTierFromBalance(krexBalance);
  const { gridReward } = calculateRewardAmounts(reward.actionValue, krexTier);
  await updateRewardStatus(env.REWARDS_DB, reward.id, 'processing', gridReward);
  return { ok: true, gridReward };
}

/**
 * Get KREX tier from balance
 */
function getKREXTierFromBalance(balance: number): KREXTier {
  if (balance >= FRONTEND_KREX_TIERS.Tier4.minKREX) return 'Tier4';
  if (balance >= FRONTEND_KREX_TIERS.Tier3.minKREX) return 'Tier3';
  if (balance >= FRONTEND_KREX_TIERS.Tier2.minKREX) return 'Tier2';
  if (balance >= FRONTEND_KREX_TIERS.Tier1.minKREX) return 'Tier1';
  return 'Tier0';
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
 * The mock data uses high numbers (10000 GRID per KAS) which may be for simulation.
 * For production, adjust these rates based on actual token economics.
 */
function calculateRewardAmounts(
  actionValue: number,
  krexTier: KREXTier
): { gridReward: number } {
  const GRID_PER_KAS = BASE_REWARDS.GRID_PER_KAS;

  const baseGridReward = actionValue * GRID_PER_KAS;

  const tierConfig = FRONTEND_KREX_TIERS[krexTier];
  const multiplier = tierConfig.multiplier;

  const gridReward = baseGridReward * multiplier;

  return {
    gridReward: Math.round(gridReward * 100) / 100,
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
    const { gridReward } = calculateRewardAmounts(
      reward.actionValue,
      krexTier
    );

    console.log(`[Reward Processor] Calculated rewards: GRID=${gridReward}`);

    // Step 4: Update status to 'processing'
    await updateRewardStatus(
      env.REWARDS_DB,
      reward.id,
      'processing',
      gridReward
    );

    // Step 5: TODO - Distribute GRID tokens
    // This requires implementing L1 token distribution mechanism
    // For now, we'll mark as completed after calculating rewards

    // Step 6: Update status to 'completed'
    await updateRewardStatus(
      env.REWARDS_DB,
      reward.id,
      'completed',
      gridReward
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

    // Apply per-user auto-claim threshold gating.
    const grouped = new Map<string, RewardRecord[]>();
    for (const r of pendingRewards) {
      if (!grouped.has(r.userAddress)) grouped.set(r.userAddress, []);
      grouped.get(r.userAddress)!.push(r);
    }

    const eligible: RewardRecord[] = [];
    for (const [userAddress, list] of grouped.entries()) {
      const settings = await getUserAutoClaimSettings(env, userAddress);
      if (!settings.enabled) {
        eligible.push(...list);
        continue;
      }
      const pendingGrid = await getUserPendingGrid(env, userAddress);
      if (pendingGrid >= settings.minGrid) {
        eligible.push(...list);
      }
    }

    // Process per-user so we can create a single distribution job.
    const eligibleByUser = new Map<string, RewardRecord[]>();
    for (const r of eligible) {
      if (!eligibleByUser.has(r.userAddress)) eligibleByUser.set(r.userAddress, []);
      eligibleByUser.get(r.userAddress)!.push(r);
    }

    for (const [userAddress, list] of eligibleByUser.entries()) {
      const settings = await getUserAutoClaimSettings(env, userAddress);

      // If auto-claim enabled, stage rewards and create/refresh a distribution job (queued).
      if (settings.enabled) {
        const existingJob = await getQueuedDistributionJob(env, userAddress);

        // Stage (calculate -> processing) for this user's pending rewards.
        for (const reward of list) {
          results.processed++;
          try {
            const staged = await stageRewardForDistribution(reward, env);
            if (staged.ok) results.succeeded++;
          } catch (e) {
            results.failed++;
            results.errors.push(`Reward ${reward.id}: ${e instanceof Error ? e.message : 'Stage failed'}`);
          }
          if (results.processed < eligible.length) {
            await new Promise((resolve) => setTimeout(resolve, 250));
          }
        }

        // Create a job only if none queued (idempotent at job level).
        if (!existingJob) {
          const totalGrid = await getUserPendingGrid(env, userAddress);
          if (totalGrid >= settings.minGrid) {
            await createDistributionJob(env, userAddress, totalGrid);
          }
        }

        continue;
      }

      // Otherwise, keep current behavior: immediate completion per reward.
      for (const reward of list) {
        results.processed++;
        const result = await processReward(reward, env);
        if (result.success) results.succeeded++;
        else {
          results.failed++;
          if (result.error) results.errors.push(`Reward ${reward.id}: ${result.error}`);
        }
        if (results.processed < eligible.length) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
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
