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
// We need to patch React Query's internal error handling to convert function-type errors
// BEFORE React Query tries to serialize them using the 'in' operator

// Patch MutationCache to intercept errors at the lowest level possible
// We create a custom MutationCache that wraps the original and intercepts all error operations
class SafeMutationCache extends MutationCache {
  constructor() {
    super({
      onMutate: async (variables, mutation) => {
        // CRITICAL: Wrap mutation function to catch errors BEFORE they're stored
        // This is the FIRST line of defense - intercept errors at the mutation function level
        const originalMutationFn = mutation.options.mutationFn;
        if (originalMutationFn && typeof originalMutationFn === 'function') {
          mutation.options.mutationFn = async (...args: any[]) => {
            try {
              const result = await (originalMutationFn as any).apply(null, args);
              return result;
            } catch (error) {
              // CRITICAL: Convert function-type errors IMMEDIATELY
              // This prevents React Query from ever seeing function-type errors
              if (typeof error === 'function') {
                const errorStr = getErrorMessage(error, 'An error occurred');
                console.error('🚨 Function-type error intercepted in SafeMutationCache.onMutate:', errorStr);
                throw new Error(errorStr);
              }
              if (error && !(error instanceof Error)) {
                const errorStr = getErrorMessage(error, 'An error occurred');
                throw new Error(errorStr);
              }
              // Even if it's already an Error, ensure it's safe
              if (error instanceof Error) {
                // Double-check: if error.message contains function signature, convert it
                const errorStr = getErrorMessage(error, 'An error occurred');
                throw new Error(errorStr);
              }
              throw error;
            }
          };
        }
        
        // CRITICAL: Wrap mutation.state with a Proxy that intercepts ALL property access
        // This includes both 'get' and 'set' operations, preventing React Query from
        // using the 'in' operator on function-type errors
        const originalState = mutation.state;
        if (originalState) {
          // Helper function to create a safe error wrapper
          const createSafeError = (error: unknown): Error => {
            if (typeof error === 'function') {
              const errorStr = getErrorMessage(error, 'An error occurred');
              return new Error(errorStr);
            }
            if (error && !(error instanceof Error)) {
              const errorStr = getErrorMessage(error, 'An error occurred');
              return new Error(errorStr);
            }
            return error as Error;
          };

          mutation.state = new Proxy(originalState, {
            get(target, prop) {
              // If accessing 'error' property, ensure it's never a function
              if (prop === 'error') {
                const error = Reflect.get(target, prop);
                if (error) {
                  return createSafeError(error);
                }
                return error;
              }
              return Reflect.get(target, prop);
            },
            set(target, prop, value) {
              // If setting 'error' property, convert function-type errors immediately
              if (prop === 'error' && value) {
                const safeError = createSafeError(value);
                return Reflect.set(target, prop, safeError);
              }
              return Reflect.set(target, prop, value);
            },
            has(target, prop) {
              // CRITICAL: Intercept 'in' operator checks on mutation.state
              // This prevents React Query from checking properties on function-type errors
              if (prop === 'error') {
                const error = Reflect.get(target, prop);
                if (error && (typeof error === 'function' || !(error instanceof Error))) {
                  // Convert function-type error immediately
                  const safeError = createSafeError(error);
                  Reflect.set(target, prop, safeError);
                  return true;
                }
              }
              return Reflect.has(target, prop);
            },
            ownKeys(target) {
              // Ensure error property is included in ownKeys
              return Reflect.ownKeys(target);
            },
            getOwnPropertyDescriptor(target, prop) {
              // CRITICAL: Intercept property descriptor access
              // This prevents React Query from trying to enumerate function properties
              if (prop === 'error') {
                const error = Reflect.get(target, prop);
                if (error && (typeof error === 'function' || !(error instanceof Error))) {
                  // Convert function to Error immediately
                  const safeError = createSafeError(error);
                  Reflect.set(target, prop, safeError);
                }
              }
              return Reflect.getOwnPropertyDescriptor(target, prop);
            },
          });
        }
        
        return undefined;
      },
      onError: (error, _variables, _context, mutation) => {
        // CRITICAL: Convert function-type errors IMMEDIATELY
        // This is a fallback in case the Proxy didn't catch it
        // We need to convert the error BEFORE React Query tries to serialize it
        try {
          let safeError: Error;
          
          if (typeof error === 'function') {
            const errorStr = getErrorMessage(error, 'An error occurred');
            safeError = new Error(errorStr);
          } else if (error && !(error instanceof Error)) {
            const errorStr = getErrorMessage(error, 'An error occurred');
            safeError = new Error(errorStr);
          } else {
            safeError = error as Error;
          }
          
          // CRITICAL: Replace error in mutation.state IMMEDIATELY
          // Use multiple methods to ensure it works
          try {
            // Try Object.defineProperty first (most reliable)
            Object.defineProperty(mutation.state, 'error', {
              value: safeError,
              writable: true,
              enumerable: true,
              configurable: true,
            });
          } catch {
            // Fallback to direct assignment
            try {
              (mutation.state as any).error = safeError;
            } catch {
              // Last resort: try to patch the mutation object directly
              try {
                (mutation as any).state = {
                  ...mutation.state,
                  error: safeError,
                };
              } catch {
                // If all else fails, at least log it
                console.error('Failed to replace function-type error in mutation state');
              }
            }
          }
        } catch (err) {
          // Ultimate fallback - create a safe error
          try {
            (mutation.state as any).error = new Error('An error occurred');
          } catch {
            // Ignore - error conversion failed completely
          }
        }
      },
    });
  }
}

const mutationCache = new SafeMutationCache();

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

