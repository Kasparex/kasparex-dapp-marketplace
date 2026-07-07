'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useChainId } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { SIMPLE_PAYMENT_ABI as SIMPLE_PAYMENT_ABI_IMPORT, SUBSCRIPTION_MANAGER_ABI } from '@/lib/contracts/abis';
import { calculateFee, calculatePaymentAmount, parseKAS } from '@/lib/revenue/feeCalculator';
import { getContractAddress } from '@/lib/contracts/addresses';
import { getDAppContractAddress } from '@/lib/dapps/contractResolver';
import { getNativeCurrencySymbol } from '@/lib/wagmi';
// Temporarily disable subscriptions to fix errors
// import { SubscriptionStatus } from '@/components/subscriptions/SubscriptionStatus';
import { TreasuryAutoDistribute } from '@/components/TreasuryAutoDistribute';
import { getErrorMessage } from '@/lib/utils';
import { useSafeError } from '@/hooks/useSafeError';
import { useMemo, useRef } from 'react';
import { calculateCost, formatPrice, type CostBreakdown } from '@/lib/payments/calculator';
import { getDefaultRewardsBreakdown } from '@/lib/rewards/mockData';
import { KREX_TIERS } from '@/lib/rewards/types';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import { useAutomatedRewards } from '@/hooks/useAutomatedRewards';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { placeholderDApps } from '@/lib/dapps';
import { storeTransaction } from '@/lib/transactions/tracker';
import { TransactionTracker } from '@/components/transactions/TransactionTracker';
import { RewardStatusBox } from '@/components/rewards/RewardStatusBox';
import { Alert } from '@/components/Alert';
import { KxAlertRegion } from '@/components/ui/KxAlertRegion';
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';
import { DAppWidgetShell } from '@/components/dapps/DAppWidgetShell';
import { useRegisterDAppWidgetRailSlot } from '@/lib/dapps/DAppWidgetActionRailContext';
import { TransactionSuccessModal } from '@/components/modals/TransactionSuccessModal';
import { TransactionErrorModal } from '@/components/modals/TransactionErrorModal';
import { usePaymentAmount } from '@/lib/dapps/PaymentAmountContext';
import { useQueryClient } from '@tanstack/react-query';

// Define ABI in proper JSON format as fallback to prevent bundling issues
const SIMPLE_PAYMENT_ABI_FALLBACK = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_recipient",
        type: "address",
      },
    ],
    name: "sendPayment",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_feeCollector",
        type: "address",
      },
    ],
    name: "setFeeCollector",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_feePercentage",
        type: "uint256",
      },
    ],
    name: "setFeePercentage",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "calculateFee",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "getPaymentAmount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "feeCollector",
    outputs: [
      {
        internalType: "contract FeeCollector",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "feePercentage",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "fee",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "PaymentSent",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "FeeCollected",
    type: "event",
  },
] as const;

// Use imported ABI if available, otherwise use fallback
const SIMPLE_PAYMENT_ABI = SIMPLE_PAYMENT_ABI_IMPORT || SIMPLE_PAYMENT_ABI_FALLBACK;

/**
 * SimplePaymentWidget
 * 
 * A widget component for the Simple Payment dApp that allows users to send
 * KAS payments with automatic fee collection.
 */
