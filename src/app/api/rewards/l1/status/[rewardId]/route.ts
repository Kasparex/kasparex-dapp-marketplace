/**
 * L1 Reward Status API Route
 * 
 * Returns the status of an L1 reward distribution
 */

import { NextRequest, NextResponse } from 'next/server';

export interface L1RewardStatusResponse {
  status: 'pending' | 'processing' | 'distributed' | 'failed' | 'error';
  gridReward?: number;
  dAppTokenReward?: number;
  distributedAt?: string;
  error?: string;
}

/**
 * GET /api/rewards/l1/status/[rewardId]
 * 
 * Get the status of an L1 reward distribution
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { rewardId: string } }
): Promise<NextResponse<L1RewardStatusResponse>> {
  try {
    const { rewardId } = params;

    if (!rewardId) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Missing rewardId',
        },
        { status: 400 }
      );
    }

    // TODO: Implement actual status lookup
    // This should:
    // 1. Query database for reward record
    // 2. Check distribution status
    // 3. Return current status and reward amounts
    // 4. Include distributedAt timestamp if completed

    // For now, return placeholder status
    // In production, this should query the actual database
    console.log('L1 reward status requested:', { rewardId });

    // Placeholder: Return pending status
    // In real implementation, check database for actual status
    return NextResponse.json({
      status: 'pending',
      gridReward: undefined,
      dAppTokenReward: undefined,
      distributedAt: undefined,
    });
  } catch (error) {
    console.error('Error getting L1 reward status:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
