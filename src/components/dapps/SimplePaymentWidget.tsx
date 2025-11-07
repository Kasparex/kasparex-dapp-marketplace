'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useChainId } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { SIMPLE_PAYMENT_ABI as SIMPLE_PAYMENT_ABI_IMPORT, SUBSCRIPTION_MANAGER_ABI } from '@/lib/contracts/abis';
import { calculateFee, calculatePaymentAmount, formatKAS, parseKAS } from '@/lib/revenue/feeCalculator';
import { CONTRACT_ADDRESSES, getContractAddress } from '@/lib/contracts/addresses';
import { SubscriptionStatus } from '@/components/subscriptions/SubscriptionStatus';
import { TreasuryAutoDistribute } from '@/components/TreasuryAutoDistribute';
import { getErrorMessage } from '@/lib/utils';

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
  const [showDebugInfo, setShowDebugInfo] = useState(false);

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

  // Hardcode testnet address as fallback if env var is missing
  // This is a temporary workaround for testing
  if (!contractAddress && chainId === 167012) {
    contractAddress = '0x3F19cC54231fB10b1935FA3f04Bec64b8AFeAd85'; // Testnet SimplePayment address
    console.warn('Using hardcoded testnet contract address');
  }

  if (!subscriptionManagerAddress && chainId === 167012) {
    subscriptionManagerAddress = '0x0F405c342e9596621430C5f888D673d40111a0ac'; // Testnet SubscriptionManager address
  }

  // Check subscription access (only if we have addresses)
  const { data: hasAccess, isLoading: isLoadingAccess } = useReadContract({
    address: subscriptionManagerAddress as `0x${string}`,
    abi: SUBSCRIPTION_MANAGER_ABI,
    functionName: 'hasAccess',
    args: [address || '0x0', contractAddress || '0x0'],
    query: {
      enabled: isConnected && !!address && !!subscriptionManagerAddress && !!contractAddress && typeof subscriptionManagerAddress === 'string' && typeof contractAddress === 'string' && subscriptionManagerAddress.length > 0 && contractAddress.length > 0,
    },
  });

  // For now, allow access if subscription check fails (graceful degradation)
  // This allows testing even if subscription contracts aren't fully set up
  const userHasAccess = hasAccess === true || hasAccess === undefined;

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

      await writeContract({
        address: validContractAddress,
        abi: abiToUse,
        functionName: 'sendPayment',
        args: [validRecipientAddress],
        value: amountBigInt,
      });
    } catch (err) {
      console.error('Write contract error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send payment';
      // Handle common errors
      if (errorMessage.includes('length') || errorMessage.includes('undefined')) {
        setError('Address validation error. Please check the recipient address format.');
      } else if (errorMessage.includes('insufficient funds')) {
        setError('Insufficient balance. Make sure you have enough KAS for the payment and gas fees.');
      } else if (errorMessage.includes('user rejected')) {
        setError('Transaction rejected by user');
      } else {
        setError(errorMessage);
      }
    }
  };

  const isLoading = isPendingWrite || isConfirming;
  const displayError = error || getErrorMessage(writeError) || getErrorMessage(txError);

  // Reset form on success
  if (isConfirmed && !isLoading) {
    setTimeout(() => {
      setRecipientAddress('');
      setAmount('');
    }, 2000);
  }

  return (
    <div className="px-6 py-4 space-y-4">

      {!isConnected ? (
        <div className="text-center py-8">
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Please connect your wallet to use this dApp
          </p>
        </div>
      ) : isLoadingAccess ? (
        <div className="text-center py-8">
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Checking subscription status...
          </p>
        </div>
      ) : hasAccess === false && subscriptionManagerAddress ? (
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
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Recipient Address
            </label>
            <input
              type="text"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
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
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          {/* Fee Breakdown */}
          {amount && amountBigInt > 0n && (
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Payment Breakdown
              </h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Total Amount:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {formatKAS(amountBigInt)} KAS
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Fee ({feePercentageNum / 100}%):</span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    -{formatKAS(feeAmount)} KAS
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">Recipient Receives:</span>
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
              <p className="text-sm text-red-700 dark:text-red-400">{displayError}</p>
            </div>
          )}

          {/* Success Message */}
          {isConfirmed && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-400">
                Payment sent successfully! Transaction hash: {hash?.slice(0, 10)}...
              </p>
            </div>
          )}

          {/* Debug Info - Collapsible */}
          <div className="mb-4">
            <button
              onClick={() => setShowDebugInfo(!showDebugInfo)}
              className="w-full flex items-center justify-between p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <span>Debug Info</span>
              <svg
                className={`w-4 h-4 transition-transform ${showDebugInfo ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showDebugInfo && (
              <div className="mt-2 p-3 bg-zinc-50 dark:bg-zinc-950 rounded-lg text-xs space-y-1 border border-zinc-200 dark:border-zinc-800">
                <p className="font-semibold">Debug Info:</p>
                <p>Contract Address: {contractAddress || '❌ EMPTY - This is why button is disabled!'}</p>
                <p>Chain ID: {chainId} (Expected: 167012 for Testnet)</p>
                <p>Recipient: {recipientAddress ? '✅ SET' : '❌ EMPTY'}</p>
                <p>Amount: {amount || '❌ EMPTY'}</p>
                <p>Amount (BigInt): {amountBigInt.toString()}</p>
                <p>Has Access: {hasAccess === undefined ? 'Checking...' : String(hasAccess)}</p>
                <p className="font-semibold mt-2">Button Disabled Because:</p>
                <ul className="list-disc list-inside ml-2">
                  {isLoading && <li>Transaction in progress</li>}
                  {!recipientAddress && <li>No recipient address</li>}
                  {!amount && <li>No amount entered</li>}
                  {amountBigInt === 0n && <li>Amount parsing failed (amountBigInt = 0)</li>}
                  {!contractAddress && <li className="text-red-600 dark:text-red-400 font-bold">❌ NO CONTRACT ADDRESS - Check environment variables!</li>}
                </ul>
              </div>
            )}
          </div>

          {/* Send Button */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSendPayment}
              disabled={isLoading || !recipientAddress || !amount || amountBigInt === 0n || !contractAddress}
              className="flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              style={{ backgroundColor: '#0097b2' }}
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
              'Send'
            )}
          </button>
          </div>

          {/* Contract Info */}
          {contractAddress && (
            <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Contract: {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

