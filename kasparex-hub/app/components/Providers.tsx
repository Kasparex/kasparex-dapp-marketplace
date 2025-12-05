/**
 * Providers Component
 * 
 * Wraps the app with all necessary providers (Wagmi, RainbowKit, Kaspa Wallet, React Query)
 */

import { ReactNode, useState, useEffect } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { config } from "~/lib/wagmi";
import { KaspaWalletProvider } from "~/lib/kaspa/provider";

// Create a stable QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

// Custom themes matching Kasparex design
const customLightTheme = lightTheme({
  accentColor: '#02abb8',
  borderRadius: 'medium',
  fontStack: 'system',
  overlayBlur: 'small',
});

const customDarkTheme = darkTheme({
  accentColor: '#02abb8',
  borderRadius: 'medium',
  fontStack: 'system',
  overlayBlur: 'small',
});

function RainbowKitProviderWithTheme({ children }: { children: ReactNode }) {
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

export function Providers({ children }: { children: ReactNode }) {
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



