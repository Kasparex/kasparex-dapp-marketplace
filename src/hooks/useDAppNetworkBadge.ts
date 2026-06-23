'use client';

import { useMemo } from 'react';
import { useAccount, useChainId } from 'wagmi';
import type { DApp } from '@/lib/dapps';
import { getDAppChainIds, getDAppNetworkType, isDAppCompatibleWithChain } from '@/lib/dapps';
import { getDAppPrimaryChainName } from '@/lib/dapps/contractResolver';
import { getChainById } from '@/lib/wagmi';
import { isTestnetDApp } from '@/lib/dapps/access';

export type DAppNetworkBadgeKind =
  | 'kaspa_mainnet'
  | 'kaspa_testnet'
  | 'l2_mainnet'
  | 'l2_testnet'
  | 'neutral';

export function getDAppNetworkBadgeClassName(kind: DAppNetworkBadgeKind, suspended = false): string {
  if (kind === 'kaspa_mainnet') {
    return 'bg-cyan-500/10 text-[#028f9a] dark:text-[#70C7BA] border border-cyan-500/25';
  }
  if (kind === 'kaspa_testnet') {
    return 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border border-zinc-300/40 dark:border-zinc-700/60';
  }
  if (kind === 'l2_testnet') {
    return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-300/50 dark:border-yellow-600/40';
  }
  if (kind === 'l2_mainnet') {
    return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-300/50 dark:border-emerald-600/40';
  }
  if (suspended) {
    return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-300/50 dark:border-red-600/40';
  }
  return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300/50 dark:border-zinc-700/60';
}

export function useDAppNetworkBadge(
  dapp: DApp,
  options?: { preferRequired?: boolean }
) {
  const preferRequired = options?.preferRequired ?? false;
  const chainId = useChainId();
  const { isConnected: isEvmConnected } = useAccount();
  const networkType = getDAppNetworkType(dapp);
  const statusLower = (dapp.status || '').toLowerCase();
  const testnetDApp = isTestnetDApp(dapp);

  const statusType = useMemo(() => {
    if (statusLower === 'suspended') return 'suspended' as const;
    if (statusLower === 'testnet' || testnetDApp) return 'testnet' as const;
    if (statusLower === 'mainnet') return 'mainnet' as const;
    return 'none' as const;
  }, [statusLower, testnetDApp]);

  const statusLabel = useMemo(() => {
    const status = (dapp.status || '').toLowerCase();
    const env = status === 'testnet' || testnetDApp ? 'Testnet' : status === 'mainnet' ? 'Mainnet' : dapp.status;
    if (!env || env === 'Suspended') return env === 'Suspended' ? 'Suspended' : '';

    const lower = (dapp.network || '').toLowerCase();
    if (networkType === 'L2') {
      const family = lower.includes('igra') ? 'Igra' : lower.includes('kasplex') ? 'Kasplex' : 'L2';
      return `${family} ${env}`;
    }
    const family = lower.includes('kaspa') ? 'Kaspa' : 'L1';
    return `${family} ${env}`;
  }, [dapp.network, dapp.status, networkType, testnetDApp]);

  const requiredChainIds = useMemo(() => getDAppChainIds(dapp), [dapp]);

  const isL2ChainCompatible = useMemo(() => {
    if (networkType !== 'L2') return true;
    if (!isEvmConnected || chainId === undefined) return false;
    return isDAppCompatibleWithChain(dapp, chainId);
  }, [chainId, dapp, isEvmConnected, networkType]);

  const primaryRequiredChainName = useMemo(() => getDAppPrimaryChainName(dapp), [dapp]);

  const activeChain = useMemo(() => (chainId ? getChainById(chainId) : null), [chainId]);

  const badgeNetworkLabel = useMemo(() => {
    if (networkType === 'L2') {
      if (!preferRequired && isEvmConnected && chainId !== undefined && isL2ChainCompatible) {
        return activeChain?.name || `Chain ${chainId}`;
      }
      return primaryRequiredChainName || dapp.network || 'L2';
    }

    const nice = statusLabel || (networkType === 'L1' ? 'Kaspa' : dapp.network ? dapp.network : 'L1');
    return nice.replace(/^(L1|L2)\s+/i, '');
  }, [
    activeChain?.name,
    chainId,
    dapp.network,
    isEvmConnected,
    isL2ChainCompatible,
    networkType,
    preferRequired,
    primaryRequiredChainName,
    statusLabel,
  ]);

  const badgeKind = useMemo((): DAppNetworkBadgeKind => {
    if (networkType === 'L1') {
      const lower = badgeNetworkLabel.toLowerCase();
      if (lower.includes('kaspa') && lower.includes('mainnet')) return 'kaspa_mainnet';
      if (
        lower.includes('kaspa') &&
        (lower.includes('testnet') || lower.includes('vprogs') || lower.includes('simulator'))
      ) {
        return 'kaspa_testnet';
      }
      return statusType === 'testnet' ? 'kaspa_testnet' : statusType === 'mainnet' ? 'kaspa_mainnet' : 'neutral';
    }

    if (networkType === 'L2') {
      if (!preferRequired && isEvmConnected && chainId !== undefined && isL2ChainCompatible) {
        return activeChain?.testnet ? 'l2_testnet' : 'l2_mainnet';
      }
      const lower = badgeNetworkLabel.toLowerCase();
      if (lower.includes('testnet')) return 'l2_testnet';
      if (lower.includes('mainnet')) return 'l2_mainnet';
      return statusType === 'testnet' ? 'l2_testnet' : statusType === 'mainnet' ? 'l2_mainnet' : 'neutral';
    }

    return 'neutral';
  }, [
    activeChain?.testnet,
    badgeNetworkLabel,
    chainId,
    isEvmConnected,
    isL2ChainCompatible,
    networkType,
    preferRequired,
    statusType,
  ]);

  const badgeClassName = getDAppNetworkBadgeClassName(badgeKind, statusType === 'suspended');

  return {
    networkType,
    badgeNetworkLabel,
    badgeKind,
    badgeClassName,
    statusType,
  };
}
