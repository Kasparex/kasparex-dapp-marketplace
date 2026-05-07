'use client';

import { useMemo } from 'react';
import { useChainId, useReadContracts } from 'wagmi';
import { formatUnits } from 'viem';
import type { Address } from 'viem';
import { getContractAddress } from '@/lib/contracts/addresses';
import { getL2KREXConfig } from '@/lib/krex/l2-krex-config';
import { getRewardsClaimVaultAddress } from '@/lib/rewards/rewards-claim-vault-address';
import { CHAIN_IDS } from '@/lib/wagmi';

const erc20Abi = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
] as const;

function formatPoolHuman(balanceWei: bigint, decimals: number): string {
  const raw = formatUnits(balanceWei, decimals);
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 })}M`;
  }
  if (n >= 10_000) {
    return Math.floor(n).toLocaleString();
  }
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export function useRewardsClaimVaultPoolBalances(): {
  gridDisplay: string | null;
  krexDisplay: string | null;
  isLoading: boolean;
  isLive: boolean;
  refetch: () => void;
} {
  const chainId = useChainId();
  const vault = useMemo(() => getRewardsClaimVaultAddress(chainId), [chainId]);
  const gridToken = useMemo((): Address | null => {
    if (chainId !== CHAIN_IDS.IGRA_MAINNET) return null;
    const a = getContractAddress(chainId, 'GRIDToken')?.trim() ?? '';
    return /^0x[a-fA-F0-9]{40}$/.test(a) ? (a as Address) : null;
  }, [chainId]);
  const krexToken = useMemo((): Address | null => {
    const c = getL2KREXConfig(chainId);
    const a = c?.tokenAddress;
    if (!a) return null;
    const s = String(a).trim();
    return /^0x[a-fA-F0-9]{40}$/.test(s) ? (s as Address) : null;
  }, [chainId]);

  const enabled = Boolean(chainId === CHAIN_IDS.IGRA_MAINNET && vault && gridToken && krexToken);

  const { data: results, isLoading, refetch } = useReadContracts({
    allowFailure: true,
    contracts:
      enabled && vault && gridToken && krexToken
        ? ([
            {
              chainId: CHAIN_IDS.IGRA_MAINNET,
              address: gridToken,
              abi: erc20Abi,
              functionName: 'balanceOf',
              args: [vault],
            },
            {
              chainId: CHAIN_IDS.IGRA_MAINNET,
              address: gridToken,
              abi: erc20Abi,
              functionName: 'decimals',
              args: [],
            },
            {
              chainId: CHAIN_IDS.IGRA_MAINNET,
              address: krexToken,
              abi: erc20Abi,
              functionName: 'balanceOf',
              args: [vault],
            },
            {
              chainId: CHAIN_IDS.IGRA_MAINNET,
              address: krexToken,
              abi: erc20Abi,
              functionName: 'decimals',
              args: [],
            },
          ] as const)
        : [],
    query: {
      enabled,
      refetchInterval: 30_000,
    },
  });

  const { gridDisplay, krexDisplay, isLive } = useMemo(() => {
    if (!enabled || !results || results.length < 4) {
      return { gridDisplay: null as string | null, krexDisplay: null as string | null, isLive: false };
    }
    const gb = results[0]?.status === 'success' ? results[0].result : null;
    const gd = results[1]?.status === 'success' ? Number(results[1].result) : 18;
    const kb = results[2]?.status === 'success' ? results[2].result : null;
    const kd = results[3]?.status === 'success' ? Number(results[3].result) : 8;

    const gridDecimals = Number.isFinite(gd) && gd >= 0 && gd <= 36 ? gd : 18;
    const krexDecimals = Number.isFinite(kd) && kd >= 0 && kd <= 36 ? kd : 8;

    const gridDisplay =
      typeof gb === 'bigint' ? formatPoolHuman(gb, gridDecimals) : null;
    const krexDisplay =
      typeof kb === 'bigint' ? formatPoolHuman(kb, krexDecimals) : null;

    return {
      gridDisplay,
      krexDisplay,
      isLive: gridDisplay != null || krexDisplay != null,
    };
  }, [enabled, results]);

  return {
    gridDisplay,
    krexDisplay,
    isLoading: Boolean(isLoading && enabled),
    isLive,
    refetch,
  };
}
