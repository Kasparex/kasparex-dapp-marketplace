/**
 * Kaspa Wallet Provider
 * 
 * React context provider for managing Kaspa wallet connections (Kasware and Kastle)
 */

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { connectKasware, getKaswareAddress, getKaswareBalance, disconnectKasware, isKaswareInstalled, type KaswareProvider } from "./kasware";
import { connectKastle, getKastleAddress, getKastleBalance, disconnectKastle, isKastleInstalled, type KastleProvider } from "./kastle";

export type KaspaWalletType = 'kasware' | 'kastle' | null;

export interface KaspaWalletState {
  address: string | null;
  balance: string | number | null;
  walletType: KaspaWalletType;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

interface KaspaWalletContextType extends KaspaWalletState {
  connect: (walletType: 'kasware' | 'kastle') => Promise<void>;
  disconnect: () => Promise<void>;
  refresh: () => Promise<void>;
}

const KaspaWalletContext = createContext<KaspaWalletContextType | undefined>(undefined);

export function KaspaWalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<KaspaWalletState>({
    address: null,
    balance: null,
    walletType: null,
    isConnected: false,
    isLoading: false,
    error: null,
  });

  // Load saved connection on mount
  useEffect(() => {
    const savedWalletType = localStorage.getItem('kaspa_wallet_type') as KaspaWalletType;
    if (savedWalletType && (savedWalletType === 'kasware' || savedWalletType === 'kastle')) {
      refreshWallet(savedWalletType);
    }
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (!state.walletType || !state.isConnected) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected
        setState(prev => ({
          ...prev,
          address: null,
          balance: null,
          isConnected: false,
          walletType: null,
        }));
        localStorage.removeItem('kaspa_wallet_type');
      } else {
        // Account changed
        refresh();
      }
    };

    let provider: KaswareProvider | KastleProvider | null = null;
    if (state.walletType === 'kasware') {
      provider = (window as any).kasware;
    } else if (state.walletType === 'kastle') {
      provider = (window as any).kastle;
    }

    if (provider && provider.on) {
      provider.on('accountsChanged', handleAccountsChanged);
      return () => {
        if (provider && provider.removeListener) {
          provider.removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    }
  }, [state.walletType, state.isConnected]);

  const refreshWallet = async (walletType: 'kasware' | 'kastle') => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      let address: string | null = null;
      let balance: string | number | null = null;

      if (walletType === 'kasware') {
        address = await getKaswareAddress();
        if (address) {
          balance = await getKaswareBalance();
        }
      } else if (walletType === 'kastle') {
        address = await getKastleAddress();
        if (address) {
          balance = await getKastleBalance();
        }
      }

      setState(prev => ({
        ...prev,
        address,
        balance,
        walletType: address ? walletType : null,
        isConnected: !!address,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to refresh wallet',
      }));
    }
  };

  const connect = async (walletType: 'kasware' | 'kastle') => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      let address: string | null = null;
      let balance: string | number | null = null;

      if (walletType === 'kasware') {
        if (!isKaswareInstalled()) {
          throw new Error('Kasware wallet not found. Please install Kasware extension.');
        }
        address = await connectKasware();
        if (address) {
          balance = await getKaswareBalance();
          localStorage.setItem('kaspa_wallet_type', 'kasware');
        }
      } else if (walletType === 'kastle') {
        if (!isKastleInstalled()) {
          throw new Error('Kastle wallet not found. Please install Kastle extension.');
        }
        address = await connectKastle();
        if (address) {
          balance = await getKastleBalance();
          localStorage.setItem('kaspa_wallet_type', 'kastle');
        }
      }

      setState(prev => ({
        ...prev,
        address,
        balance,
        walletType: address ? walletType : null,
        isConnected: !!address,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to connect wallet',
      }));
      throw error;
    }
  };

  const disconnect = async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      if (state.walletType === 'kasware') {
        await disconnectKasware();
      } else if (state.walletType === 'kastle') {
        await disconnectKastle();
      }

      localStorage.removeItem('kaspa_wallet_type');
      setState(prev => ({
        ...prev,
        address: null,
        balance: null,
        walletType: null,
        isConnected: false,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to disconnect wallet',
      }));
    }
  };

  const refresh = async () => {
    if (state.walletType) {
      await refreshWallet(state.walletType);
    }
  };

  return (
    <KaspaWalletContext.Provider
      value={{
        ...state,
        connect,
        disconnect,
        refresh,
      }}
    >
      {children}
    </KaspaWalletContext.Provider>
  );
}

export function useKaspaWallet() {
  const context = useContext(KaspaWalletContext);
  if (context === undefined) {
    throw new Error('useKaspaWallet must be used within a KaspaWalletProvider');
  }
  return context;
}



