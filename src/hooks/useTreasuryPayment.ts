'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, type Address } from 'viem';
import { TREASURY_ABI } from '@/lib/contracts/abis';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { getErrorMessage } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';

/**
 * Hardcoded Treasury addresses as fallback
 * These are the deployed contract addresses from TREASURY_EXPLANATION.md
 */
const HARDCODED_TREASURY_ADDRESSES = {
  [167012]: '0x658420fd88dbd610249a88384f9b1ad387f797c7', // Kasplex L2 Testnet
  [202555]: '0xDC88585B22f11f4d2b7bbbf0e134E606629C1C40', // Kasplex L2 Mainnet
} as const;

/**
 * Get Treasury address for the current chain
 */
export function getTreasuryAddress(chainId: number): string {
  // Try CONTRACT_ADDRESSES first
  if (CONTRACT_ADDRESSES) {
    if (chainId === 202555) {
      const address = CONTRACT_ADDRESSES.kasplexL2Mainnet?.Treasury;
      if (address && address.trim() !== '') {
        return address;
      }
    }
    if (chainId === 167012) {
      const address = CONTRACT_ADDRESSES.kasplexL2Testnet?.Treasury;
      if (address && address.trim() !== '') {
        return address;
      }
    }
  }

  // Fallback to hardcoded addresses
  return HARDCODED_TREASURY_ADDRESSES[chainId as keyof typeof HARDCODED_TREASURY_ADDRESSES] || '';
}

export interface UseTreasuryPaymentOptions {
  /**
   * Amount in KAS (will be converted to wei)
   */
  amount: string;
  /**
   * Optional callback when payment succeeds
   */
  onSuccess?: (txHash: string) => void;
  /**
   * Optional callback when payment fails
   */
  onError?: (error: Error) => void;
  /**
   * When true (default), show success/error toasts. Set to false if caller handles feedback (e.g. modals).
   */
  showToast?: boolean;
}

export interface UseTreasuryPaymentReturn {
  /**
   * Execute the payment
   */
  pay: () => Promise<void>;
  /**
   * Whether payment is in progress
   */
  isPaying: boolean;
  /**
   * Whether payment is confirming
   */
  isConfirming: boolean;
  /**
   * Whether payment succeeded
   */
  isSuccess: boolean;
  /**
   * Transaction hash (if payment succeeded)
   */
  txHash: string | undefined;
  /**
   * Error message (if payment failed)
   */
  error: string | null;
  /**
   * Treasury address for current chain
   */
  treasuryAddress: string;
  /**
   * Whether Treasury address is available
   */
  isTreasuryAvailable: boolean;
}

/**
 * Hook for making payments to Treasury contract
 * 
 * This hook provides a reusable way to collect fees across the application.
 * It handles:
 * - Getting the correct Treasury address for the current chain
 * - Converting KAS amounts to wei
 * - Executing the payment transaction
 * - Tracking transaction status
 * 
 * @example
 * ```tsx
 * const { pay, isPaying, isSuccess, treasuryAddress } = useTreasuryPayment({
 *   amount: '10',
 *   onSuccess: (txHash) => {
 *     console.log('Payment successful:', txHash);
 *   },
 * });
 * 
 * <button onClick={pay} disabled={isPaying || !treasuryAddress}>
 *   Pay 10 KAS
 * </button>
 * ```
 */
