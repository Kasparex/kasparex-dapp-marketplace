'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAccount, useChainId, useSwitchChain, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { FeeDisplay } from '@/components/ui/FeeDisplay';
import { calculateCost, type CostBreakdown } from '@/lib/payments/calculator';
import { getContractAddress } from '@/lib/contracts/addresses';
import { DONATION_ESCROW_ABI, DONATION_ESCROW_V2_ABI } from '@/lib/contracts/abis';
import { getChainById, getNativeCurrencySymbol } from '@/lib/wagmi';
import { CROWDKAS_CHAIN_ID } from '@/lib/donations/chain';
import type { DApp, DAppStatus } from '@/lib/dapps';
import {
  VDONATIONS_MIN_DONATION_WEI,
  VDONATIONS_L2_FEE_PERCENT,
} from '@/lib/donations/config';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import type { DonationCampaign } from '@/lib/donations/types';
import { getErrorMessage } from '@/lib/utils';
import { getExplorerUrl } from '@/lib/dapps/deployer';
import { TransactionSuccessModal } from '@/components/modals/TransactionSuccessModal';
import { TransactionPendingModal } from '@/components/donations/TransactionPendingModal';
import type { Address } from 'viem';

function getCrowdKASDApp(chainId: number | undefined): DApp {
  const chain = chainId ? getChainById(chainId) : undefined;
  const isTestnet = Boolean(chain?.testnet);
  const status: DAppStatus = isTestnet ? 'Testnet' : 'Mainnet';
  return {
    id: 'donations',
    name: 'Kasparex CrowdKAS',
    slug: 'donations',
    category: 'payment' as const,
    network: chain?.name ?? 'L2',
    networkType: 'L2' as const,
    utility: '',
    process: '',
    benefits: '',
    developer: '',
    status,
    provider: '',
  };
}

interface DonationBlockProps {
  campaign: DonationCampaign;
  /** Called when L2 donation tx is confirmed so campaign/leaderboard can refetch. */
  onL2DonationConfirmed?: () => void;
  /** Optional: parent can track L2 amount for Revenue Tree preview. */
  onL2AmountChange?: (amount: number) => void;
}

