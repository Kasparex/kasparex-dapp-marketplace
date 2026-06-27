'use client';

import { useMemo } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { formatEther } from 'viem';
import type { DApp } from '@/lib/dapps';
import { getDAppNetworkType } from '@/lib/dapps';
import { usePaymentAmount } from '@/lib/dapps/PaymentAmountContext';
import { RevenueTree } from '@/components/revenue-tree/RevenueTree';
import { generateMockRevenueTree } from '@/lib/revenue-tree/mockData';
import { generateDAppSlug } from '@/lib/utils';
import { unifiedToRevenueTreeData } from '@/lib/revenue-tree/utils';
import { getCurrentReferrer } from '@/lib/revenue-tree/referral';
import { useRevenueTree } from '@/hooks/useRevenueTree';
import { useSetReferrer } from '@/hooks/useSetReferrer';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { getDAppPaymentConfig } from '@/lib/payments/config';
import { calculateCost } from '@/lib/payments/calculator';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';

interface DAppRevenueTreePanelProps {
  dapp: DApp;
}

export function DAppRevenueTreePanel({ dapp }: DAppRevenueTreePanelProps) {
  const { address: userWalletAddress } = useAccount();
  const chainId = useChainId();
  const slug = dapp.slug || generateDAppSlug(dapp.name);
  const { paymentAmount } = usePaymentAmount();

  const networkType = getDAppNetworkType(dapp);
  const isL2 = networkType === 'L2';

  const { tree: unifiedTree } = useRevenueTree();
  const {
    setReferrer,
    isPending: setReferrerPending,
    isConfirming: setReferrerConfirming,
    isSupported: setReferrerSupported,
  } = useSetReferrer();
  const pendingReferrer = typeof window !== 'undefined' ? getCurrentReferrer() : null;

  const revenueTreeData = useMemo(() => {
    const data = unifiedToRevenueTreeData(unifiedTree ?? null);
    if (data) return data;
    return generateMockRevenueTree(dapp.id, slug, userWalletAddress ?? undefined, chainId, false);
  }, [unifiedTree, dapp.id, slug, userWalletAddress, chainId]);

  const activationAmount = useMemo(() => {
    if (!unifiedTree?.lifetimeVolume) return 0;
    return parseFloat(formatEther(BigInt(unifiedTree.lifetimeVolume)));
  }, [unifiedTree?.lifetimeVolume]);

  const { balance: krexBalance, tier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();

  const paymentConfig = useMemo(() => getDAppPaymentConfig(dapp, networkType), [dapp, networkType]);

  const previewAmount = useMemo(() => {
    if (paymentAmount != null && paymentAmount > 0) return paymentAmount;
    const firstAction = paymentConfig?.actions[0];
    if (!firstAction) return 10;
    const breakdown = calculateCost({
      dapp,
      actionId: firstAction.actionId,
      krexBalance: krexBalance || 0,
      krexTier: tier,
      hasAnyNFT: !!(
        nftStatus?.hasKREXPRIME ||
        nftStatus?.hasPIXELKREX ||
        (nftStatus?.partnerCollections && Object.values(nftStatus.partnerCollections || {}).some((v) => v))
      ),
      hasDiamondNFT: !!(
        nftStatus?.hasDiamondKREXPRIME ||
        nftStatus?.hasDiamondPIXELKREX ||
        (nftStatus?.partnerDiamonds && Object.values(nftStatus.partnerDiamonds || {}).some((v) => v))
      ),
      hasRarestNFT: !!nftStatus?.hasRarestNFT,
      isNodeProvider: false,
      nodeFeeReduction: 0,
    });
    return breakdown.finalCost;
  }, [paymentAmount, paymentConfig, dapp, krexBalance, tier, nftStatus]);

  if (!isL2) {
    return (
      <div className="space-y-4">
        <DAppSectionHeader title="Revenue Tree" hint="Native referral rewards on L2 dApps." />
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-6 text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Revenue Tree is only available for L2 (Igra) dApps.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DAppSectionHeader
        title="Revenue Tree"
        hint="5-level native referral rewards. Share your link to earn from downstream activity."
      />

      {pendingReferrer && !unifiedTree?.referrerSet && setReferrerSupported && userWalletAddress ? (
        <div className="rounded-xl border border-[#02abb8]/30 bg-[#02abb8]/5 dark:bg-[#02abb8]/10 p-4 space-y-3">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            Set your referrer once to join the tree:{' '}
            <span className="font-mono text-xs">
              {pendingReferrer.slice(0, 10)}…{pendingReferrer.slice(-8)}
            </span>
          </p>
          <button
            type="button"
            onClick={() => setReferrer(pendingReferrer as `0x${string}`)}
            disabled={setReferrerPending || setReferrerConfirming}
            className="k-cta-primary !h-10 !px-4 !text-xs disabled:opacity-50"
          >
            {setReferrerPending || setReferrerConfirming ? 'Confirm in wallet…' : 'Set referrer'}
          </button>
        </div>
      ) : null}

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 sm:p-6">
        <RevenueTree
          data={revenueTreeData}
          userWalletAddress={userWalletAddress || undefined}
          isL2Only={true}
          activationAmount={activationAmount}
          amountSpent={previewAmount}
          treeBps={1000}
        />
      </div>
    </div>
  );
}
