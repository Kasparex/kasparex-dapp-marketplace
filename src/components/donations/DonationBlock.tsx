'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useKaspaBalance } from '@/hooks/useKaspaBalance';
import { SendTransactionModal } from '@/components/modals/SendTransactionModal';
import { FeeDisplay } from '@/components/ui/FeeDisplay';
import { calculateCost, type CostBreakdown } from '@/lib/payments/calculator';
import { getContractAddress } from '@/lib/contracts/addresses';
import { DONATION_ESCROW_ABI } from '@/lib/contracts/abis';
import { getNativeCurrencySymbol } from '@/lib/wagmi';
import {
  VDONATIONS_MIN_DONATION_KAS,
  VDONATIONS_MIN_DONATION_WEI,
  VDONATIONS_L2_FEE_PERCENT,
  computeL1FeeKAS,
  getPlatformL1Address,
} from '@/lib/donations/config';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import type { DonationCampaign } from '@/lib/donations/types';
import { getErrorMessage } from '@/lib/utils';
import { getKaspaExplorerAddressUrl } from '@/lib/store/utils';
import { getExplorerUrl } from '@/lib/dapps/deployer';
import { CopyableAddress } from '@/components/donations/CopyableAddress';
import { TransactionSuccessModal } from '@/components/modals/TransactionSuccessModal';
import { TransactionPendingModal } from '@/components/donations/TransactionPendingModal';
import type { Address } from 'viem';

/** Minimal DApp shape for vDonations fee calculator (KREX/NFT discounts) */
const VDONATIONS_DAPP = {
  id: 'vdonations',
  name: 'Kasparex vDonations',
  slug: 'vdonations',
  category: 'payment' as const,
  network: 'IGRA Galleon Testnet',
  networkType: 'L2' as const,
  utility: '',
  process: '',
  benefits: '',
  developer: '',
  status: 'Testnet' as const,
  provider: '',
};

interface DonationBlockProps {
  campaign: DonationCampaign;
  /** Called when L2 donation tx is confirmed so campaign/leaderboard can refetch. */
  onL2DonationConfirmed?: () => void;
  /** Optional: parent can track L2 amount for Revenue Tree preview. */
  onL2AmountChange?: (amount: number) => void;
}

