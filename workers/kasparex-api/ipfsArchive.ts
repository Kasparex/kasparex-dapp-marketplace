/**
 * IPFS Archival Service (Cloudflare Workers)
 * 
 * Archives completed reward records to IPFS/Storacha for permanent storage
 */

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
 * Archive a reward record to IPFS via Storacha
 */
export async function archiveRewardRecord(
  record: RewardRecord,
  storachaApiKey?: string
): Promise<ArchiveResult> {
  try {
    if (!storachaApiKey) {
      // Fallback to public IPFS (slower but free)
      return await archiveToPublicIPFS(record);
    }

    // Upload to Storacha (free, decentralized)
    const response = await fetch('https://api.storacha.network/upload/json', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${storachaApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pin: true,
        content: record,
      }),
    });

    if (!response.ok) {
      throw new Error(`Storacha upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    const cid = result.cid || result.IpfsHash;

    return {
      success: true,
      cid,
      ipfsUrl: `https://ipfs.io/ipfs/${cid}`,
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
 * Fallback: Archive to public IPFS (no API key required)
 */
async function archiveToPublicIPFS(record: RewardRecord): Promise<ArchiveResult> {
  try {
    // Use a public IPFS pinning service (e.g., Pinata public API or Web3.Storage)
    // For now, return error - Storacha is recommended
    return {
      success: false,
      error: 'STORACHA_API_KEY not configured. Please set it for IPFS archival.',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch archived reward record from IPFS
 */
export async function fetchArchivedRewardRecord(
  cid: string
): Promise<RewardRecord | null> {
  try {
    // Try multiple IPFS gateways
    const gateways = [
      `https://storacha.network/ipfs/${cid}`,
      `https://ipfs.io/ipfs/${cid}`,
      `https://gateway.pinata.cloud/ipfs/${cid}`,
      `https://cloudflare-ipfs.com/ipfs/${cid}`,
    ];

    for (const url of gateways) {
      try {
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const record = await response.json() as RewardRecord;
          return record;
        }
      } catch (error) {
        // Try next gateway
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching archived reward record:', error);
    return null;
  }
}