export function DonationBlock({ campaign, onL2DonationConfirmed, onL2AmountChange }: DonationBlockProps) {
  const chainId = useChainId();
  const { isConnected: isL2Connected } = useAccount();
  const { switchChain, isPending: isSwitchPending } = useSwitchChain();
  const escrowAddress = getContractAddress(CROWDKAS_CHAIN_ID, 'DonationEscrow');
  const escrowV2Address = getContractAddress(CROWDKAS_CHAIN_ID, 'DonationEscrowV2');
  const useV2Donate = Boolean(campaign.campaignIdV2 != null && escrowV2Address);
  const nativeSymbol = getNativeCurrencySymbol(CROWDKAS_CHAIN_ID);
  const crowdkasChain = getChainById(CROWDKAS_CHAIN_ID);
  const crowdkasChainName = crowdkasChain?.name ?? 'Igra Mainnet';
  const onCrowdkasChain = chainId === CROWDKAS_CHAIN_ID;

  const [l2Amount, setL2Amount] = useState('');
  const [successModalDismissed, setSuccessModalDismissed] = useState(false);

  const { writeContract, data: hash, isPending: isPendingWrite, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
    chainId: hash ? CROWDKAS_CHAIN_ID : undefined,
  });

  // When a new tx is submitted, allow success modal to show again
  useEffect(() => {
    if (hash) setSuccessModalDismissed(false);
  }, [hash]);

  useEffect(() => {
    if (isConfirmed && onL2DonationConfirmed) onL2DonationConfirmed();
  }, [isConfirmed, onL2DonationConfirmed]);

  const { balance: krexBalance, tier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const paymentCostBreakdown = useMemo((): CostBreakdown | null => {
    if (!l2Amount || parseFloat(l2Amount) <= 0) return null;
    const amountNum = parseFloat(l2Amount);
    if (amountNum < 10) return null;
    return calculateCost({
      dapp: getCrowdKASDApp(CROWDKAS_CHAIN_ID),
      actionId: 'donation',
      krexBalance: krexBalance ?? 0,
      krexTier: tier,
      hasAnyNFT: !!(nftStatus?.hasKREXPRIME || nftStatus?.hasPIXELKREX ||
        (nftStatus?.partnerCollections && Object.values(nftStatus.partnerCollections || {}).some(Boolean))),
      hasDiamondNFT: !!(nftStatus?.hasDiamondKREXPRIME || nftStatus?.hasDiamondPIXELKREX ||
        (nftStatus?.partnerDiamonds && Object.values(nftStatus.partnerDiamonds || {}).some(Boolean))),
      hasRarestNFT: !!nftStatus?.hasRarestNFT,
      isNodeProvider: false,
      nodeFeeReduction: 0,
      overrideBaseCost: amountNum,
    });
  }, [l2Amount, krexBalance, tier, nftStatus]);

  useEffect(() => {
    if (!onL2AmountChange) return;
    const n = parseFloat(l2Amount);
    if (Number.isFinite(n)) onL2AmountChange(n);
  }, [l2Amount, onL2AmountChange]);

  const l2AmountWei = useMemo(() => {
    if (!l2Amount || parseFloat(l2Amount) <= 0) return 0n;
    try {
      const w = parseEther(l2Amount);
      return w < VDONATIONS_MIN_DONATION_WEI ? 0n : w;
    } catch {
      return 0n;
    }
  }, [l2Amount]);

  const activeEscrow = useV2Donate ? escrowV2Address : escrowAddress;
  const canDonateL2 =
    campaign.active &&
    activeEscrow &&
    l2AmountWei >= VDONATIONS_MIN_DONATION_WEI &&
    isL2Connected &&
    onCrowdkasChain;

  const handleDonateL2 = () => {
    if (!canDonateL2 || !activeEscrow) return;
    if (useV2Donate && campaign.campaignIdV2 != null) {
      writeContract({
        address: activeEscrow as Address,
        abi: DONATION_ESCROW_V2_ABI,
        functionName: 'donate',
        args: [campaign.campaignIdV2],
        value: l2AmountWei,
      });
      return;
    }
    writeContract({
      address: activeEscrow as Address,
      abi: DONATION_ESCROW_ABI,
      functionName: 'donate',
      args: [campaign.creatorAddress],
      value: l2AmountWei,
    });
  };

  return (
    <div className="border-t border-zinc-200 dark:border-zinc-700 pt-6 mt-6">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Donate</h3>

      <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Donate iKAS to the escrow. Min {formatEther(VDONATIONS_MIN_DONATION_WEI)} iKAS (10 iKAS). Rewards (if enabled) are handled automatically on-chain.
          </p>
          <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-sm text-zinc-700 dark:text-zinc-300">
            <p className="font-medium text-zinc-900 dark:text-zinc-100 mb-1">Where does the fee go?</p>
            <p>
              {VDONATIONS_L2_FEE_PERCENT}% of your donation goes to the <strong>Kasparex Revenue Tree</strong> to support community rewards and the referral program. The rest is escrowed for this campaign and goes to the creator when the goal is reached.
            </p>
          </div>
          {!isL2Connected && (
            <p className="text-amber-600 dark:text-amber-400 text-sm">Connect your L2 (EVM) wallet to donate.</p>
          )}
          {isL2Connected && !onCrowdkasChain && (
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3 text-sm text-amber-900 dark:text-amber-200 space-y-2">
              <p>
                CrowdKAS donations use <strong>{crowdkasChainName}</strong>. Switch your wallet to this network before donating.
              </p>
              <button
                type="button"
                disabled={isSwitchPending}
                onClick={() => switchChain?.({ chainId: CROWDKAS_CHAIN_ID })}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700 disabled:opacity-50"
              >
                {isSwitchPending ? 'Switching…' : `Switch to ${crowdkasChainName}`}
              </button>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Amount (iKAS)</label>
            <input
              type="number"
              value={l2Amount}
              onChange={(e) => setL2Amount(e.target.value)}
              placeholder="10"
              min="10"
              step="1"
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>
          {paymentCostBreakdown && (
            <FeeDisplay breakdown={paymentCostBreakdown} label="You pay" currency={nativeSymbol} />
          )}
          {writeError && (
            <p className="text-sm text-red-600 dark:text-red-400">{getErrorMessage(writeError, 'Transaction failed')}</p>
          )}
          <button
            type="button"
            onClick={handleDonateL2}
            disabled={!canDonateL2 || isPendingWrite || isConfirming}
            className="w-full px-4 py-3 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPendingWrite || isConfirming ? 'Confirming…' : 'Donate (L2)'}
          </button>
      </div>

      <TransactionPendingModal
        isOpen={Boolean(hash && !isConfirmed)}
        onClose={() => {}}
        txHash={hash ?? ''}
        chainId={CROWDKAS_CHAIN_ID}
        title="Donation submitted"
      />
      <TransactionSuccessModal
        isOpen={isConfirmed && Boolean(hash) && !successModalDismissed}
        onClose={() => setSuccessModalDismissed(true)}
        txHash={hash ?? ''}
        chainId={CROWDKAS_CHAIN_ID}
        addresses={
          isConfirmed && campaign?.creatorAddress
            ? [
                {
                  label: 'Campaign creator (receives funds)',
                  address: campaign.creatorAddress,
                  explorerUrl: getExplorerUrl(campaign.creatorAddress, CROWDKAS_CHAIN_ID),
                },
              ]
            : undefined
        }
        autoCloseMs={0}
      />
    </div>
  );
}
