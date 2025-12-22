'use client';

import { useState, useEffect, useCallback } from 'react';

const BALANCE_VISIBILITY_KEY = 'kaspa_wallet_balance_visible';

/**
 * Hook to manage balance visibility state
 * Stores preference in localStorage
 */
export function useBalanceVisibility() {
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return true; // Default to visible on server
    }
    const stored = localStorage.getItem(BALANCE_VISIBILITY_KEY);
    // Default to visible (true) if not set
    return stored === null ? true : stored === 'true';
  });

  useEffect(() => {
    // Sync with localStorage on mount
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(BALANCE_VISIBILITY_KEY);
      if (stored !== null) {
        setIsVisible(stored === 'true');
      }
    }
  }, []);

  const toggleVisibility = useCallback(() => {
    setIsVisible((prev) => {
      const newValue = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem(BALANCE_VISIBILITY_KEY, String(newValue));
      }
      return newValue;
    });
  }, []);

  const hideBalance = useCallback(() => {
    setIsVisible(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(BALANCE_VISIBILITY_KEY, 'false');
    }
  }, []);

  const showBalance = useCallback(() => {
    setIsVisible(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(BALANCE_VISIBILITY_KEY, 'true');
    }
  }, []);

  return {
    isVisible,
    toggleVisibility,
    hideBalance,
    showBalance,
  };
}

/**
 * Format balance for display based on visibility
 */
export function formatBalanceForDisplay(
  balance: string | number | null | undefined,
  symbol: string = 'KAS',
  isLoading: boolean = false,
  isVisible: boolean = true
): string {
  if (isLoading) {
    return 'Loading...';
  }

  if (!isVisible) {
    return '***';
  }

  if (balance === null || balance === undefined || balance === '') {
    return `0.00 ${symbol}`;
  }

  const balanceStr = typeof balance === 'number' ? balance.toFixed(2) : balance;
  return `${balanceStr} ${symbol}`;
}

