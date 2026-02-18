/**
 * L2 KREX Balance Query
 * Fetches KREX/tKREX token balance per chain (Kasplex L2 mainnet, IGRA Galleon Testnet 38836).
 */

import { createPublicClient, http, type Address, formatUnits } from 'viem';
import { defineChain } from 'viem';
import { getL2KREXConfig } from './l2-krex-config';

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
 * Query KREX/tKREX balance from L2 for the given chain.
 * 
 * @param address - EVM address (0x...)
 * @param chainId - Chain ID (202555 = Kasplex L2 KREX, 38836 = tKREX when set)
 * @returns KREX balance as number, or 0 if error / no token on chain
 */
export async function queryL2KREXBalance(address: string, chainId: number): Promise<number> {
  if (!address || typeof address !== 'string' || !address.startsWith('0x')) {
    console.warn('[KREX L2] Invalid EVM address:', address);
    return 0;
  }

  const config = getL2KREXConfig(chainId);
  if (!config) return 0;

  try {
    const chain = defineChain({
      id: config.chainId,
      name: 'L2',
      nativeCurrency: { name: 'KAS', symbol: 'KAS', decimals: 18 },
      rpcUrls: { default: { http: [config.rpcUrl] } },
    });
    const publicClient = createPublicClient({
      chain,
      transport: http(config.rpcUrl),
    });

    let decimals = 18;
    try {
      const decimalsResult = await publicClient.readContract({
        address: config.tokenAddress,
        abi: ERC20_ABI,
        functionName: 'decimals',
      });
      if (typeof decimalsResult === 'number') decimals = decimalsResult;
      else if (typeof decimalsResult === 'bigint') decimals = Number(decimalsResult);
    } catch (error) {
      console.warn('[KREX L2] Could not fetch decimals, using default 18:', error);
    }

    const balanceResult = await publicClient.readContract({
      address: config.tokenAddress,
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