export function DonationBlock({ campaign, onL2DonationConfirmed, onL2AmountChange }: DonationBlockProps) {
  const chainId = useChainId();
  const { address: l2Address, isConnected: isL2Connected } = useAccount();
  const { state: kaspaState } = useKaspaWallet();
  const { balance: kaspaBalance } = useKaspaBalance();
  const escrowAddress = getContractAddress(chainId, 'DonationEscrow');
  const nativeSymbol = getNativeCurrencySymbol(chainId);

  const [mode, setMode] = useState<'L1' | 'L2'>('L2');
  const [l1AmountKas, setL1AmountKas] = useState('');
  const [l2Amount, setL2Amount] = useState('');
  const [sendModalStep, setSendModalStep] = useState<'donation' | 'fee' | null>(null);
  const [l1FlowOpen, setL1FlowOpen] = useState(false);
  const [successModalDismissed, setSuccessModalDismissed] = useState(false);

  const { writeContract, data: hash, isPending: isPendingWrite, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

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
      dapp: VDONATIONS_DAPP,
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

  const l1AmountNum = l1AmountKas ? parseFloat(l1AmountKas) : 0;
  const l1FeeKas = l1AmountNum >= VDONATIONS_MIN_DONATION_KAS ? computeL1FeeKAS(l1AmountNum) : 0;
  const platformL1 = getPlatformL1Address();
  const l1Address = (campaign.l1Address || '').trim();

  const l2AmountWei = useMemo(() => {
    if (!l2Amount || parseFloat(l2Amount) <= 0) return 0n;
    try {
      const w = parseEther(l2Amount);
      return w < VDONATIONS_MIN_DONATION_WEI ? 0n : w;
    } catch {
      return 0n;
    }
  }, [l2Amount]);

  const canDonateL2 = campaign.active && escrowAddress && l2AmountWei >= VDONATIONS_MIN_DONATION_WEI && isL2Connected;
  const canDonateL1 = campaign.active && l1Address && platformL1 && l1AmountNum >= VDONATIONS_MIN_DONATION_KAS && kaspaState.isConnected;

  const handleDonateL2 = () => {
    if (!canDonateL2 || !escrowAddress) return;
    writeContract({
      address: escrowAddress as Address,
      abi: DONATION_ESCROW_ABI,
      functionName: 'donate',
      args: [campaign.creatorAddress],
      value: l2AmountWei,
    });
  };

  return (
    <div className="border-t border-zinc-200 dark:border-zinc-700 pt-6 mt-6">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Donate</h3>

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setMode('L2')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'L2'
              ? 'bg-emerald-600 text-white'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          L2 (escrow)
        </button>
        <button
          type="button"
          onClick={() => setMode('L1')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'L1'
              ? 'bg-emerald-600 text-white'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          L1 (direct)
        </button>
      </div>

      {mode === 'L2' && (
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Donate iKAS to the escrow. Min {formatEther(VDONATIONS_MIN_DONATION_WEI)} iKAS (10 iKAS). You get tGRID/GRID and points with KREX/NFT multipliers.
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
      )}

      <TransactionPendingModal
        isOpen={Boolean(hash && !isConfirmed)}
        onClose={() => {}}
        txHash={hash ?? ''}
        chainId={chainId ?? 38836}
        title="Donation submitted"
      />
      <TransactionSuccessModal
        isOpen={isConfirmed && Boolean(hash) && !successModalDismissed}
        onClose={() => setSuccessModalDismissed(true)}
        txHash={hash ?? ''}
        chainId={chainId ?? 38836}
        addresses={isConfirmed && campaign?.creatorAddress ? [{ label: 'Campaign creator (receives funds)', address: campaign.creatorAddress, explorerUrl: chainId ? getExplorerUrl(campaign.creatorAddress, chainId) : undefined }] : undefined}
        autoCloseMs={0}
      />

      {mode === 'L1' && (
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Send KAS directly to the creator (min {VDONATIONS_MIN_DONATION_KAS} KAS). Optionally send the platform fee to support the platform.
          </p>
          {!kaspaState.isConnected && (
            <p className="text-amber-600 dark:text-amber-400 text-sm">Connect your Kaspa (L1) wallet to send KAS.</p>
          )}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Donation amount (KAS)</label>
            <input
              type="number"
              value={l1AmountKas}
              onChange={(e) => setL1AmountKas(e.target.value)}
              placeholder="10"
              min={VDONATIONS_MIN_DONATION_KAS}
              step="1"
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>
          {l1AmountNum >= VDONATIONS_MIN_DONATION_KAS && (
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Platform fee: {l1FeeKas} KAS (1% of donation, min 1 KAS) — goes to the platform address below.
            </div>
          )}
          {l1Address && (
            <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3 text-sm">
              <CopyableAddress label="Creator L1 address" value={l1Address} explorerUrl={getKaspaExplorerAddressUrl(l1Address)} truncate={false} />
            </div>
          )}
          {platformL1 && (
            <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3 text-sm">
              <CopyableAddress label="Platform fee address" value={platformL1} explorerUrl={getKaspaExplorerAddressUrl(platformL1)} truncate={false} />
            </div>
          )}
          <button
            type="button"
            onClick={() => setL1FlowOpen(true)}
            disabled={!canDonateL1}
            className="w-full px-4 py-3 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Donate (L1) — send to creator & platform fee
          </button>
        </div>
      )}

      {/* L1 flow modal: one place to trigger both sends */}
      {l1FlowOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50" onClick={() => setL1FlowOpen(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">L1 donation</h4>
              <button type="button" onClick={() => setL1FlowOpen(false)} className="p-1 rounded text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300" aria-label="Close">×</button>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Complete both steps. Your wallet will open for each transaction.</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <span className="text-sm text-zinc-700 dark:text-zinc-300">1. Send {l1AmountKas || '—'} KAS to creator</span>
                <button type="button" onClick={() => setSendModalStep('donation')} disabled={!canDonateL1} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">Send</button>
              </div>
              <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <span className="text-sm text-zinc-700 dark:text-zinc-300">2. Send {l1FeeKas > 0 ? l1FeeKas : '—'} KAS platform fee</span>
                <button type="button" onClick={() => setSendModalStep('fee')} disabled={!canDonateL1 || l1FeeKas <= 0} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">Send</button>
              </div>
            </div>
            <button type="button" onClick={() => setL1FlowOpen(false)} className="w-full py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800">Done / Close</button>
          </div>
        </div>
      )}

      <SendTransactionModal
        isOpen={sendModalStep === 'donation'}
        onClose={() => setSendModalStep(null)}
        currentBalance={kaspaBalance}
        address={kaspaState.address}
        initialToAddress={sendModalStep === 'donation' ? l1Address : undefined}
        initialAmount={sendModalStep === 'donation' && l1AmountNum >= VDONATIONS_MIN_DONATION_KAS ? String(l1AmountNum) : undefined}
      />
      <SendTransactionModal
        isOpen={sendModalStep === 'fee'}
        onClose={() => setSendModalStep(null)}
        currentBalance={kaspaBalance}
        address={kaspaState.address}
        initialToAddress={sendModalStep === 'fee' ? platformL1 : undefined}
        initialAmount={sendModalStep === 'fee' && l1FeeKas > 0 ? String(l1FeeKas) : undefined}
      />
    </div>
  );
}
