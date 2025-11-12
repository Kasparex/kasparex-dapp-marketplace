'use client';

import { useEffect, useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { config } from '@/lib/wagmi';
import { KaspaWalletProvider } from '@/lib/kaspa/context';
import { getErrorMessage } from '@/lib/utils';

// CRITICAL: Transform errors BEFORE React Query tries to serialize them
// This mutation cache intercepts errors at the lowest level, before React Query stores them
// We use onMutate to catch errors before they're set, and onError to transform them after
const mutationCache = new MutationCache({
  onMutate: async (variables) => {
    // This runs before the mutation executes
    // We can't catch errors here, but we can prepare
    return undefined;
  },
  onError: (error, _variables, _context, mutation) => {
    // CRITICAL: Convert function-type errors IMMEDIATELY
    // React Query may try to serialize before this runs, so we need to be defensive
    try {
      // Check if error is a function - this is the root cause
      if (typeof error === 'function') {
        // Convert function to Error object immediately
        const errorStr = getErrorMessage(error, 'An error occurred');
        // CRITICAL: Replace the error in mutation state BEFORE React Query serializes it
        // Use Object.defineProperty to ensure the error is replaced synchronously
        try {
          Object.defineProperty(mutation.state, 'error', {
            value: new Error(errorStr),
            writable: true,
            enumerable: true,
            configurable: true,
          });
        } catch (defineErr) {
          // If defineProperty fails, try direct assignment
          (mutation.state as any).error = new Error(errorStr);
        }
        console.error('Mutation error (function-type, converted):', errorStr);
        return;
      }
      // For non-function errors, ensure they're Error objects
      if (error && !(error instanceof Error)) {
        const errorStr = getErrorMessage(error, 'An error occurred');
        try {
          Object.defineProperty(mutation.state, 'error', {
            value: new Error(errorStr),
            writable: true,
            enumerable: true,
            configurable: true,
          });
        } catch (defineErr) {
          (mutation.state as any).error = new Error(errorStr);
        }
      }
    } catch (err) {
      // If conversion fails, replace with a safe error
      try {
        (mutation.state as any).error = new Error('An error occurred');
      } catch {
        // Last resort - can't modify mutation state
        console.error('Error conversion failed in mutationCache - cannot modify mutation state');
      }
    }
  },
});

// CRITICAL: Configure QueryClient to handle errors safely
// This prevents "Cannot use 'in' operator" errors when React Query tries to serialize function-type errors
const queryClient = new QueryClient({
  mutationCache,
  defaultOptions: {
    mutations: {
      onError: (error) => {
        // This runs AFTER mutationCache.onError, so error should already be converted
        // But we still handle it defensively
        try {
          if (typeof error === 'function') {
            const errorStr = getErrorMessage(error, 'An error occurred');
            console.error('Mutation error (function-type in onError):', errorStr);
            return;
          }
          const errorStr = getErrorMessage(error, 'An error occurred');
          console.error('Mutation error:', errorStr);
        } catch (err) {
          console.error('Error occurred (conversion failed)');
        }
      },
      // Use mutationFn wrapper to catch errors before they reach React Query
      mutationFn: async (variables: any) => {
        // This is a fallback - wagmi handles its own mutations
        // But we can't wrap wagmi's internal mutations directly
        throw new Error('This should not be called directly');
      },
    },
    queries: {
      // Prevent React Query from storing function-type errors in cache
      retry: (failureCount, error) => {
        // CRITICAL: If error is a function, don't retry (it will cause serialization issues)
        if (typeof error === 'function') {
          try {
            const errorStr = getErrorMessage(error, 'Query failed');
            console.error('Query error (function-type):', errorStr);
          } catch (err) {
            console.error('Query error (function-type, conversion failed)');
          }
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

const customLightTheme = lightTheme({
  accentColor: '#02abb8',
  accentColorForeground: 'white',
  borderRadius: 'medium',
  fontStack: 'system',
  overlayBlur: 'small',
});

const customDarkTheme = darkTheme({
  accentColor: '#02abb8',
  accentColorForeground: 'white',
  borderRadius: 'medium',
  fontStack: 'system',
  overlayBlur: 'small',
});

function RainbowKitProviderWithTheme({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    // Check initial theme from document or localStorage
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark') ||
        (!document.documentElement.classList.contains('light') && 
         (localStorage.getItem('theme') === 'dark' || !localStorage.getItem('theme')));
      setTheme(isDark ? 'dark' : 'light');
    };

    checkTheme();

    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <RainbowKitProvider
      theme={theme === 'dark' ? customDarkTheme : customLightTheme}
      initialChain={config.chains[0]}
    >
      {children}
    </RainbowKitProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <KaspaWalletProvider>
          <RainbowKitProviderWithTheme>
            {children}
          </RainbowKitProviderWithTheme>
        </KaspaWalletProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