export function useTreasuryPayment({
  amount,
  onSuccess,
  onError,
  showToast = true,
}: UseTreasuryPaymentOptions): UseTreasuryPaymentReturn {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const successCalledRef = useRef(false);
  const errorCalledRef = useRef<string | null>(null);

  // Get Treasury address for current chain
  const treasuryAddress = chainId ? getTreasuryAddress(chainId) : '';
  const isTreasuryAvailable = treasuryAddress !== '' && treasuryAddress !== undefined && treasuryAddress !== null;

  // Write contract for fee payment
  // CRITICAL: Convert errors to strings IMMEDIATELY using useMemo to prevent React serialization issues
  const { writeContract, data: txHash, isPending: isPaying, error: rawWriteError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: rawTxError } = useWaitForTransactionReceipt({
    hash: txHash,
  });
  
  // Convert errors to strings immediately to prevent 'in' operator errors
  // This must happen before errors are used anywhere in React
  // CRITICAL: Errors from wagmi can be function-type objects that React can't serialize
  const writeError = useMemo(() => {
    if (!rawWriteError) return null;
    try {
      // Immediately convert to string - never let React see the raw error
      const errorMsg = getErrorMessage(rawWriteError, 'Transaction failed');
      // Double-check it's actually a string
      if (typeof errorMsg !== 'string') {
        return 'Transaction failed';
      }
      return errorMsg;
    } catch (err) {
      // Even getErrorMessage can fail in edge cases - return safe fallback
      console.error('Error converting writeError:', err);
      return 'Transaction failed';
    }
  }, [rawWriteError]);
  
  const txError = useMemo(() => {
    if (!rawTxError) return null;
    try {
      // Immediately convert to string - never let React see the raw error
      const errorMsg = getErrorMessage(rawTxError, 'Transaction confirmation failed');
      // Double-check it's actually a string
      if (typeof errorMsg !== 'string') {
        return 'Transaction confirmation failed';
      }
      return errorMsg;
    } catch (err) {
      // Even getErrorMessage can fail in edge cases - return safe fallback
      console.error('Error converting txError:', err);
      return 'Transaction confirmation failed';
    }
  }, [rawTxError]);

  // Reset refs when txHash changes (new transaction)
  useEffect(() => {
    if (txHash) {
      successCalledRef.current = false;
      errorCalledRef.current = null;
    }
  }, [txHash]);

  // Handle success callback and optional toast
  useEffect(() => {
    if (isSuccess && txHash && !successCalledRef.current) {
      successCalledRef.current = true;
      onSuccess?.(txHash);
      if (showToast) {
        toast({ variant: 'success', title: 'Payment sent', description: `Tx: ${txHash.slice(0, 10)}...` });
      }
    }
  }, [isSuccess, txHash, onSuccess, showToast, toast]);

  // Handle error callback and optional toast
  // writeError and txError are already strings from useMemo above
  const currentError = error || writeError || txError || null;
  useEffect(() => {
    if (currentError && errorCalledRef.current !== currentError) {
      errorCalledRef.current = currentError;
      onError?.(new Error(currentError));
      if (showToast) {
        toast({ variant: 'error', title: 'Payment failed', description: currentError });
      }
    }
  }, [currentError, onError, showToast, toast]);

  const pay = async () => {
    if (!isConnected || !address) {
      const err = 'Please connect your wallet';
      setError(err);
      if (onError) {
        onError(new Error(err));
      }
      return;
    }

    if (!isTreasuryAvailable) {
      const err = 'Treasury address not available for this network';
      setError(err);
      if (onError) {
        onError(new Error(err));
      }
      return;
    }

    setError(null);

    try {
      // Validate amount
      if (!amount || typeof amount !== 'string' || amount.trim() === '') {
        const err = 'Invalid amount';
        setError(err);
        if (onError) {
          onError(new Error(err));
        }
        return;
      }

      // Validate treasury address exists and is a string
      if (!treasuryAddress || typeof treasuryAddress !== 'string') {
        const err = 'Treasury address is invalid';
        setError(err);
        if (onError) {
          onError(new Error(err));
        }
        return;
      }

      // Validate treasury address is not empty
      const trimmedAddress = treasuryAddress.trim();
      if (trimmedAddress === '') {
        const err = 'Treasury address is empty';
        setError(err);
        if (onError) {
          onError(new Error(err));
        }
        return;
      }

      // Validate address format
      if (!trimmedAddress.startsWith('0x') || trimmedAddress.length !== 42) {
        const err = 'Treasury address format is invalid';
        setError(err);
        if (onError) {
          onError(new Error(err));
        }
        return;
      }

      // Parse amount to wei
      let amountInWei: bigint;
      try {
        amountInWei = parseEther(amount.trim());
      } catch (parseErr: any) {
        const err = `Invalid amount format: ${parseErr?.message || 'Cannot parse amount'}`;
        setError(err);
        if (onError) {
          onError(new Error(err));
        }
        return;
      }
      
      // Wrap writeContract in a promise to catch errors immediately
      // Note: writeContract doesn't throw synchronously, but we wrap it to handle any edge cases
      await new Promise<void>((resolve, reject) => {
        try {
          writeContract({
            address: trimmedAddress as Address,
            abi: TREASURY_ABI,
            functionName: 'collectFee',
            args: [],
            value: amountInWei,
          });
          // If writeContract doesn't throw synchronously, resolve after a short delay
          // This allows the wallet modal to open
          setTimeout(() => resolve(), 100);
        } catch (err) {
          // Convert error to string immediately to prevent 'in' operator issues
          const errorMsg = getErrorMessage(err, 'Failed to pay fee');
          console.error('Error in writeContract:', errorMsg);
          reject(new Error(errorMsg));
        }
      });
    } catch (err: any) {
      // Ensure error is always a string
      const errorMessage = getErrorMessage(err, 'Failed to pay fee');
      console.error('Error paying fee:', errorMessage);
      setError(errorMessage);
      if (onError) {
        onError(new Error(errorMessage));
      }
    }
  };

  // Return error as string to prevent 'in' operator issues
  return {
    pay,
    isPaying,
    isConfirming,
    isSuccess,
    txHash,
    error: currentError, // currentError is already a string from getErrorMessage
    treasuryAddress,
    isTreasuryAvailable,
  };
}

