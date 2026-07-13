/**
 * L1 Reward Distribution
 * 
 * Handles L1 (Kaspa Native) reward distribution via backend API
 * Since L1 doesn't have smart contracts like L2, we use the Kasparex API
 * to record usage and coordinate reward distribution
 */

/**
 * Record usage and trigger reward distribution for L1 transactions
 * 
 * @param userAddress User's Kaspa wallet address
 * @param dAppId dApp ID
 * @param actionType Type of action (e.g., 'vote', 'payment')
 * @param actionValue Value of the action for reward calculation (in KAS)
 * @param txHash Transaction hash of the original dApp transaction
 * @returns Success status
 */
export async function recordUsageAndRewardL1(
  userAddress: string,
  dAppId: string,
  actionType: string,
  actionValue: number,
  txHash: string
): Promise<{ success: boolean; rewardId?: string; error?: string }> {
  try {
    // Use Cloudflare Worker API if configured, otherwise use Next.js API route
    const cloudflareApiUrl = process.env.NEXT_PUBLIC_CLOUDFLARE_WORKER_URL;
    const nextjsApiUrl = process.env.NEXT_PUBLIC_KASPAREX_API_URL;
    
    const endpoint = cloudflareApiUrl
      ? `${cloudflareApiUrl}/kasparex/rewards/l1/record`
      : nextjsApiUrl
      ? `${nextjsApiUrl}/api/rewards/l1/record`
      : '/api/rewards/l1/record';

    // Call backend API to record L1 transaction
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        txHash,
        userAddress,
        dappId: dAppId,
        actionType,
        actionValue,
        network: 'L1',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return {
        success: false,
        error: errorData.error || `API error: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      rewardId: data.rewardId,
    };
  } catch (error) {
    console.error('Error recording usage and reward (L1):', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get reward status for an L1 transaction
 * 
 * @param rewardId Reward ID returned from recordUsageAndRewardL1
 * @returns Reward status and distribution information
 */
export async function getL1RewardStatus(
  rewardId: string
): Promise<{ status: string; gridReward?: number; distributedAt?: string; error?: string }> {
  try {
    // Prefer node-first reads for status (cheap + cacheable), fall back to central.
    // Writes (record endpoint) should remain centralized and verifiable.
    const enableNodeFirst = process.env.NEXT_PUBLIC_NODE_FIRST_READS !== 'false';

    let data: any;

    if (enableNodeFirst) {
      const { nodeFirstGet } = await import('@/lib/nodes/node-first');
      const result = await nodeFirstGet<any>(`/kasparex/rewards/l1/status/${rewardId}`, {
        roles: ['edge', 'light'],
        maxNodeAttempts: 3,
        timeoutMs: 3200,
      });
      data = result.data;
    } else {
      // Central-only fallback using existing endpoint selection.
      const cloudflareApiUrl = process.env.NEXT_PUBLIC_CLOUDFLARE_WORKER_URL;
      const nextjsApiUrl = process.env.NEXT_PUBLIC_KASPAREX_API_URL;

      const endpoint = cloudflareApiUrl
        ? `${cloudflareApiUrl}/kasparex/rewards/l1/status/${rewardId}`
        : nextjsApiUrl
          ? `${nextjsApiUrl}/api/rewards/l1/status/${rewardId}`
          : `/api/rewards/l1/status/${rewardId}`;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        return {
          status: 'error',
          error: errorData.error || `API error: ${response.status} ${response.statusText}`,
        };
      }

      data = await response.json();
    }

    return {
      status: data.status || 'pending',
      gridReward: data.gridReward,
      distributedAt: data.distributedAt,
    };
  } catch (error) {
    console.error('Error getting L1 reward status:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
