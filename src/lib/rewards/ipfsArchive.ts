/**
 * IPFS Archival Service
 * 
 * Archives completed reward records to IPFS/Storacha for permanent storage
 * Reduces database costs by moving old data to decentralized storage
 */

import { uploadJSONToStoracha } from '@/lib/storage/decentralized';

export interface RewardRecord {
  rewardId: string;
  txHash: string;
  userAddress: string;
  dappId: string;
  actionType: string;
  actionValue: number;
  gridReward?: number;
  dAppTokenReward?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  distributedAt?: string;
  network: 'L1' | 'L2' | 'vProgs';
}

export interface ArchiveResult {
  success: boolean;
  cid?: string;
  ipfsUrl?: string;
  error?: string;
}

/**
 * Archive a reward record to IPFS
 * 
 * @param record Reward record to archive
 * @returns IPFS CID and URL
 */
export async function archiveRewardRecord(
  record: RewardRecord
): Promise<ArchiveResult> {
  try {
    // Upload to Storacha (free, decentralized)
    const result = await uploadJSONToStoracha(record as Record<string, unknown>, { pin: true });

    return {
      success: true,
      cid: result.cid,
      ipfsUrl: result.ipfsUrl,
    };
  } catch (error) {
    console.error('Error archiving reward record to IPFS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch archived reward record from IPFS
 * 
 * @param cid IPFS CID
 * @returns Reward record
 */
export async function fetchArchivedRewardRecord(
  cid: string
): Promise<RewardRecord | null> {
  try {
    // Try KREX nodes first (free, fast)
    const { resolveAsset } = await import('@/lib/storage/decentralized');
    const url = await resolveAsset(cid);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
    }

    const record = await response.json() as RewardRecord;
    return record;
  } catch (error) {
    console.error('Error fetching archived reward record:', error);
    return null;
  }
}

/**
 * Batch archive multiple reward records
 * 
 * @param records Array of reward records
 * @returns Array of archive results
 */
export async function batchArchiveRewardRecords(
  records: RewardRecord[]
): Promise<ArchiveResult[]> {
  const results: ArchiveResult[] = [];

  // Process in batches of 10 to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(record => archiveRewardRecord(record))
    );
    results.push(...batchResults);

    // Small delay between batches
    if (i + batchSize < records.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}
