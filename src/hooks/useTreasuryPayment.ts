'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, type Address } from 'viem';
import { TREASURY_ABI } from '@/lib/contracts/abis';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { getErrorMessage } from '@/lib/utils';

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
}: UseTreasuryPaymentOptions): UseTreasuryPaymentReturn {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [error, setError] = useState<string | null>(null);
  const successCalledRef = useRef(false);
  const errorCalledRef = useRef<string | null>(null);

  // Get Treasury address for current chain
  const treasuryAddress = chainId ? getTreasuryAddress(chainId) : '';
  const isTreasuryAvailable = treasuryAddress !== '' && treasuryAddress !== undefined && treasuryAddress !== null;

  // Write contract for fee payment
  const { writeContract, data: txHash, isPending: isPaying, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: txError } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Reset refs when txHash changes (new transaction)
  useEffect(() => {
    if (txHash) {
      successCalledRef.current = false;
      errorCalledRef.current = null;
    }
  }, [txHash]);

  // Handle success callback
  useEffect(() => {
    if (isSuccess && txHash && onSuccess && !successCalledRef.current) {
      successCalledRef.current = true;
      onSuccess(txHash);
    }
  }, [isSuccess, txHash, onSuccess]);

  // Handle error callback
  const currentError = error || getErrorMessage(writeError) || getErrorMessage(txError) || null;
  useEffect(() => {
    if (currentError && onError && errorCalledRef.current !== currentError) {
      errorCalledRef.current = currentError;
      onError(new Error(currentError));
    }
  }, [currentError, onError]);

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
      
      await writeContract({
        address: trimmedAddress as Address,
        abi: TREASURY_ABI,
        functionName: 'collectFee',
        args: [],
        value: amountInWei,
      });
    } catch (err: any) {
      const errorMessage = err?.message || err?.toString() || 'Failed to pay fee';
      console.error('Error paying fee:', err);
      setError(errorMessage);
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage));
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

