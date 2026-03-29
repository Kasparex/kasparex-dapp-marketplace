'use client';

import { useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { getContractAddress } from '@/lib/contracts/addresses';
import {
  TREASURY_ABI,
  FEE_COLLECTOR_ABI,
  ERC20_VIEW_ABI,
} from '@/lib/contracts/abis';
import type { ContractKey, BasicParamKey } from '@/lib/contracts/contractsMetadata';

const SUPPORTED_PARAMS: Partial<
  Record<
    ContractKey,
    Partial<
      Record<
        BasicParamKey,
        { abi: readonly unknown[]; functionName: string; format: (v: unknown) => string }
      >
    >
  >
> = {
  Treasury: {
    balance: {
      abi: TREASURY_ABI,
      functionName: 'getBalance',
      format: (v) => (v != null ? `${Number(formatEther(v as bigint)).toLocaleString(undefined, { maximumFractionDigits: 2 })} KAS` : '-'),
    },
  },
  FeeCollector: {
    treasury: {
      abi: FEE_COLLECTOR_ABI,
      functionName: 'treasury',
      format: (v) =>
        typeof v === 'string' && v.startsWith('0x')
          ? `${v.slice(0, 6)}…${v.slice(-4)}`
          : '-',
    },
  },
  GRIDToken: {
    symbol: {
      abi: ERC20_VIEW_ABI,
      functionName: 'symbol',
      format: (v) => (typeof v === 'string' ? v : '-'),
    },
  },
  tGRID: {
    symbol: {
      abi: ERC20_VIEW_ABI,
      functionName: 'symbol',
      format: (v) => (typeof v === 'string' ? v : '-'),
    },
  },
};

export interface UseContractParamResult {
  value: string;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Read a single basic parameter for a contract (balance, treasury, symbol).
 * Returns formatted string; "-" if not supported or read fails.
 */
export function useContractParam(
  chainId: number,
  contractKey: ContractKey,
  paramKey: BasicParamKey
): UseContractParamResult {
  const config = SUPPORTED_PARAMS[contractKey]?.[paramKey];
  const address = getContractAddress(chainId, contractKey);
  const enabled =
    !!address &&
    address.startsWith('0x') &&
    !!config &&
    chainId > 0;

  const { data, isLoading, error } = useReadContract({
    address: enabled ? (address as `0x${string}`) : undefined,
    abi: config?.abi,
    functionName: config?.functionName,
    query: {
      enabled,
      staleTime: 60_000,
    },
  });

  const value =
    config && data !== undefined && data !== null
      ? config.format(data)
      : '-';

  return {
    value: enabled ? value : '-',
    isLoading: enabled && isLoading,
    error: error ?? null,
  };
}

