/**
 * L2 KREX Balance Query
 * Fetches KREX token balance from Kasplex L2 (ERC-20) using EVM RPC
 */

import { createPublicClient, http, type Address, formatUnits } from 'viem';
import { kasplexL2Mainnet } from '@/lib/wagmi';

// KREX ERC-20 contract address on Kasplex L2
const KREX_TOKEN_ADDRESS = '0x0FD8d408cE707f4E4f8E54193c4C55a3b969834B' as Address;

// Standard ERC-20 ABI (only balanceOf and decimals functions)
const ERC20_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

/**
 * Query KREX balance from L2 (Kasplex ERC-20) using EVM RPC
 * 
 * @param address - EVM address (0x...)
 * @returns KREX balance as number, or 0 if error/invalid address
 */
export async function queryL2KREXBalance(address: string): Promise<number> {
  if (!address || typeof address !== 'string' || !address.startsWith('0x')) {
    console.warn('[KREX L2] Invalid EVM address:', address);
    return 0;
  }

  try {
    // Create public client for Kasplex L2 Mainnet
    const publicClient = createPublicClient({
      chain: kasplexL2Mainnet,
      transport: http('https://evmrpc.kasplex.org'),
    });

    console.log('[KREX L2] Fetching balance for:', address);

    // Get token decimals first (default to 18 if call fails)
    let decimals = 18;
    try {
      const decimalsResult = await publicClient.readContract({
        address: KREX_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'decimals',
      });
      
      if (typeof decimalsResult === 'number') {
        decimals = decimalsResult;
      } else if (typeof decimalsResult === 'bigint') {
        decimals = Number(decimalsResult);
      }
    } catch (error) {
      console.warn('[KREX L2] Could not fetch decimals, using default 18:', error);
    }

    // Get balance
    const balanceResult = await publicClient.readContract({
      address: KREX_TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address as Address],
    });

    // Convert balance from BigInt to number
    let balanceBigInt: bigint;
    if (typeof balanceResult === 'bigint') {
      balanceBigInt = balanceResult;
    } else if (typeof balanceResult === 'string') {
      balanceBigInt = BigInt(balanceResult);
    } else {
      console.warn('[KREX L2] Unexpected balance format:', balanceResult);
      return 0;
    }

    // Format balance using decimals
    const balanceString = formatUnits(balanceBigInt, decimals);
    const balance = parseFloat(balanceString);

    if (isNaN(balance)) {
      console.warn('[KREX L2] Invalid balance after formatting:', balanceString);
      return 0;
    }

    console.log(`[KREX L2] ✓ Balance: ${balance}`);
    return balance;
  } catch (error) {
    console.error('[KREX L2] Error fetching balance:', error);
    return 0;
  }
}
