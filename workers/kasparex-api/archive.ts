/**
 * Archival Service
 * 
 * Archives old reward records to IPFS to reduce database storage costs
 * Should be triggered by Cloudflare Workers cron trigger (daily)
 */

import type { Env } from '../index';
import { getCorsHeaders } from '../middleware';
import {
  getRewardsForArchival,
  archiveRewardRecord as archiveToD1,
  type RewardRecord,
} from './d1Database';
import {
  archiveRewardRecord as archiveToIPFS,
  type RewardRecord as IPFSRewardRecord,
} from './ipfsArchive';

/**
 * Archive old rewards to IPFS
 * 
 * This should be called by a cron trigger:
 * In wrangler.toml:
 * [triggers]
 * crons = ["0 2 * * *"]  # Daily at 2 AM
 */
export async function handleArchiveRewards(
  event: ScheduledEvent,
  env: Env
): Promise<void> {
  try {
    console.log('Starting reward archival process...');

    // Get rewards older than 7 days that are completed
    const rewards = await getRewardsForArchival(env.REWARDS_DB, 7);

    if (rewards.length === 0) {
      console.log('No rewards to archive');
      return;
    }

    console.log(`Found ${rewards.length} rewards to archive`);

    let archived = 0;
    let errors = 0;
    const cids: string[] = [];

    // Process in batches
    const batchSize = 10;
    for (let i = 0; i < rewards.length; i += batchSize) {
      const batch = rewards.slice(i, i + batchSize);

      for (const reward of batch) {
        try {
          // Convert D1 record format to IPFS record format
          const ipfsRecord: IPFSRewardRecord = {
            rewardId: reward.id,
            txHash: reward.txHash,
            userAddress: reward.userAddress,
            dappId: reward.dappId,
            actionType: reward.actionType,
            actionValue: reward.actionValue,
            gridReward: reward.gridReward,
            status: reward.status,
            createdAt: new Date(reward.createdAt).toISOString(),
            distributedAt: reward.distributedAt
              ? new Date(reward.distributedAt).toISOString()
              : undefined,
            network: reward.network,
          };

          // Archive to IPFS
          const archiveResult = await archiveToIPFS(ipfsRecord, env.STORACHA_API_KEY);

          if (archiveResult.success && archiveResult.cid) {
            // Update D1: move to archived table
            const success = await archiveToD1(env.REWARDS_DB, reward.id, archiveResult.cid);

            if (success) {
              archived++;
              cids.push(archiveResult.cid);
              console.log(`Archived reward ${reward.id} to IPFS: ${archiveResult.cid}`);
            } else {
              errors++;
              console.error(`Failed to archive reward ${reward.id} to D1`);
            }
          } else {
            errors++;
            console.error(`Failed to archive reward ${reward.id} to IPFS:`, archiveResult.error);
          }
        } catch (error) {
          errors++;
          console.error(`Error archiving reward ${reward.id}:`, error);
        }
      }

      // Small delay between batches
      if (i + batchSize < rewards.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Archival complete: ${archived} archived, ${errors} errors`);
    console.log(`CIDs: ${cids.join(', ')}`);
  } catch (error) {
    console.error('Error in archival process:', error);
    throw error;
  }
}

/**
 * Manual archive endpoint (for testing)
 * POST /kasparex/rewards/archive
 */
export async function handleManualArchive(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    // Only allow in development or with auth token
    const authHeader = request.headers.get('Authorization');
    const expectedToken = env.ARCHIVE_AUTH_TOKEN;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
        }
      );
    }

    // Create a mock scheduled event
    const mockEvent = {
      scheduledTime: Date.now(),
      cron: 'manual',
    } as ScheduledEvent;

    await handleArchiveRewards(mockEvent, env);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Archival process completed',
      }),
      {
        status: 200,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in manual archive:', error);
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
