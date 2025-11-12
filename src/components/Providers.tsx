'use client';

import { useEffect, useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { config } from '@/lib/wagmi';
import { KaspaWalletProvider } from '@/lib/kaspa/context';
import { getErrorMessage } from '@/lib/utils';

// CRITICAL: Configure QueryClient to handle errors safely
// This prevents "Cannot use 'in' operator" errors when React Query tries to serialize function-type errors
// Note: onError is only available for mutations, not queries
const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      onError: (error) => {
        // Convert error to string immediately to prevent React Query from trying to serialize function-type errors
        try {
          // CRITICAL: Check if error is a function before trying to serialize
          if (typeof error === 'function') {
            const errorStr = getErrorMessage(error, 'An error occurred');
            console.error('Mutation error (function-type):', errorStr);
            return;
          }
          const errorStr = getErrorMessage(error, 'An error occurred');
          console.error('Mutation error:', errorStr);
        } catch (err) {
          console.error('Error occurred (conversion failed)');
        }
      },
    },
    queries: {
      // Prevent React Query from storing function-type errors in cache
      retry: (failureCount, error) => {
        // CRITICAL: If error is a function, don't retry (it will cause serialization issues)
        // This prevents React Query from trying to serialize function-type errors
        if (typeof error === 'function') {
          // Log the function-type error for debugging
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

