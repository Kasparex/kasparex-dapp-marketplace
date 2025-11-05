'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useChainId } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { SIMPLE_PAYMENT_ABI, SUBSCRIPTION_MANAGER_ABI } from '@/lib/contracts/abis';
import { calculateFee, calculatePaymentAmount, formatKAS, parseKAS } from '@/lib/revenue/feeCalculator';
import { CONTRACT_ADDRESSES, getContractAddress } from '@/lib/contracts/addresses';
import { SubscriptionStatus } from '@/components/subscriptions/SubscriptionStatus';

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

  // Get contract addresses for current chain
  // Fallback to direct access if getContractAddress is not available
  let contractAddress = '';
  let subscriptionManagerAddress = '';
  
  try {
    // Ensure CONTRACT_ADDRESSES exists
    if (CONTRACT_ADDRESSES && typeof getContractAddress === 'function') {
      contractAddress = getContractAddress(chainId, 'SimplePayment') || '';
      subscriptionManagerAddress = getContractAddress(chainId, 'SubscriptionManager') || '';
    }
  } catch (e) {
    console.warn('getContractAddress not available, using fallback', e);
  }
  
  // Fallback to direct CONTRACT_ADDRESSES access
  try {
    if (!contractAddress && CONTRACT_ADDRESSES) {
      if (chainId === 202555 && CONTRACT_ADDRESSES.kasplexL2Mainnet) {
        contractAddress = CONTRACT_ADDRESSES.kasplexL2Mainnet.SimplePayment || '';
      } else if (chainId === 167012 && CONTRACT_ADDRESSES.kasplexL2Testnet) {
        contractAddress = CONTRACT_ADDRESSES.kasplexL2Testnet.SimplePayment || '';
      }
    }
    
    if (!subscriptionManagerAddress && CONTRACT_ADDRESSES) {
      if (chainId === 202555 && CONTRACT_ADDRESSES.kasplexL2Mainnet) {
        subscriptionManagerAddress = CONTRACT_ADDRESSES.kasplexL2Mainnet.SubscriptionManager || '';
      } else if (chainId === 167012 && CONTRACT_ADDRESSES.kasplexL2Testnet) {
        subscriptionManagerAddress = CONTRACT_ADDRESSES.kasplexL2Testnet.SubscriptionManager || '';
      }
    }
  } catch (e) {
    console.error('Error accessing CONTRACT_ADDRESSES', e);
  }

  // Check subscription access
  const { data: hasAccess, isLoading: isLoadingAccess } = useReadContract({
    address: subscriptionManagerAddress as `0x${string}`,
    abi: SUBSCRIPTION_MANAGER_ABI,
    functionName: 'hasAccess',
    args: [address || '0x0', contractAddress || '0x0'],
    query: {
      enabled: isConnected && !!address && !!subscriptionManagerAddress && !!contractAddress,
    },
  });

  // Read fee percentage from contract
  const { data: feePercentage, isLoading: isLoadingFee } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: SIMPLE_PAYMENT_ABI,
    functionName: 'feePercentage',
    query: {
      enabled: !!contractAddress && isConnected,
    },
  });

  // Calculate fee and payment amount
  const feePercentageNum = feePercentage ? Number(feePercentage) : 100; // Default to 1%
  const amountBigInt = amount ? parseKAS(amount) : 0n;
  const feeAmount = amountBigInt > 0n ? calculateFee(amountBigInt, feePercentageNum) : 0n;
  const paymentAmount = amountBigInt > 0n ? calculatePaymentAmount(amountBigInt, feePercentageNum) : 0n;

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

    if (!contractAddress) {
      setError('Contract not deployed on this network');
      return;
    }

    try {
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: SIMPLE_PAYMENT_ABI,
        functionName: 'sendPayment',
        args: [recipientAddress as `0x${string}`],
        value: amountBigInt,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send payment');
    }
  };

  const isLoading = isPendingWrite || isConfirming;
  const displayError = error || writeError?.message || txError?.message;

  // Reset form on success
  if (isConfirmed && !isLoading) {
    setTimeout(() => {
      setRecipientAddress('');
      setAmount('');
    }, 2000);
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Simple Payment
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Send KAS payments with automatic fee collection
        </p>
      </div>

      {!isConnected ? (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please connect your wallet to use this dApp
          </p>
        </div>
      ) : isLoadingAccess ? (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Checking subscription status...
          </p>
        </div>
      ) : hasAccess === false ? (
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-yellow-800 dark:text-yellow-400 font-semibold mb-2">
              Subscription Required
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              This dApp requires an active subscription. Please subscribe to access this feature.
            </p>
          </div>
          <SubscriptionStatus dAppContract={contractAddress} />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Recipient Address Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Recipient Address
            </label>
            <input
              type="text"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount (KAS)
            </label>
            <input
              type="text"
              value={amount}
              onChange={(e) => {
                const value = e.target.value;
                // Allow only numbers and decimal point
                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                  setAmount(value);
                }
              }}
              placeholder="0.0"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          {/* Fee Breakdown */}
          {amount && amountBigInt > 0n && (
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Payment Breakdown
              </h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatKAS(amountBigInt)} KAS
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Fee ({feePercentageNum / 100}%):</span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    -{formatKAS(feeAmount)} KAS
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="font-semibold text-gray-900 dark:text-white">Recipient Receives:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {formatKAS(paymentAmount)} KAS
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {displayError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{displayError}</p>
            </div>
          )}

          {/* Success Message */}
          {isConfirmed && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">
                Payment sent successfully! Transaction hash: {hash?.slice(0, 10)}...
              </p>
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={handleSendPayment}
            disabled={isLoading || !recipientAddress || !amount || amountBigInt === 0n || !contractAddress}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isPendingWrite ? 'Confirming...' : 'Processing...'}
              </span>
            ) : (
              'Send Payment'
            )}
          </button>

          {/* Contract Info */}
          {contractAddress && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Contract: {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

