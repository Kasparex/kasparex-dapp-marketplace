'use client';

import { useState, useMemo } from 'react';
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
  computeL1FeeKAS,
  getPlatformL1Address,
} from '@/lib/donations/config';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import type { DonationCampaign } from '@/lib/donations/types';
import { getErrorMessage } from '@/lib/utils';
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
}

export function DonationBlock({ campaign }: DonationBlockProps) {
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
  const [donationTxHash, setDonationTxHash] = useState('');
  const [feeTxHash, setFeeTxHash] = useState('');
  const [recordSubmitting, setRecordSubmitting] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [recordSuccess, setRecordSuccess] = useState(false);

  const { writeContract, data: hash, isPending: isPendingWrite, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const { balance: krexBalance, tier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const paymentCostBreakdown = useMemo((): CostBreakdown | null => {
    if (!l2Amount || parseFloat(l2Amount) <= 0) return null;
    const amountNum = parseFloat(l2Amount);
    if (amountNum < 100) return null;
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
    setRecordError(null);
    writeContract({
      address: escrowAddress as Address,
      abi: DONATION_ESCROW_ABI,
      functionName: 'donate',
      args: [campaign.creatorAddress],
      value: l2AmountWei,
    });
  };

  const handleRecordL1 = async () => {
    if (!donationTxHash.trim() || !campaign.creatorAddress || !l2Address) {
      setRecordError('Please connect your L2 wallet and enter the donation transaction hash.');
      return;
    }
    setRecordSubmitting(true);
    setRecordError(null);
    setRecordSuccess(false);
    try {
      const res = await fetch('/api/vdonations/l1/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donationTxHash: donationTxHash.replace(/^0x/, ''),
          creatorAddress: campaign.creatorAddress,
          donorL2Address: l2Address,
          ...(feeTxHash.trim() && { feeTxHash: feeTxHash.replace(/^0x/, '') }),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRecordError(data.error || 'Failed to record donation');
        return;
      }
      setRecordSuccess(true);
      setDonationTxHash('');
      setFeeTxHash('');
    } catch (e) {
      setRecordError(getErrorMessage(e, 'Failed to record donation'));
    } finally {
      setRecordSubmitting(false);
    }
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
            Donate iKAS to the escrow. Min {formatEther(VDONATIONS_MIN_DONATION_WEI)} iKAS. You get tGRID/GRID and points with KREX/NFT multipliers.
          </p>
          {!isL2Connected && (
            <p className="text-amber-600 dark:text-amber-400 text-sm">Connect your L2 (EVM) wallet to donate.</p>
          )}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Amount (iKAS)</label>
            <input
              type="number"
              value={l2Amount}
              onChange={(e) => setL2Amount(e.target.value)}
              placeholder="100"
              min="100"
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
          {isConfirmed && <p className="text-sm text-emerald-600 dark:text-emerald-400">Donation recorded. Thank you!</p>}
        </div>
      )}

      {mode === 'L1' && (
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Send KAS directly to the creator (min {VDONATIONS_MIN_DONATION_KAS} KAS), then send the platform fee. After both txs, submit the donation tx hash to receive points.
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
              placeholder="100"
              min={VDONATIONS_MIN_DONATION_KAS}
              step="1"
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>
          {l1AmountNum >= VDONATIONS_MIN_DONATION_KAS && (
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Platform fee: {l1FeeKas} KAS (to platform address)
            </div>
          )}
          {l1Address && (
            <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3 text-sm">
              <p className="font-medium text-zinc-700 dark:text-zinc-300 mb-1">Creator L1 address</p>
              <p className="font-mono text-zinc-600 dark:text-zinc-400 break-all">{l1Address}</p>
            </div>
          )}
          {platformL1 && (
            <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3 text-sm">
              <p className="font-medium text-zinc-700 dark:text-zinc-300 mb-1">Platform fee address</p>
              <p className="font-mono text-zinc-600 dark:text-zinc-400 break-all">{platformL1}</p>
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSendModalStep('donation')}
              disabled={!canDonateL1}
              className="px-4 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50"
            >
              Send donation
            </button>
            <button
              type="button"
              onClick={() => setSendModalStep('fee')}
              disabled={!canDonateL1 || l1FeeKas <= 0}
              className="px-4 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50"
            >
              Send fee
            </button>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4 mt-4">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">I&apos;ve donated — get my points</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
              After sending the donation (and optionally the fee), enter the donation transaction hash. Connect your L2 wallet so we know where to award points.
            </p>
            <input
              type="text"
              value={donationTxHash}
              onChange={(e) => setDonationTxHash(e.target.value)}
              placeholder="Donation tx hash (64 hex chars)"
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-mono mb-2"
            />
            <input
              type="text"
              value={feeTxHash}
              onChange={(e) => setFeeTxHash(e.target.value)}
              placeholder="Fee tx hash (optional)"
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-mono mb-2"
            />
            {!l2Address && (
              <p className="text-amber-600 dark:text-amber-400 text-sm mb-2">Connect L2 wallet to receive points.</p>
            )}
            <button
              type="button"
              onClick={handleRecordL1}
              disabled={recordSubmitting || !donationTxHash.trim() || !l2Address}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {recordSubmitting ? 'Submitting…' : 'Submit & get points'}
            </button>
            {recordError && <p className="text-sm text-red-600 dark:text-red-400 mt-2">{recordError}</p>}
            {recordSuccess && <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2">Recorded. Points awarded to your L2 wallet.</p>}
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
