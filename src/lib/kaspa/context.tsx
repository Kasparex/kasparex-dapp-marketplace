/**
 * Kaspa Wallet Context
 * 
 * React context for managing Kaspa wallet connection state
 */

'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { KaspaWalletState, KaspaWalletProvider } from './types';
import { 
  connectKaspaWallet, 
  disconnectKaspaWallet, 
  getKaspaAddress,
  detectKaspaWallets,
  onKaspaAccountChange,
} from './wallet';

interface KaspaWalletContextType {
  state: KaspaWalletState;
  connect: (provider: KaspaWalletProvider) => Promise<void>;
  disconnect: () => Promise<void>;
  refresh: () => Promise<void>;
}

const KaspaWalletContext = createContext<KaspaWalletContextType | undefined>(undefined);

const STORAGE_KEY = 'kaspa_wallet_state';

/**
 * Kaspa Wallet Provider Component
 */
export function KaspaWalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<KaspaWalletState>(() => {
    // Load from localStorage on mount
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Validate stored state
          if (parsed.isConnected && parsed.address && parsed.provider) {
            return parsed;
          }
        }
      } catch (error) {
        console.error('Error loading wallet state:', error);
      }
    }
    
    return {
      isConnected: false,
      address: null,
      provider: null,
      error: null,
    };
  });

  // Save to localStorage when state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (state.isConnected) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        console.error('Error saving wallet state:', error);
      }
    }
  }, [state]);

  // Set up account change listener
  useEffect(() => {
    if (!state.isConnected || !state.provider) {
      return;
    }

    const cleanup = onKaspaAccountChange(state.provider, async (accounts) => {
      if (accounts.length === 0) {
        // Wallet disconnected
        setState({
          isConnected: false,
          address: null,
          provider: null,
          error: null,
        });
      } else {
        // Address changed
        const newAddress = accounts[0];
        setState(prev => ({
          ...prev,
          address: newAddress.startsWith('kaspa:') ? newAddress : `kaspa:${newAddress}`,
        }));
      }
    });

    return cleanup;
  }, [state.isConnected, state.provider]);

  const connect = useCallback(async (provider: KaspaWalletProvider) => {
    const newState = await connectKaspaWallet(provider);
    setState(newState);
  }, []);

  const disconnect = useCallback(async () => {
    if (state.provider) {
      await disconnectKaspaWallet(state.provider);
    }
    setState({
      isConnected: false,
      address: null,
      provider: null,
      error: null,
    });
  }, [state.provider]);

  const refresh = useCallback(async () => {
    if (!state.provider) {
      return;
    }

    const address = await getKaspaAddress(state.provider);
    if (address) {
      setState(prev => ({
        ...prev,
        address,
        error: null,
      }));
    } else {
      setState({
        isConnected: false,
        address: null,
        provider: null,
        error: null,
      });
    }
  }, [state.provider]);

  return (
    <KaspaWalletContext.Provider value={{ state, connect, disconnect, refresh }}>
      {children}
    </KaspaWalletContext.Provider>
  );
}

/**
 * Hook to use Kaspa wallet context
 */
export function useKaspaWallet() {
  const context = useContext(KaspaWalletContext);
  if (context === undefined) {
    throw new Error('useKaspaWallet must be used within KaspaWalletProvider');
  }
  return context;
}