export function SimplePaymentWidget() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTxHash, setSuccessTxHash] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');

  // Get Simple Payment dApp object
  const simplePaymentDApp = placeholderDApps.find(d => d.slug === 'simple-payment' || d.name.toLowerCase().includes('simple payment'));

  // Get user holdings for cost calculation (tier = total KREX; tierForChain = on-chain multiplier for L2)
  const { balance: krexBalance, l2Balance: krexL2Balance, tier, tierForChain } = useKREXBalance();
  const { nftStatus } = useNFTStatus();

  // Automated rewards hook
  const { distributeRewardAfterTransaction } = useAutomatedRewards();
  const { setPaymentAmount } = usePaymentAmount();
  const queryClient = useQueryClient();

  // Calculate payment cost with discounts (use entered amount as base so breakdown matches actual payment)
  const paymentCostBreakdown = useMemo((): CostBreakdown | null => {
    if (!simplePaymentDApp || !amount || parseFloat(amount) <= 0) {
      return null;
    }
    const amountNum = parseFloat(amount);
    return calculateCost({
      dapp: simplePaymentDApp,
      actionId: 'send-payment',
      krexBalance: krexBalance || 0,
      krexTier: tier,
      hasAnyNFT: !!(nftStatus?.hasKREXPRIME || nftStatus?.hasPIXELKREX ||
        (nftStatus?.partnerCollections && Object.values(nftStatus.partnerCollections || {}).some(v => v))),
      hasDiamondNFT: !!(nftStatus?.hasDiamondKREXPRIME || nftStatus?.hasDiamondPIXELKREX ||
        (nftStatus?.partnerDiamonds && Object.values(nftStatus.partnerDiamonds || {}).some(v => v))),
      hasRarestNFT: !!nftStatus?.hasRarestNFT,
      isNodeProvider: false, // TODO: Get from node status hook
      nodeFeeReduction: 0,
      overrideBaseCost: amountNum,
    });
  }, [simplePaymentDApp, amount, krexBalance, tier, nftStatus]);

  const contractAddress = simplePaymentDApp ? getDAppContractAddress(simplePaymentDApp, chainId) : '';
  const subscriptionManagerAddress = getContractAddress(chainId, 'SubscriptionManager') || '';

  // TEMPORARILY DISABLED: Subscription check to fix errors
  // Check subscription access (only if we have addresses)
  // const { data: hasAccess, isLoading: isLoadingAccess } = useReadContract({
  //   address: subscriptionManagerAddress as `0x${string}`,
  //   abi: SUBSCRIPTION_MANAGER_ABI,
  //   functionName: 'hasAccess',
  //   args: [address || '0x0', contractAddress || '0x0'],
  //   query: {
  //     enabled: isConnected && !!address && !!subscriptionManagerAddress && !!contractAddress && typeof subscriptionManagerAddress === 'string' && typeof contractAddress === 'string' && subscriptionManagerAddress.length > 0 && contractAddress.length > 0,
  //   },
  // });

  // For now, allow access if subscription check fails (graceful degradation)
  // This allows testing even if subscription contracts aren't fully set up
  const isLoadingAccess = false; // Temporarily disabled
  const userHasAccess = true; // Always allow access for now

  // Read fee percentage from contract
  const abiForRead = SIMPLE_PAYMENT_ABI || SIMPLE_PAYMENT_ABI_FALLBACK;
  const { data: feePercentage, isLoading: isLoadingFee } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: abiForRead,
    functionName: 'feePercentage',
    query: {
      enabled: !!contractAddress && isConnected && !!abiForRead,
    },
  });

  // Calculate fee and payment amount
  const feePercentageNum = feePercentage ? Number(feePercentage) : 100; // Default to 1%
  const amountBigInt = amount ? parseKAS(amount) : 0n;
  const feeAmount = amountBigInt > 0n ? calculateFee(amountBigInt, feePercentageNum) : 0n;
  const paymentAmount = amountBigInt > 0n ? calculatePaymentAmount(amountBigInt, feePercentageNum) : 0n;

  const nativeSymbol = getNativeCurrencySymbol(chainId);

  // Debug logging (after amountBigInt is declared)
  console.log('SimplePaymentWidget Debug:', {
    chainId,
    contractAddress,
    subscriptionManagerAddress,
    hasContractAddress: !!contractAddress,
    recipientAddress: !!recipientAddress,
    amount,
    amountBigInt: amountBigInt.toString(),
  });

  // Write contract for sending payment
  const {
    writeContract,
    data: hash,
    isPending: isPendingWrite,
    error: writeError
  } = useWriteContract();

  // Wait for transaction
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: txError
  } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSendPayment = async () => {
    setError(null);

    if (!isConnected) {
      setError('Please connect your wallet');
      return;
    }

    if (!recipientAddress) {
      setError('Please enter recipient address');
      return;
    }

    if (!amount || amountBigInt === 0n) {
      setError('Please enter a valid amount');
      return;
    }

    if (!contractAddress || contractAddress.length === 0) {
      setError('Contract not deployed on this network');
      return;
    }

    // Validate recipient address format
    if (!recipientAddress || recipientAddress.length === 0) {
      setError('Please enter a valid recipient address');
      return;
    }

    // Ensure addresses are valid hex strings
    if (!recipientAddress.startsWith('0x') || recipientAddress.length !== 42) {
      setError('Invalid recipient address format. Must be a valid Ethereum address (0x followed by 40 hex characters)');
      return;
    }

    if (!contractAddress.startsWith('0x') || contractAddress.length !== 42) {
      setError('Invalid contract address format');
      return;
    }

    try {
      // Validate addresses one more time
      const validContractAddress = contractAddress?.startsWith('0x') && contractAddress.length === 42
        ? contractAddress as `0x${string}`
        : null;
      const validRecipientAddress = recipientAddress?.startsWith('0x') && recipientAddress.length === 42
        ? recipientAddress as `0x${string}`
        : null;

      if (!validContractAddress || !validRecipientAddress) {
        setError('Invalid address format');
        return;
      }

      // Use ABI (fallback ensures it's always available)
      const abiToUse = SIMPLE_PAYMENT_ABI || SIMPLE_PAYMENT_ABI_FALLBACK;

      if (!abiToUse) {
        console.error('ABI is still not available');
        setError('Contract ABI not loaded. Please refresh the page.');
        return;
      }

      // writeContract doesn't return a value - it triggers the transaction
      // The transaction hash will be available via the useWriteContract hook's 'data' property
      await writeContract({
        address: validContractAddress,
        abi: abiToUse,
        functionName: 'sendPayment',
        args: [validRecipientAddress],
        value: amountBigInt,
      });
    } catch (err: any) {
      console.error('Write contract error:', err);
      const errorMessage = getErrorMessage(err, 'Failed to send payment');

      // Handle common errors with more helpful messages
      if (errorMessage.includes('length') || errorMessage.includes('undefined')) {
        setError('Address validation error. Please check the recipient address format.');
      } else if (errorMessage.includes('insufficient funds') || errorMessage.includes('Insufficient funds')) {
        setError(`Insufficient balance. Make sure you have enough ${nativeSymbol} for the payment and gas fees.`);
      } else if (errorMessage.includes('user rejected') || errorMessage.includes('User rejected')) {
        setError('Transaction rejected by user');
      } else if (errorMessage.includes('wallet') || errorMessage.includes('connection') || errorMessage.includes('provider')) {
        setError('Wallet connection issue. Please reconnect your wallet and try again. If using multiple wallet extensions, try disabling others.');
      } else if (errorMessage.includes('not submitted')) {
        setError(errorMessage);
      } else {
        setError(`Failed to send payment: ${errorMessage}`);
      }
    }
  };

  // Calculate loading state - only true when actively processing, not after confirmation
  const isLoading = (isPendingWrite && !isConfirmed) || (isConfirming && !isConfirmed);
  // Safely convert errors to strings immediately
  const safeWriteError = useSafeError(writeError);
  const safeTxError = useSafeError(txError);
  const displayError = error || safeWriteError || safeTxError;
  const amountNum = parseFloat(amount || '0');
  const gridLabel = chainId === 167012 || chainId === 38836 ? 'tGRID' : 'GRID';

  const rewardsExtraBreakdown =
    amount && amountBigInt > 0n && paymentCostBreakdown ? (
      <div className="space-y-1.5 border-t border-zinc-200 pt-3 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
        <div className="flex justify-between gap-2">
          <span>Recipient receives</span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
            {formatPrice(paymentCostBreakdown.breakdown.subtotal)} {nativeSymbol}
          </span>
        </div>
        {amountNum > 0
          ? (() => {
              const rewards = getDefaultRewardsBreakdown(chainId ?? undefined);
              const tierConfig = KREX_TIERS[tier];
              const mult = tierConfig?.multiplier ?? 1;
              const tierConfigOnChain = KREX_TIERS[tierForChain];
              const multOnChain = tierConfigOnChain?.multiplier ?? 1;
              const gridReward = Math.round(amountNum * rewards.gridPerKas * mult);
              const xpReward = Math.round(amountNum * rewards.xpPerKas * mult);
              const gridRewardOnChain = Math.round(amountNum * rewards.gridPerKas * multOnChain);
              const xpRewardOnChain = Math.round(amountNum * rewards.xpPerKas * multOnChain);
              const onChainIsBaseOnly = mult > 1 && multOnChain === 1 && (krexL2Balance ?? 0) === 0;
              return (
                <>
                  <div className="flex justify-between gap-2 font-semibold text-zinc-900 dark:text-zinc-100">
                    <span>You receive ({gridLabel})</span>
                    <span className="text-[#02abb8] tabular-nums">{formatLargeNumber(gridReward)}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span>Hub pts</span>
                    <span className="font-semibold text-[#02abb8] tabular-nums">{formatLargeNumber(xpReward)}</span>
                  </div>
                  {mult > 1 ? (
                    <p className="text-zinc-500 dark:text-zinc-400">×{mult} tier from total KREX</p>
                  ) : null}
                  {onChainIsBaseOnly ? (
                    <p className="text-amber-600 dark:text-amber-400">
                      On-chain you&apos;ll receive the base amount ({formatLargeNumber(gridRewardOnChain)} {gridLabel},{' '}
                      {formatLargeNumber(xpRewardOnChain)} pts). Bridge tKREX to L2 for the full ×{mult} reward.{' '}
                      <a
                        href="https://katbridge.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium underline hover:opacity-80"
                      >
                        KAT Bridge ↗
                      </a>
                    </p>
                  ) : null}
                </>
              );
            })()
          : null}
      </div>
    ) : null;

  const railActions = isConnected ? (
    <button
      type="button"
      onClick={handleSendPayment}
      disabled={isLoading || !recipientAddress || !amount || amountBigInt === 0n || !contractAddress}
      className="w-full k-control-btn !border-[#02abb8] !bg-[#02abb8] !text-white hover:!bg-[#028a94] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {isPendingWrite ? 'Confirming...' : 'Processing...'}
        </span>
      ) : (
        'Send payment'
      )}
    </button>
  ) : null;

  const railAlerts =
    displayError || (isConfirmed && hash) ? (
      <KxAlertRegion>
        {displayError ? (
          <Alert type="error" compact region onDismiss={() => setError(null)}>
            <p>{String(displayError)}</p>
          </Alert>
        ) : null}
        {isConfirmed && hash ? (
          <Alert type="success" compact region>
            <p>Payment sent. Transaction hash: {hash.slice(0, 10)}...</p>
          </Alert>
        ) : null}
      </KxAlertRegion>
    ) : null;

  useRegisterDAppWidgetRailSlot('extraBreakdown', rewardsExtraBreakdown, [
    amount,
    amountBigInt,
    paymentCostBreakdown,
    nativeSymbol,
    amountNum,
    chainId,
    tier,
    tierForChain,
    krexL2Balance,
    gridLabel,
  ]);
  useRegisterDAppWidgetRailSlot('actions', railActions, [
    isConnected,
    isLoading,
    recipientAddress,
    amount,
    amountBigInt,
    contractAddress,
    isPendingWrite,
  ]);
  useRegisterDAppWidgetRailSlot('alerts', railAlerts, [displayError, isConfirmed, hash]);

  // Distribute rewards and reset form on success
  useEffect(() => {
    if (isConfirmed && !isConfirming && hash && simplePaymentDApp && contractAddress && address) {
      setSuccessTxHash(hash);
      setShowSuccessModal(true);
      // Force refetch of all contract reads (tGRID balance, pts balance, etc.) so dashboard updates
      queryClient.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'readContract' });
      window.dispatchEvent(new CustomEvent('dapp-transaction-success'));
      setTimeout(() => {
        queryClient.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'readContract' });
        window.dispatchEvent(new CustomEvent('dapp-transaction-success'));
      }, 4000);
      // Store transaction info before resetting
      const storedAmount = amount;
      const storedRecipient = recipientAddress;
      const baseActionValue = paymentCostBreakdown?.baseCost || parseFloat(storedAmount || '1.0');

      // Store transaction in tracker
      storeTransaction({
        txHash: hash,
        network: 'L2',
        dAppId: 'simple-payment',
        actionType: 'send-payment',
        timestamp: Date.now(),
        amount: paymentCostBreakdown?.finalCostWithFee || baseActionValue,
        fee: paymentCostBreakdown?.feeAmount || 0,
        netAmount: paymentCostBreakdown?.finalCost || baseActionValue,
        baseCost: paymentCostBreakdown?.baseCost,
        costReduction: paymentCostBreakdown?.costReductionAmount,
        finalCost: paymentCostBreakdown?.finalCost,
        feePercentage: paymentCostBreakdown?.feePercent,
        userAddress: address,
        recipientAddress: storedRecipient || undefined,
        contractAddress: contractAddress as string,
        contractCallSuccess: true,
        status: 'confirmed',
      });

      // Reset form immediately (use setTimeout to ensure state updates don't block)
      setTimeout(() => {
        setRecipientAddress('');
        setAmount('');
        setError(null);
        setPaymentAmount(null);
      }, 0);

      // Distribute rewards after successful transaction (non-blocking)
      setTimeout(() => {
        distributeRewardAfterTransaction({
          dapp: simplePaymentDApp,
          actionId: 'send-payment',
          actionType: 'send-payment',
          baseActionValue,
          txHash: hash,
          dAppContractAddress: contractAddress as `0x${string}`,
        }).catch((err) => {
          console.error('Error distributing reward:', err);
          // Don't show error to user - reward distribution failure shouldn't block the UI
        });
      }, 500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- setPaymentAmount is stable from context
  }, [isConfirmed, isConfirming, hash, simplePaymentDApp, contractAddress, distributeRewardAfterTransaction, paymentCostBreakdown, amount, recipientAddress, address]);

  // Reset form on success (legacy - kept for compatibility)
  if (isConfirmed && !isLoading && !hash) {
    setTimeout(() => {
      setRecipientAddress('');
      setAmount('');
    }, 2000);
  }

  return (
    <>
      <DAppWidgetShell
        title="Interact"
        heading="Simple Payment"
        description="Send native tokens to any address. Platform fee, KREX tier discounts, and rewards are calculated in the action panel."
      >
        {!isConnected ? (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-700 dark:bg-zinc-950">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Connect your wallet to send a payment through this dApp.
            </p>
          </div>
        ) : (
          <>
            <div className="k-form-group !mb-0">
              <KxFormFieldLabel tooltip="EVM address that will receive the payment.">
                Recipient address
              </KxFormFieldLabel>
              <input
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="0x..."
                className="k-input text-base"
                disabled={isLoading}
              />
            </div>

            <div className="k-form-group !mb-0">
              <KxFormFieldLabel tooltip="Amount before platform fee. Discounts update live in the calculation breakdown.">
                Amount ({nativeSymbol})
              </KxFormFieldLabel>
              <input
                type="text"
                value={amount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setAmount(value);
                    const num = parseFloat(value);
                    setPaymentAmount(value && !isNaN(num) && num > 0 ? num : null);
                  }
                }}
                placeholder="0.0"
                className="k-input text-base"
                disabled={isLoading}
              />
            </div>

            {contractAddress ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Contract: {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
              </p>
            ) : null}

            {hash && isConfirmed ? (
              <div className="space-y-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <TransactionTracker txHash={hash} compact />
                <RewardStatusBox
                  txHash={hash}
                  network="L2"
                  dAppId="simple-payment"
                  actionType="send-payment"
                  compact
                />
              </div>
            ) : null}

            <details className="rounded-xl border border-zinc-200 dark:border-zinc-800">
              <summary className="cursor-pointer px-4 py-3 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                Developer debug
              </summary>
              <div className="space-y-1 border-t border-zinc-200 px-4 py-3 text-xs text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
                <p>Chain ID: {chainId}</p>
                <p>Contract: {contractAddress || 'not deployed on this network'}</p>
                <p>Recipient set: {recipientAddress ? 'yes' : 'no'}</p>
                <p>Amount valid: {amountBigInt > 0n ? 'yes' : 'no'}</p>
              </div>
            </details>
          </>
        )}
      </DAppWidgetShell>

      <TransactionSuccessModal
        isOpen={showSuccessModal && !!successTxHash}
        onClose={() => { setShowSuccessModal(false); setSuccessTxHash(null); }}
        txHash={successTxHash ?? ''}
        chainId={chainId ?? 38833}
        autoCloseMs={8000}
      />
      <TransactionErrorModal
        isOpen={showErrorModal}
        onClose={() => { setShowErrorModal(false); setErrorModalMessage(''); }}
        message={errorModalMessage}
        title="Payment failed"
      />
    </>
  );
}

