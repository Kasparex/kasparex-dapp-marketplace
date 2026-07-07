'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { GENESIS_BADGE_ABI } from '@/lib/contracts/abis';
import { getDAppContractAddress } from '@/lib/dapps/contractResolver';
import { placeholderDApps } from '@/lib/dapps';
import { getNativeCurrencySymbol } from '@/lib/wagmi';
import { calculateCost, type CostBreakdown } from '@/lib/payments/calculator';
import { useAutomatedRewards } from '@/hooks/useAutomatedRewards';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { getHubPointsBaseForAction } from '@/lib/payments/hubQuote';
import { computeEarnedHubPoints } from '@/lib/rewards/hub-points';
import { DApp } from '@/lib/dapps';
import { storeTransaction } from '@/lib/transactions/tracker';
import { TransactionTracker } from '@/components/transactions/TransactionTracker';
import { Alert } from '@/components/Alert';
import { KxAlertRegion } from '@/components/ui/KxAlertRegion';
import { DAppWidgetShell } from '@/components/dapps/DAppWidgetShell';
import { useRegisterDAppWidgetRailSlot } from '@/lib/dapps/DAppWidgetActionRailContext';
import { useSyncDAppWidgetQuote } from '@/lib/dapps/PaymentAmountContext';
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
  const [successHubPoints, setSuccessHubPoints] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTxHash, setSuccessTxHash] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const genesisBadgeDApp = dappProp ?? (typeof window !== 'undefined' ? getGenesisBadgeDApp(require('@/lib/dapps').placeholderDApps) : undefined);
  const contractAddress = genesisBadgeDApp ? getDAppContractAddress(genesisBadgeDApp, chainId) : '';

  const { balance: krexBalance, tier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const { distributeRewardAfterTransaction } = useAutomatedRewards();
  const queryClient = useQueryClient();
  const nativeSymbol = getNativeCurrencySymbol(chainId);

  const hubPointsPreview = genesisBadgeDApp
    ? computeEarnedHubPoints(getHubPointsBaseForAction(genesisBadgeDApp, 'unlock-or-boost'), tier)
    : 0;

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

  const lastErrorRef = useRef<string | null>(null);
  useEffect(() => {
    if (!displayError) {
      lastErrorRef.current = null;
      setShowErrorModal(false);
      return;
    }
    const msg = String(displayError);
    if (lastErrorRef.current === msg) return;
    lastErrorRef.current = msg;
    setErrorModalMessage(msg);
    setShowErrorModal(true);
  }, [displayError, hasBadge]);

  useEffect(() => {
    if (!isConfirmed || !hash || !genesisBadgeDApp || !contractAddress || !address) return;
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
      })
        .then((result) => {
          if (result.hubPointsEarned != null && result.hubPointsEarned > 0) {
            setSuccessHubPoints(result.hubPointsEarned);
          } else if (hubPointsPreview > 0) {
            setSuccessHubPoints(hubPointsPreview);
          }
        })
        .catch((err) => console.error('Hub Points award:', err));
    }, 500);
  }, [isConfirmed, hash, genesisBadgeDApp, contractAddress, address, costBreakdown, refetchBadge, distributeRewardAfterTransaction, hubPointsPreview]);

  useSyncDAppWidgetQuote(null, 'unlock-or-boost');

  const railActions = isConnected ? (
    <button
      type="button"
      onClick={handleUnlockOrBoost}
      disabled={isLoading || !contractAddress || valueWei < parseEther('10')}
      className="w-full k-control-btn !border-[#02abb8] !bg-[#02abb8] !text-white hover:!bg-[#028a94] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
  ) : null;

  useRegisterDAppWidgetRailSlot('actions', railActions, [isConnected, isLoading, contractAddress, valueWei, hasBadge, isPendingWrite]);

  if (!isConnected) {
    return (
      <DAppWidgetShell title="Interact" heading="Genesis Badge" description="Connect your wallet to unlock or boost your genesis badge.">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-700 dark:bg-zinc-950">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Connect your L2 wallet from the site header to continue.
          </p>
        </div>
      </DAppWidgetShell>
    );
  }

  return (
    <DAppWidgetShell
      title="Interact"
      heading="Genesis Badge"
      description={
        hasBadge
          ? 'Boost your badge and earn Hub Points on each action.'
          : 'Unlock a unique random badge and earn Hub Points.'
      }
    >
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
      <KxAlertRegion>
        {displayError ? (
          <Alert type="error" compact region onDismiss={() => setError(null)}>
            <p>{String(displayError)}</p>
          </Alert>
        ) : null}
      </KxAlertRegion>

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

      {contractAddress && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
          Contract: {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
        </p>
      )}

      {hash && isConfirmed && (
        <div className="mt-4 space-y-4">
          <TransactionTracker txHash={hash} compact />
        </div>
      )}

      <TransactionSuccessModal
        isOpen={!!showSuccessModal && !!successTxHash}
        onClose={() => { setShowSuccessModal(false); setSuccessTxHash(null); setSuccessHubPoints(null); }}
        txHash={successTxHash ?? ''}
        chainId={chainId ?? 38833}
        hubPointsEarned={successHubPoints ?? undefined}
        autoCloseMs={8000}
      />
      <TransactionErrorModal
        isOpen={showErrorModal}
        onClose={() => { setShowErrorModal(false); setErrorModalMessage(''); }}
        message={errorModalMessage}
        title={hasBadge ? 'Boost failed' : 'Unlock failed'}
      />
    </DAppWidgetShell>
  );
}
