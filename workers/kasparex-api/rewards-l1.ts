/**
 * L1 Reward Distribution API
 * 
 * Handles L1 reward recording and status checking via Cloudflare D1
 */

import type { Env } from '../index';
import { getCorsHeaders } from '../middleware';
import {
  createRewardRecord,
  getRewardRecord,
  updateRewardStatus,
  getArchivedRewardCid,
  type RewardRecord,
} from './d1Database';
import { fetchArchivedRewardRecord } from './ipfsArchive';

/**
 * POST /kasparex/rewards/l1/record
 * 
 * Record an L1 transaction and initiate reward distribution
 */
export async function handleRecordL1Reward(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const body = await request.json() as {
      txHash: string;
      userAddress: string;
      dappId: string;
      actionType: string;
      actionValue: number;
      network: 'L1';
    };

    // Validate required fields
    if (!body.txHash || !body.userAddress || !body.dappId || !body.actionType) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: txHash, userAddress, dappId, actionType',
        }),
        {
          status: 400,
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate transaction hash format
    if (!/^[0-9a-fA-F]{64}$/.test(body.txHash.replace(/^0x/, ''))) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid transaction hash format',
        }),
        {
          status: 400,
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate unique reward ID
    const rewardId = `l1_${Date.now()}_${body.txHash.slice(0, 16)}`;

    // Create reward record in D1
    const success = await createRewardRecord(env.REWARDS_DB, {
      id: rewardId,
      txHash: body.txHash,
      userAddress: body.userAddress,
      dappId: body.dappId,
      actionType: body.actionType,
      actionValue: body.actionValue,
      status: 'pending',
      network: 'L1',
    });

    if (!success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to create reward record',
        }),
        {
          status: 500,
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
        }
      );
    }

    // TODO: Queue reward distribution in background
    // This should:
    // 1. Verify transaction on Kaspa network
    // 2. Calculate rewards based on user tier
    // 3. Distribute tokens
    // 4. Update status to 'completed'

    return new Response(
      JSON.stringify({
        success: true,
        rewardId,
      }),
      {
        status: 200,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error recording L1 reward:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * GET /kasparex/rewards/l1/status/:rewardId
 * 
 * Get the status of an L1 reward distribution
 */
export async function handleGetL1RewardStatus(
  rewardId: string,
  env: Env
): Promise<Response> {
  try {
    if (!rewardId) {
      return new Response(
        JSON.stringify({
          status: 'error',
          error: 'Missing rewardId',
        }),
        {
          status: 400,
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
        }
      );
    }

    // Check cache first (Cloudflare KV)
    const cacheKey = `reward:${rewardId}`;
    const cached = await env.KASPAREX_CACHE?.get(cacheKey);
    if (cached) {
      return new Response(cached, {
        status: 200,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      });
    }

    // Check active rewards in D1
    let record = await getRewardRecord(env.REWARDS_DB, rewardId);

    // If not found in active, check archived
    if (!record) {
      const ipfsCid = await getArchivedRewardCid(env.REWARDS_DB, rewardId);
      if (ipfsCid) {
        const archivedRecord = await fetchArchivedRewardRecord(ipfsCid);
        if (archivedRecord) {
          // Convert archived record format to response format
          return new Response(
            JSON.stringify({
              status: archivedRecord.status,
              gridReward: archivedRecord.gridReward,
              dAppTokenReward: archivedRecord.dAppTokenReward,
              distributedAt: archivedRecord.distributedAt,
            }),
            {
              status: 200,
              headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
            }
          );
        }
      }

      return new Response(
        JSON.stringify({
          status: 'error',
          error: 'Reward not found',
        }),
        {
          status: 404,
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
        }
      );
    }

    // Format response
    const response = {
      status: record.status,
      gridReward: record.gridReward,
      dAppTokenReward: record.dAppTokenReward,
      distributedAt: record.distributedAt
        ? new Date(record.distributedAt).toISOString()
        : undefined,
    };

    // Cache for 10 minutes
    if (env.KASPAREX_CACHE) {
      await env.KASPAREX_CACHE.put(cacheKey, JSON.stringify(response), {
        expirationTtl: 600, // 10 minutes
      });
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error getting L1 reward status:', error);
    return new Response(
      JSON.stringify({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Route L1 reward requests
 */
export async function handleL1RewardRequest(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // POST /kasparex/rewards/l1/record
  if (pathname === '/kasparex/rewards/l1/record' && request.method === 'POST') {
    return handleRecordL1Reward(request, env);
  }

  // GET /kasparex/rewards/l1/status/:rewardId
  const statusMatch = pathname.match(/^\/kasparex\/rewards\/l1\/status\/(.+)$/);
  if (statusMatch && request.method === 'GET') {
    return handleGetL1RewardStatus(statusMatch[1], env);
  }

  return new Response('Not found', {
    status: 404,
    headers: getCorsHeaders(),
  });
}
