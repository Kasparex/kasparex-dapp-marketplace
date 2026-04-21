'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { GENESIS_BADGE_ABI } from '@/lib/contracts/abis';
import { getDAppContractAddress } from '@/lib/dapps/contractResolver';
import { placeholderDApps } from '@/lib/dapps';
import { getNativeCurrencySymbol } from '@/lib/wagmi';
import { calculateCost, formatPrice, type CostBreakdown } from '@/lib/payments/calculator';
import { getDefaultRewardsBreakdown } from '@/lib/rewards/mockData';
import { KREX_TIERS } from '@/lib/rewards/types';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import { useAutomatedRewards } from '@/hooks/useAutomatedRewards';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { DApp } from '@/lib/dapps';
import { storeTransaction } from '@/lib/transactions/tracker';
import { TransactionTracker } from '@/components/transactions/TransactionTracker';
import { RewardStatusBox } from '@/components/rewards/RewardStatusBox';
import { useToast } from '@/hooks/useToast';
import { TransactionSuccessModal } from '@/components/modals/TransactionSuccessModal';
import { TransactionErrorModal } from '@/components/modals/TransactionErrorModal';
import { useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/utils';
import { useSafeError } from '@/hooks/useSafeError';

const THEME_NAMES = ['Crimson', 'Ocean', 'Forest', 'Solar', 'Void', 'Amber', 'Frost', 'Ember'];
const TITLE_NAMES = ['Genesis Tester', 'Galleon Pioneer', 'Early Voyager', 'Testnet Explorer', 'Genesis Crew', 'First Wave', 'Trailblazer', 'Pathfinder'];

function getGenesisBadgeDApp(dapps: DApp[]): DApp | undefined {
  return dapps.find((d) => d.slug === 'genesis-badge');
}

export interface GenesisBadgeWidgetProps {
  dapp?: DApp;
}

export function GenesisBadgeWidget({ dapp: dappProp }: GenesisBadgeWidgetProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTxHash, setSuccessTxHash] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const genesisBadgeDApp = dappProp ?? (typeof window !== 'undefined' ? getGenesisBadgeDApp(require('@/lib/dapps').placeholderDApps) : undefined);
  const contractAddress = genesisBadgeDApp ? getDAppContractAddress(genesisBadgeDApp, chainId) : '';

  const { balance: krexBalance, l2Balance: krexL2Balance, tier, tierForChain } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const { distributeRewardAfterTransaction } = useAutomatedRewards();
  const queryClient = useQueryClient();
  const nativeSymbol = getNativeCurrencySymbol(chainId);
  const gridLabel = chainId === 167012 || chainId === 38836 ? 'tGRID' : 'GRID';

  const costBreakdown = useMemo((): CostBreakdown | null => {
    if (!genesisBadgeDApp) return null;
    return calculateCost({
      dapp: genesisBadgeDApp,
      actionId: 'unlock-or-boost',
      krexBalance: krexBalance ?? 0,
      krexTier: tier,
      hasAnyNFT: !!(nftStatus?.hasKREXPRIME || nftStatus?.hasPIXELKREX || (nftStatus?.partnerCollections && Object.values(nftStatus.partnerCollections || {}).some(Boolean))),
      hasDiamondNFT: !!(nftStatus?.hasDiamondKREXPRIME || nftStatus?.hasDiamondPIXELKREX || (nftStatus?.partnerDiamonds && Object.values(nftStatus.partnerDiamonds || {}).some(Boolean))),
      hasRarestNFT: !!nftStatus?.hasRarestNFT,
      isNodeProvider: false,
      nodeFeeReduction: 0,
    });
  }, [genesisBadgeDApp, krexBalance, tier, nftStatus]);

  const valueWei = costBreakdown ? parseEther(String(costBreakdown.finalCostWithFee)) : 0n;

  const { data: badgeData, refetch: refetchBadge } = useReadContract({
    address: contractAddress && contractAddress.startsWith('0x') ? (contractAddress as `0x${string}`) : undefined,
    abi: GENESIS_BADGE_ABI,
    functionName: 'badges',
    args: address ? [address] : undefined,
    query: { enabled: !!contractAddress && !!address && isConnected },
  });

  const [exists, themeId, titleId, totalSpentWei, boostCount] = badgeData ?? [false, 0, 0, 0n, 0];
  const hasBadge = !!exists;
  const themeName = typeof themeId === 'number' && themeId >= 0 && themeId < THEME_NAMES.length ? THEME_NAMES[themeId] : `Theme ${themeId}`;
  const titleName = typeof titleId === 'number' && titleId >= 0 && titleId < TITLE_NAMES.length ? TITLE_NAMES[titleId] : `Title ${titleId}`;
  const totalSpentFormatted = totalSpentWei ? formatEther(totalSpentWei) : '0';

  const { writeContract, data: hash, isPending: isPendingWrite, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: txError } = useWaitForTransactionReceipt({ hash });

  const isLoading = (isPendingWrite && !isConfirmed) || (isConfirming && !isConfirmed);
  const safeWriteError = useSafeError(writeError);
  const safeTxError = useSafeError(txError);
  const displayError = error || safeWriteError || safeTxError;

  const rewardsBreakdown = getDefaultRewardsBreakdown(chainId ?? undefined);
  // Payment Breakdown uses total KREX tier (L1 + L2) so it adds up with connected wallets
  const tierConfig = KREX_TIERS[tier];
  const multiplier = tierConfig?.multiplier ?? 1;
  const baseCost = 10;
  const gridReward = Math.round(baseCost * rewardsBreakdown.gridPerKas * multiplier);
  const xpReward = Math.round(baseCost * rewardsBreakdown.xpPerKas * multiplier);
  // On-chain uses only tKREX on this network; show base amounts when L2 balance is 0
  const tierConfigOnChain = KREX_TIERS[tierForChain];
  const multiplierOnChain = tierConfigOnChain?.multiplier ?? 1;
  const gridRewardOnChain = Math.round(baseCost * rewardsBreakdown.gridPerKas * multiplierOnChain);
  const xpRewardOnChain = Math.round(baseCost * rewardsBreakdown.xpPerKas * multiplierOnChain);
  const onChainIsBaseOnly = multiplier > 1 && multiplierOnChain === 1 && krexL2Balance === 0;

  const handleUnlockOrBoost = async () => {
    setError(null);
    if (!isConnected) {
      setError('Please connect your wallet');
      return;
    }
    if (!contractAddress || !contractAddress.startsWith('0x') || contractAddress.length !== 42) {
      setError('Contract not deployed on this network');
      return;
    }
    if (!costBreakdown || valueWei < parseEther('10')) {
      setError('Minimum 10 iKAS required');
      return;
    }
    try {
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: GENESIS_BADGE_ABI,
        functionName: 'unlockOrBoost',
        args: [],
        value: valueWei,
      });
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Transaction failed');
      setError(msg);
      if (msg.includes('insufficient funds') || msg.includes('Insufficient')) {
        setError(`Insufficient balance. You need at least ${costBreakdown?.finalCostWithFee ?? 10} ${nativeSymbol} plus gas.`);
      } else if (msg.includes('rejected') || msg.includes('Rejected')) {
        setError('Transaction rejected');
      }
    }
  };

  const lastToastedErrorRef = useRef<string | null>(null);
  const { toast } = useToast();
  useEffect(() => {
    if (!displayError) {
      lastToastedErrorRef.current = null;
      setShowErrorModal(false);
      return;
    }
    const msg = String(displayError);
    if (lastToastedErrorRef.current === msg) return;
    lastToastedErrorRef.current = msg;
    toast({ variant: 'error', title: hasBadge ? 'Boost failed' : 'Unlock failed', description: msg });
    setErrorModalMessage(msg);
    setShowErrorModal(true);
  }, [displayError, toast, hasBadge]);

  useEffect(() => {
    if (!isConfirmed || !hash || !genesisBadgeDApp || !contractAddress || !address) return;
    toast({
      variant: 'success',
      title: hasBadge ? 'Badge boosted' : 'Badge unlocked',
      description: 'tGRID and XP will be applied shortly. Check your wallet and dashboard.',
    });
    setSuccessTxHash(hash);
    setShowSuccessModal(true);
    queryClient.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'readContract' });
    window.dispatchEvent(new CustomEvent('dapp-transaction-success'));
    refetchBadge?.();
    const baseActionValue = costBreakdown?.baseCost ?? 10;
    storeTransaction({
      txHash: hash,
      network: 'L2',
      dAppId: 'genesis-badge',
      actionType: 'unlock-or-boost',
      timestamp: Date.now(),
      amount: costBreakdown?.finalCostWithFee ?? baseActionValue,
      fee: costBreakdown?.feeAmount ?? 0,
      netAmount: costBreakdown?.finalCost ?? baseActionValue,
      baseCost: costBreakdown?.baseCost,
      costReduction: costBreakdown?.costReductionAmount,
      finalCost: costBreakdown?.finalCost,
      feePercentage: costBreakdown?.feePercent,
      userAddress: address,
      contractAddress,
      contractCallSuccess: true,
      status: 'confirmed',
    });
    setTimeout(() => {
      distributeRewardAfterTransaction({
        dapp: genesisBadgeDApp,
        actionId: 'unlock-or-boost',
        actionType: 'genesis-badge',
        baseActionValue,
        txHash: hash,
        dAppContractAddress: contractAddress as `0x${string}`,
      }).catch((err) => console.error('Reward distribution:', err));
    }, 500);
  }, [isConfirmed, hash, genesisBadgeDApp, contractAddress, address, costBreakdown, toast, refetchBadge, distributeRewardAfterTransaction]);

  if (!isConnected) {
    return (
      <div className="px-6 py-8 text-center">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Genesis Badge</h2>
        <p className="text-base text-zinc-600 dark:text-zinc-400">Connect your wallet to unlock or boost your genesis badge.</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-4 space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Genesis Badge</h2>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          {hasBadge ? 'Boost your badge and earn more tGRID and XP.' : 'Unlock a unique random badge. Earn tGRID and XP.'}
        </p>
        {hasBadge && (
          <div
            className="mt-6 mx-auto max-w-sm rounded-2xl overflow-hidden border-2 border-amber-400/50 dark:border-amber-500/40 shadow-xl"
            style={{
              background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 35%, #0f3460 70%, #1a1a2e 100%)',
              boxShadow: '0 0 40px rgba(251, 191, 36, 0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            <div className="relative px-8 py-10">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-cyan-500/10" />
              <div className="relative flex flex-col items-center gap-4">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(251,191,36,0.35) 0%, rgba(34,211,238,0.25) 100%)',
                    boxShadow: '0 0 30px rgba(251,191,36,0.2)',
                  }}
                >
                  <span aria-hidden>🏅</span>
                </div>
                <div>
                  <p className="text-xl font-black text-white tracking-tight drop-shadow-sm">
                    {themeName} · {titleName}
                  </p>
                  <p className="mt-1 text-sm text-amber-200/90 font-medium">
                    Total spent: {totalSpentFormatted} {nativeSymbol}
                  </p>
                  <p className="text-xs text-cyan-200/80 mt-0.5">
                    Boosts: {String(boostCount)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Breakdown */}
      <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-3 uppercase tracking-wide">Payment Breakdown</h3>
        <div className="space-y-2 text-base">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">You Pay</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100">
              {costBreakdown ? formatPrice(costBreakdown.finalCostWithFee) : '10'} {nativeSymbol}
            </span>
          </div>
          <div className="pt-2 mt-2 border-t border-zinc-200 dark:border-zinc-700">
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">You Receive</p>
            <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
              <span>{gridLabel}</span>
              <span className="font-medium text-[#02abb8]">{formatLargeNumber(gridReward)}</span>
            </div>
            <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
              <span>XP points</span>
              <span className="font-medium text-[#02abb8]">{formatLargeNumber(xpReward)}</span>
            </div>
            {multiplier > 1 && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                ×{multiplier} tier multiplier (from your total KREX across connected wallets)
              </p>
            )}
            {onChainIsBaseOnly && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                On-chain you&apos;ll receive the base amount ({formatLargeNumber(gridRewardOnChain)} {gridLabel}, {formatLargeNumber(xpRewardOnChain)} XP). Bridge tKREX to L2 to get the full ×{multiplier} reward.{' '}
                <a href="https://katbridge.com/" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:opacity-80">Open KAT Bridge ↗</a>
              </p>
            )}
            {hasBadge && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Badge progress: +1 boost, total spent increases</p>
            )}
          </div>
        </div>
      </div>

      {displayError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400">{displayError}</p>
        </div>
      )}

      {/* Collapsible Debug */}
      <div>
        <button
          type="button"
          onClick={() => setShowDebugInfo(!showDebugInfo)}
          className="w-full flex items-center justify-between p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          <span>Debug Info</span>
          <svg className={`w-4 h-4 transition-transform ${showDebugInfo ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showDebugInfo && (
          <div className="mt-2 p-3 bg-zinc-50 dark:bg-zinc-950 rounded-lg text-xs space-y-1 border border-zinc-200 dark:border-zinc-800">
            <p className="font-semibold">Contract: {contractAddress || '-'}</p>
            <p>Chain ID: {chainId} (38836 = Igra Testnet, 38833 = Igra Mainnet)</p>
            <p>User: {address ? `${address.slice(0, 8)}...` : '-'}</p>
            <p>Badge: exists={String(hasBadge)} themeId={String(themeId)} titleId={String(titleId)} totalSpentWei={totalSpentWei?.toString?.() ?? '-'} boostCount={String(boostCount)}</p>
            <p>valueWei: {valueWei.toString()}</p>
            {hash && <p>Tx: {hash.slice(0, 10)}...</p>}
            <p className="font-semibold mt-2">Button disabled: {!contractAddress ? 'No contract' : isLoading ? 'Tx in progress' : valueWei < parseEther('10') ? 'Below min' : '-'}</p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleUnlockOrBoost}
        disabled={isLoading || !contractAddress || valueWei < parseEther('10')}
        className="w-full py-3 px-4 text-lg font-bold text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        style={{ backgroundColor: '#02abb8' }}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {isPendingWrite ? 'Confirm in wallet...' : 'Processing...'}
          </span>
        ) : hasBadge ? (
          'Boost badge'
        ) : (
          'Unlock badge'
        )}
      </button>

      {contractAddress && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
          Contract: {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
        </p>
      )}

      {hash && isConfirmed && (
        <div className="mt-4 space-y-4">
          <TransactionTracker txHash={hash} compact />
          <RewardStatusBox txHash={hash} network="L2" dAppId="genesis-badge" actionType="unlock-or-boost" compact />
        </div>
      )}

      <TransactionSuccessModal
        isOpen={!!showSuccessModal && !!successTxHash}
        onClose={() => { setShowSuccessModal(false); setSuccessTxHash(null); }}
        txHash={successTxHash ?? ''}
        chainId={chainId ?? 38833}
        gridAmount={formatLargeNumber(onChainIsBaseOnly ? gridRewardOnChain : gridReward)}
        pointsEarned={onChainIsBaseOnly ? xpRewardOnChain : xpReward}
        autoCloseMs={8000}
      />
      <TransactionErrorModal
        isOpen={showErrorModal}
        onClose={() => { setShowErrorModal(false); setErrorModalMessage(''); }}
        message={errorModalMessage}
        title={hasBadge ? 'Boost failed' : 'Unlock failed'}
      />
    </div>
  );
}
