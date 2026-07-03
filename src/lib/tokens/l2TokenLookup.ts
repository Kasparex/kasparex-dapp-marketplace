/**
 * L2 EVM ERC-20 token metadata lookup via viem publicClient.
 */

import { createPublicClient, http, type Address, isAddress } from 'viem';
import type { TokenOnChainSnapshot } from './listingRecord';
import { getL2KREXConfig } from '@/lib/krex/l2-krex-config';

const ERC20_ABI = [
  {
    type: 'function',
    name: 'name',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
  {
    type: 'function',
    name: 'symbol',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
  {
    type: 'function',
    name: 'totalSupply',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
] as const;

const OWNABLE_ABI = [
  {
    type: 'function',
    name: 'owner',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
] as const;

export type L2TokenInfo = TokenOnChainSnapshot;

function chainIdForListingNetwork(network: 'l2_kasplex' | 'l2_igra'): number {
  return network === 'l2_igra' ? 38833 : 202555;
}

export async function fetchL2TokenInfo(
  contractAddress: string,
  listingNetwork: 'l2_kasplex' | 'l2_igra',
): Promise<L2TokenInfo | null> {
  const addr = contractAddress.trim();
  if (!isAddress(addr)) return null;

  const chainId = chainIdForListingNetwork(listingNetwork);
  const config = getL2KREXConfig(chainId);
  if (!config?.rpcUrl) return null;

  const client = createPublicClient({
    transport: http(config.rpcUrl),
  });

  const address = addr as Address;

  try {
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      client.readContract({ address, abi: ERC20_ABI, functionName: 'name' }).catch(() => ''),
      client.readContract({ address, abi: ERC20_ABI, functionName: 'symbol' }).catch(() => ''),
      client.readContract({ address, abi: ERC20_ABI, functionName: 'decimals' }).catch(() => 18),
      client.readContract({ address, abi: ERC20_ABI, functionName: 'totalSupply' }).catch(() => BigInt(0)),
    ]);

    let owner: string | undefined;
    try {
      owner = (await client.readContract({ address, abi: OWNABLE_ABI, functionName: 'owner' })) as string;
    } catch {
      owner = undefined;
    }

    const dec = Number(decimals) || 18;

    return {
      source: 'l2',
      ticker: String(symbol || '').toUpperCase(),
      name: String(name || symbol || 'Token'),
      contractAddress: addr,
      decimals: dec,
      minted: totalSupply.toString(),
      owner: owner?.toLowerCase(),
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function formatL2Supply(raw: string | undefined, decimals: number): string {
  if (!raw) return 'n/a';
  try {
    const n = BigInt(raw);
    const divisor = BigInt(10 ** Math.min(decimals, 18));
    const whole = n / divisor;
    return whole.toLocaleString();
  } catch {
    return raw;
  }
}

export { chainIdForListingNetwork };
