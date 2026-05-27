'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

const BALANCE_VISIBILITY_KEY = 'kaspa_wallet_balance_visible';

interface BalanceVisibilityContextType {
  isVisible: boolean;
  toggleVisibility: () => void;
  hideBalance: () => void;
  showBalance: () => void;
}

const BalanceVisibilityContext = createContext<BalanceVisibilityContextType | undefined>(undefined);

/**
 * Provider component for balance visibility state
 * Shares state across all components using the context
 */
export function BalanceVisibilityProvider({ children }: { children: ReactNode }) {
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

  return (
    <BalanceVisibilityContext.Provider
      value={{
        isVisible,
        toggleVisibility,
        hideBalance,
        showBalance,
      }}
    >
      {children}
    </BalanceVisibilityContext.Provider>
  );
}

/**
 * Hook to access balance visibility state
 * Must be used within BalanceVisibilityProvider
 */
export function useBalanceVisibility() {
  const context = useContext(BalanceVisibilityContext);
  if (context === undefined) {
    throw new Error('useBalanceVisibility must be used within a BalanceVisibilityProvider');
  }
  return context;
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

/**
 * Format balance value only (no symbol) based on visibility.
 * Useful when the UI already renders the ticker separately.
 */
export function formatBalanceValueForDisplay(
  balance: string | number | null | undefined,
  isLoading: boolean = false,
  isVisible: boolean = true,
  opts?: { decimals?: number }
): string {
  if (isLoading) return 'Loading...';
  if (!isVisible) return '***';
  if (balance === null || balance === undefined || balance === '') return '0.00';
  if (typeof balance === 'number') {
    const d = opts?.decimals ?? 2;
    return balance.toFixed(d);
  }
  return String(balance);
}

/**
 * Hide arbitrary numeric-ish strings with the global toggle.
 */
export function maskValue(value: string, isVisible: boolean): string {
  if (isVisible) return value;
  return '***';
}

/**
 * Format address for display based on visibility
 */
export function maskAddress(address: string, isVisible: boolean): string {
  if (isVisible || !address) {
    return address;
  }
  return '****';
}

/** When privacy mode is on, hide KNS domain labels on connect buttons and similar surfaces. */
export function maskKnsDomain(domain: string | null | undefined, isVisible: boolean): string | null {
  if (!domain) return null;
  if (isVisible) return String(domain).toLowerCase();
  return '***';
}

/** When privacy mode is on, hide INS (.igra) domain labels on connect buttons and similar surfaces. */
export function maskInsDomain(domain: string | null | undefined, isVisible: boolean): string | null {
  if (!domain) return null;
  if (isVisible) return String(domain).toLowerCase();
  return '***';
}
