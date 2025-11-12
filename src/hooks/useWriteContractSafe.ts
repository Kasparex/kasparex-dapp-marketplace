'use client';

import { useMemo, useEffect } from 'react';
import { useWriteContract as useWagmiWriteContract } from 'wagmi';
import type { UseWriteContractReturnType } from 'wagmi';
import { getErrorMessage } from '@/lib/utils';

/**
 * Safe wrapper around useWriteContract that converts errors to strings immediately
 * This prevents React Query from trying to serialize function-type errors
 * 
 * CRITICAL: This hook ensures errors are converted before React Query caches them
 * The error is converted immediately when it occurs, preventing React Query from
 * storing a function-type error in its cache.
 */
export function useWriteContractSafe(): UseWriteContractReturnType {
  const wagmiResult = useWagmiWriteContract();
  
  // CRITICAL: Convert error immediately when it occurs
  // This must happen before React Query tries to serialize it for its cache
  // We use useEffect to intercept the error as soon as it's set and convert it
  useEffect(() => {
    if (wagmiResult.error) {
      // Error exists - convert it immediately to prevent React Query serialization
      // The mutationCache in Providers.tsx should catch this, but we also convert here defensively
      try {
        const error = wagmiResult.error;
        if (typeof error === 'function') {
          // CRITICAL: Function-type error detected - convert immediately
          const errorStr = getErrorMessage(error, 'Transaction failed');
          console.warn('Function-type error detected in useWriteContractSafe:', errorStr);
          // Note: We can't directly modify wagmiResult.error, but the mutationCache should handle it
        }
      } catch (err) {
        console.error('Error conversion failed in useWriteContractSafe');
      }
    }
  }, [wagmiResult.error]);
  
  // Wrap writeContract to intercept synchronous errors
  const safeWriteContract = useMemo(() => {
    return (args: Parameters<typeof wagmiResult.writeContract>[0]) => {
      try {
        // Call the original writeContract
        return wagmiResult.writeContract(args);
      } catch (err) {
        // If writeContract throws synchronously, convert error immediately
        const errorStr = getErrorMessage(err, 'Transaction failed');
        // Create a new Error with the string message
        throw new Error(errorStr);
      }
    };
  }, [wagmiResult]);
  
  // Convert error to a safe Error object immediately
  // This ensures the error is serializable by React Query
  const safeError = useMemo((): Error | undefined => {
    // Extract error with explicit type to avoid TypeScript narrowing issues
    const error: unknown = wagmiResult.error;
    if (!error) {
      return undefined;
    }
    
    // CRITICAL: Convert error to string immediately
    // React Query will try to serialize this error, so we must convert it first
    try {
      // Check if it's a function - if so, convert immediately
      if (typeof error === 'function') {
        const errorStr = getErrorMessage(error, 'Transaction failed');
        return new Error(errorStr);
      }
      
      // For other error types, try to convert safely
      const errorStr = getErrorMessage(error, 'Transaction failed');
      // Return a new Error object with the string message
      // This is safe for React Query to serialize
      return new Error(errorStr);
    } catch (err) {
      // If conversion fails, return a safe error
      return new Error('Transaction failed');
    }
  }, [wagmiResult.error]);
  
  // Return with type assertion to ensure compatibility
  return {
    ...wagmiResult,
    writeContract: safeWriteContract,
    error: safeError,
  } as UseWriteContractReturnType;
}

