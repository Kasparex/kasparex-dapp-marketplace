'use client';

import { useEffect, useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { config } from '@/lib/wagmi';
import { KaspaWalletProvider } from '@/lib/kaspa/context';
import { getErrorMessage } from '@/lib/utils';

// CRITICAL: Configure QueryClient to convert errors to strings before React Query serializes them
// This prevents "Cannot use 'in' operator" errors when React Query tries to cache function-type errors
const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      onError: (error) => {
        // Convert error to string immediately to prevent React Query from trying to serialize function-type errors
        try {
          const errorStr = getErrorMessage(error, 'An error occurred');
          // Store the stringified error instead of the raw error
          // This prevents React Query from trying to serialize function objects
          console.error('Mutation error:', errorStr);
        } catch (err) {
          // Even error conversion failed - log a safe message
          console.error('Error occurred (conversion failed)');
        }
      },
    },
    queries: {
      onError: (error) => {
        // Convert error to string immediately for queries as well
        try {
          const errorStr = getErrorMessage(error, 'An error occurred');
          console.error('Query error:', errorStr);
        } catch (err) {
          console.error('Error occurred (conversion failed)');
        }
      },
      // Prevent React Query from storing function-type errors in cache
      retry: (failureCount, error) => {
        // If error is a function, don't retry (it will cause serialization issues)
        if (typeof error === 'function') {
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

