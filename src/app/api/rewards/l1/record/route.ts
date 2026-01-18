/**
 * L1 Reward Distribution API Route
 * 
 * Records L1 (Kaspa Native) dApp usage and triggers reward distribution
 * This endpoint coordinates with backend services to distribute GRID tokens
 * and dApp tokens to users after successful L1 transactions.
 */

import { NextRequest, NextResponse } from 'next/server';

export interface L1RewardRecordRequest {
  txHash: string;
  userAddress: string;
  dappId: string;
  actionType: string;
  actionValue: number; // in KAS
  network: 'L1';
}

export interface L1RewardRecordResponse {
  success: boolean;
  rewardId?: string;
  error?: string;
}

/**
 * POST /api/rewards/l1/record
 * 
 * Records an L1 transaction and initiates reward distribution
 */
export async function POST(request: NextRequest): Promise<NextResponse<L1RewardRecordResponse>> {
  try {
    const body: L1RewardRecordRequest = await request.json();

    // Validate required fields
    if (!body.txHash || !body.userAddress || !body.dappId || !body.actionType) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: txHash, userAddress, dappId, actionType',
        },
        { status: 400 }
      );
    }

    // Validate transaction hash format (Kaspa addresses are different, but tx hashes are hex)
    if (!/^[0-9a-fA-F]{64}$/.test(body.txHash.replace(/^0x/, ''))) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid transaction hash format',
        },
        { status: 400 }
      );
    }

    // Validate action value
    if (typeof body.actionValue !== 'number' || body.actionValue < 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid actionValue: must be a non-negative number',
        },
        { status: 400 }
      );
    }

    // Generate unique reward ID
    const rewardId = `l1_${Date.now()}_${body.txHash.slice(0, 16)}`;

    // TODO: Implement actual reward distribution logic
    // This should:
    // 1. Verify the transaction exists on Kaspa network
    // 2. Calculate rewards based on action value and user tier
    // 3. Queue reward distribution (via node network or direct transaction)
    // 4. Store reward record in database
    // 5. Return reward ID for tracking

    // For now, return success with reward ID
    // In production, this should be async and the actual distribution
    // should happen in the background
    console.log('L1 reward recorded:', {
      rewardId,
      txHash: body.txHash,
      userAddress: body.userAddress,
      dappId: body.dappId,
      actionType: body.actionType,
      actionValue: body.actionValue,
    });

    return NextResponse.json({
      success: true,
      rewardId,
    });
  } catch (error) {
    console.error('Error recording L1 reward:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
