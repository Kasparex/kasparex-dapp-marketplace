/**
 * Cloudflare D1 Database Utilities
 * 
 * Helper functions for interacting with D1 database via Cloudflare Workers
 * For local development, these functions will need to be adapted or mocked
 */

export interface RewardRecord {
  id: string;
  txHash: string;
  userAddress: string;
  dappId: string;
  actionType: string;
  actionValue: number;
  gridReward?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  network: 'L1' | 'L2' | 'vProgs';
  createdAt: number;
  updatedAt: number;
  distributedAt?: number;
  ipfsCid?: string;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = unknown>(): Promise<{ results: T[] }>;
}

export interface D1Result {
  success: boolean;
  meta: {
    changes: number;
    last_row_id: number;
    duration: number;
  };
}

/**
 * Create a new reward record in D1
 */
export async function createRewardRecord(
  db: D1Database,
  record: Omit<RewardRecord, 'createdAt' | 'updatedAt'>
): Promise<boolean> {
  try {
    const now = Date.now();
    const result = await db
      .prepare(
        `INSERT INTO rewards_active (
          id, tx_hash, user_address, dapp_id, action_type, action_value,
          grid_reward, dapp_token_reward, status, network, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        record.id,
        record.txHash,
        record.userAddress,
        record.dappId,
        record.actionType,
        record.actionValue,
        record.gridReward ?? null,
        null,
        record.status,
        record.network,
        now,
        now
      )
      .run();

    return result.success;
  } catch (error) {
    console.error('Error creating reward record:', error);
    return false;
  }
}

/**
 * Get reward record by ID
 */
export async function getRewardRecord(
  db: D1Database,
  rewardId: string
): Promise<RewardRecord | null> {
  try {
    const result = await db
      .prepare('SELECT * FROM rewards_active WHERE id = ?')
      .bind(rewardId)
      .first<RewardRecord>();

    return result;
  } catch (error) {
    console.error('Error getting reward record:', error);
    return null;
  }
}

/**
 * Update reward record status
 */
export async function updateRewardStatus(
  db: D1Database,
  rewardId: string,
  status: RewardRecord['status'],
  gridReward?: number,
  ipfsCid?: string
): Promise<boolean> {
  try {
    const now = Date.now();
    const distributedAt = status === 'completed' ? now : undefined;

    const updates: string[] = ['status = ?', 'updated_at = ?'];
    const values: unknown[] = [status, now];

    if (gridReward !== undefined) {
      updates.push('grid_reward = ?');
      values.push(gridReward);
    }

    if (distributedAt !== undefined) {
      updates.push('distributed_at = ?');
      values.push(distributedAt);
    }

    if (ipfsCid !== undefined) {
      updates.push('ipfs_cid = ?');
      values.push(ipfsCid);
    }

    values.push(rewardId);

    const result = await db
      .prepare(`UPDATE rewards_active SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();

    return result.success;
  } catch (error) {
    console.error('Error updating reward status:', error);
    return false;
  }
}

/**
 * Get rewards ready for archival (older than 7 days, completed)
 */
export async function getRewardsForArchival(
  db: D1Database,
  daysOld: number = 7
): Promise<RewardRecord[]> {
  try {
    const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;
    const result = await db
      .prepare(
        `SELECT * FROM rewards_active 
         WHERE status = 'completed' 
         AND created_at < ? 
         AND ipfs_cid IS NULL
         ORDER BY created_at ASC
         LIMIT 100`
      )
      .bind(cutoffTime)
      .all<RewardRecord>();

    return result.results || [];
  } catch (error) {
    console.error('Error getting rewards for archival:', error);
    return [];
  }
}

/**
 * Archive reward record (move to archived table)
 */
export async function archiveRewardRecord(
  db: D1Database,
  rewardId: string,
  ipfsCid: string
): Promise<boolean> {
  try {
    // Get the record first
    const record = await getRewardRecord(db, rewardId);
    if (!record) {
      return false;
    }

    // Insert into archived table
    await db
      .prepare(
        `INSERT INTO rewards_archived (id, ipfs_cid, user_address, dapp_id, created_at, archived_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(rewardId, ipfsCid, record.userAddress, record.dappId, record.createdAt, Date.now())
      .run();

    // Delete from active table
    await db
      .prepare('DELETE FROM rewards_active WHERE id = ?')
      .bind(rewardId)
      .run();

    return true;
  } catch (error) {
    console.error('Error archiving reward record:', error);
    return false;
  }
}

/**
 * Get archived reward CID
 */
export async function getArchivedRewardCid(
  db: D1Database,
  rewardId: string
): Promise<string | null> {
  try {
    const result = await db
      .prepare('SELECT ipfs_cid FROM rewards_archived WHERE id = ?')
      .bind(rewardId)
      .first<{ ipfs_cid: string }>();

    return result?.ipfs_cid || null;
  } catch (error) {
    console.error('Error getting archived reward CID:', error);
    return null;
  }
}
