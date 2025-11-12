'use client';

import { useEffect, useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { config } from '@/lib/wagmi';
import { KaspaWalletProvider } from '@/lib/kaspa/context';
import { getErrorMessage } from '@/lib/utils';

// CRITICAL: Global error handler to intercept React Query's error serialization
// We intercept errors at the mutation creation level using onMutate with Proxy
// This ensures errors are converted BEFORE React Query tries to serialize them

// CRITICAL: Transform errors BEFORE React Query tries to serialize them
// We intercept errors at the mutation execution level using a Proxy
// This ensures errors are converted BEFORE React Query tries to serialize them
const mutationCache = new MutationCache({
  onMutate: async (variables, mutation) => {
    // Wrap the mutation function to intercept errors BEFORE they reach React Query
    const originalMutationFn = mutation.options.mutationFn;
    if (originalMutationFn && typeof originalMutationFn === 'function') {
      // Wrap the mutation function to catch and transform errors
      mutation.options.mutationFn = async (...args: any[]) => {
        try {
          const result = await originalMutationFn(...args);
          return result;
        } catch (error) {
          // CRITICAL: Convert function-type errors BEFORE React Query sees them
          if (typeof error === 'function') {
            const errorStr = getErrorMessage(error, 'An error occurred');
            throw new Error(errorStr);
          }
          // Ensure all errors are Error objects
          if (error && !(error instanceof Error)) {
            const errorStr = getErrorMessage(error, 'An error occurred');
            throw new Error(errorStr);
          }
          throw error;
        }
      };
    }
    
    // CRITICAL: Also intercept errors by wrapping the mutation state
    // Use a Proxy to intercept error property access
    const originalState = mutation.state;
    if (originalState) {
      mutation.state = new Proxy(originalState, {
        set(target, prop, value) {
          // If setting the error property, convert function-type errors
          if (prop === 'error' && typeof value === 'function') {
            const errorStr = getErrorMessage(value, 'An error occurred');
            return Reflect.set(target, prop, new Error(errorStr));
          }
          if (prop === 'error' && value && !(value instanceof Error)) {
            const errorStr = getErrorMessage(value, 'An error occurred');
            return Reflect.set(target, prop, new Error(errorStr));
          }
          return Reflect.set(target, prop, value);
        },
      });
    }
    
    return undefined;
  },
  onError: (error, _variables, _context, mutation) => {
    // CRITICAL: Convert function-type errors IMMEDIATELY
    // This is a fallback in case the onMutate wrapper didn't catch it
    try {
      if (typeof error === 'function') {
        const errorStr = getErrorMessage(error, 'An error occurred');
        // Replace the error in mutation state synchronously
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
        console.error('Mutation error (function-type, converted in onError):', errorStr);
        return;
      }
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
      try {
        (mutation.state as any).error = new Error('An error occurred');
      } catch {
        console.error('Error conversion failed in mutationCache');
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

