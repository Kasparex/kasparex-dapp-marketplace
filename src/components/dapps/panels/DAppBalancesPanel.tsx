'use client';

import { useMemo } from 'react';
import { useAccount, useChainId, useBalance } from 'wagmi';
import { formatUnits } from 'viem';
import { DApp, getDAppNetworkType } from '@/lib/dapps';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useGRIDToken } from '@/hooks/useGRIDToken';
import { useRedeemablePointsBreakdown } from '@/hooks/useRedeemablePointsBreakdown';
import { getContractAddress } from '@/lib/contracts/addresses';
import { getNativeCurrencySymbol } from '@/lib/wagmi';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { KX_CALCULATION_ASIDE } from '@/lib/hub/shellTokens';

function formatFee(value: number): string {
  if (value >= 1_000_000) {
    const v = value / 1_000_000;
    return Number.isInteger(v) ? `${v}M` : `${v.toFixed(2).replace(/\.?0+$/, '')}M`;
  }
  if (value >= 1_000) {
    const v = value / 1_000;
    return Number.isInteger(v) ? `${v}K` : `${v.toFixed(2).replace(/\.?0+$/, '')}K`;
  }
  if (value >= 1) return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '') || '0';
  if (value > 0) return value.toFixed(4).replace(/\.?0+$/, '') || '0';
  return '0';
}

export function DAppBalancesPanel({ dapp }: { dapp: DApp }) {
  const { address: userWalletAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const nativeSymbol = getNativeCurrencySymbol(chainId);
  getDAppNetworkType(dapp);

  const { data: nativeBalance } = useBalance({ address: userWalletAddress });
  const { balance: krexBalance, isLoading: krexLoading } = useKREXBalance();

  const gridTokenAddress = useMemo(() => {
    const tgrid = getContractAddress(chainId, 'tGRID');
    if (tgrid) return tgrid;
    return getContractAddress(chainId, 'GRIDToken') || null;
  }, [chainId]);

  const isTestnet = chainId === 167012 || chainId === 38836;
  const gridLabel = isTestnet ? 'tGRID' : 'GRID';
  const krexLabel = isTestnet ? 'tKREX' : 'KREX';
  const nativeLabel = chainId === 38833 || chainId === 38836 ? 'iKAS' : nativeBalance?.symbol || nativeSymbol;
  const { formattedBalance: gridFormattedBalance, isLoading: gridLoading } = useGRIDToken(gridTokenAddress);
  const { totalRedeemable: hubPts, address: hubAddr } = useRedeemablePointsBreakdown();

  const nativeFormatted = nativeBalance
    ? parseFloat(formatUnits(nativeBalance.value, nativeBalance.decimals))
    : 0;

  const rows = [
    { token: 'Hub pts', balance: !hubAddr ? 'Connect Kaspa L1' : hubPts.toLocaleString() },
    { token: nativeLabel, balance: isConnected ? formatFee(nativeFormatted) : '-' },
    { token: krexLabel, balance: !isConnected ? '-' : krexLoading ? '...' : formatLargeNumber(krexBalance) },
    { token: gridLabel, balance: !isConnected ? '-' : gridLoading ? '...' : gridFormattedBalance },
  ];

  return (
    <div className={KX_CALCULATION_ASIDE}>
      <DAppSectionHeader title="Your balances" hint="Wallet balances used for fees and rewards on this dApp." className="mb-3" />
      <div className="space-y-2">
        {rows.map(({ token, balance }) => (
          <div key={token} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">{token}</span>
            <span className="font-semibold tabular-nums text-[#02abb8]">{balance}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
