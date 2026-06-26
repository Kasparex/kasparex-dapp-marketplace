/**
 * Kaspa Wallet Context
 * 
 * React context for managing Kaspa wallet connection state
 */

'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import type { KaspaWalletState, KaspaWalletProvider } from './types';
import type { SIWKAuthResult } from './auth';
import { 
  connectKaspaWallet, 
  disconnectKaspaWallet, 
  getKaspaAddress,
  onKaspaAccountChange,
  getWalletProvider,
} from './wallet';
import {
  disconnectWagmiWallet,
  scheduleDisconnectWagmiWalletBursts,
} from '@/lib/evm/disconnectWagmi';
import { isSIWKExpired } from './auth';

interface KaspaWalletContextType {
  state: KaspaWalletState & { siwkAuth?: SIWKAuthResult };
  connect: (provider: KaspaWalletProvider, options?: { enableSIWK?: boolean; siwkParams?: { domain?: string; statement?: string; appName?: string } }) => Promise<void>;
  disconnect: () => Promise<void>;
  refresh: () => Promise<void>;
  signInWithKaspa: (provider: KaspaWalletProvider, params?: { domain?: string; statement?: string; appName?: string }) => Promise<SIWKAuthResult | null>;
}

const KaspaWalletContext = createContext<KaspaWalletContextType | undefined>(undefined);

const STORAGE_KEY = 'kaspa_wallet_state';
const SIWK_STORAGE_KEY = 'kaspa_siwk_auth';

const DEFAULT_WALLET_STATE: KaspaWalletState & { siwkAuth?: SIWKAuthResult } = {
  isConnected: false,
  address: null,
  provider: null,
  error: null,
};

function normalizeStoredAddress(address: string): string {
  return address.startsWith('kaspa:') ? address : `kaspa:${address}`;
}

function readPersistedWalletState(): KaspaWalletState & { siwkAuth?: SIWKAuthResult } {
  if (typeof window === 'undefined') return DEFAULT_WALLET_STATE;

  try {
    const oldKeys = ['kasware_wallet_state'];
    oldKeys.forEach((key) => {
      if (localStorage.getItem(key)) localStorage.removeItem(key);
    });

    const stored = localStorage.getItem(STORAGE_KEY);
    const siwkStored = localStorage.getItem(SIWK_STORAGE_KEY);
    if (!stored) return DEFAULT_WALLET_STATE;

    const parsed = JSON.parse(stored) as KaspaWalletState;
    if (!parsed.isConnected || !parsed.address || !parsed.provider) {
      return DEFAULT_WALLET_STATE;
    }

    let siwkAuth: SIWKAuthResult | undefined;
    if (siwkStored) {
      try {
        const siwkParsed = JSON.parse(siwkStored) as SIWKAuthResult;
        if (siwkParsed.expirationTime && !isSIWKExpired(siwkParsed.expirationTime)) {
          siwkAuth = siwkParsed;
        } else {
          localStorage.removeItem(SIWK_STORAGE_KEY);
        }
      } catch (error) {
        console.error('Error loading SIWK auth:', error);
      }
    }

    return {
      ...parsed,
      address: normalizeStoredAddress(parsed.address),
      ...(siwkAuth && { siwkAuth }),
    };
  } catch (error) {
    console.error('Error loading wallet state:', error);
    return DEFAULT_WALLET_STATE;
  }
}

function persistWalletState(state: KaspaWalletState & { siwkAuth?: SIWKAuthResult }) {
  if (typeof window === 'undefined') return;
  try {
    const { siwkAuth, ...walletState } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(walletState));
    if (siwkAuth && !isSIWKExpired(siwkAuth.expirationTime)) {
      localStorage.setItem(SIWK_STORAGE_KEY, JSON.stringify(siwkAuth));
    } else {
      localStorage.removeItem(SIWK_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Error saving wallet state:', error);
  }
}

function clearPersistedWalletState() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SIWK_STORAGE_KEY);
}

/**
 * Kaspa Wallet Provider Component
 */
export function KaspaWalletProvider({ children }: { children: ReactNode }) {
  /**
   * KasWare-only: after a Kaspa account switch, `window.ethereum` may emit `accountsChanged`
   * and wagmi can re-attach. While this timestamp is in the future, we run disconnect bursts.
   */
  const suppressEvmReconnectUntilRef = useRef(0);
  const userDisconnectedRef = useRef(false);
  const emptyAccountsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [state, setState] = useState<KaspaWalletState & { siwkAuth?: SIWKAuthResult }>(() =>
    readPersistedWalletState(),
  );

  // Save to localStorage when connected; only clear on explicit disconnect.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (state.isConnected && state.address && state.provider) {
      persistWalletState(state);
    }
  }, [state.isConnected, state.address, state.provider, state.siwkAuth, state.error]);

  // Re-verify session after wallet extensions inject (avoids false disconnect on refresh).
  useEffect(() => {
    if (typeof window === 'undefined' || userDisconnectedRef.current) return;

    const provider = state.provider;
    if (!provider) return;

    let cancelled = false;

    async function restoreSession() {
      for (let attempt = 0; attempt < 20; attempt += 1) {
        if (cancelled) return;

        const walletProvider = getWalletProvider(provider!);
        if (walletProvider) {
          try {
            const address = await getKaspaAddress(provider!);
            if (cancelled) return;
            if (address) {
              setState((prev) => ({
                ...prev,
                isConnected: true,
                address: normalizeStoredAddress(address),
                provider: provider!,
                error: null,
              }));
            }
          } catch (error) {
            console.warn('Wallet session restore attempt failed:', error);
          }
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, [state.provider]);

  // KasWare: `window.ethereum` can mirror Kaspa account changes; briefly suppress wagmi reinject.
  // Kastle: do not listen here - the same `ethereum` object can emit when switching L1 even when
  // EVM is connected via WalletConnect / MetaMask, and disconnecting would drop that unrelated session.
  // Kastle EVM isolation is handled by wagmi MIPD rdns reservation (`kastleMipdBlock.ts`).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!state.isConnected || !state.provider) return;
    if (state.provider !== 'kasware') return;

    const ethereum = (window as unknown as {
      ethereum?: {
        on?: (event: string, handler: (...args: unknown[]) => void) => void;
        removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
      };
    }).ethereum;
    if (!ethereum?.on) return;

    const onEthAccountsChanged = () => {
      if (Date.now() < suppressEvmReconnectUntilRef.current) {
        scheduleDisconnectWagmiWalletBursts();
      }
    };

    ethereum.on('accountsChanged', onEthAccountsChanged);
    return () => {
      ethereum.removeListener?.('accountsChanged', onEthAccountsChanged);
    };
  }, [state.isConnected, state.provider]);

  // Set up account change listener
  useEffect(() => {
    if (!state.isConnected || !state.provider) {
      return;
    }

    const cleanup = onKaspaAccountChange(state.provider, async (accounts) => {
      if (accounts.length > 0 && state.provider === 'kasware') {
        suppressEvmReconnectUntilRef.current = Date.now() + 1500;
        scheduleDisconnectWagmiWalletBursts();
      }

      if (emptyAccountsTimerRef.current) {
        clearTimeout(emptyAccountsTimerRef.current);
        emptyAccountsTimerRef.current = null;
      }

      if (accounts.length === 0) {
        emptyAccountsTimerRef.current = setTimeout(async () => {
          try {
            const currentAddress = await getKaspaAddress(state.provider!);
            if (currentAddress) {
              setState((prev) => ({
                ...prev,
                isConnected: true,
                address: normalizeStoredAddress(currentAddress),
                error: null,
              }));
              return;
            }
          } catch {
            // fall through to disconnect
          }
          if (userDisconnectedRef.current) return;
          await disconnectWagmiWallet();
          clearPersistedWalletState();
          setState({
            isConnected: false,
            address: null,
            provider: null,
            error: null,
          });
        }, 750);
        return;
      }

      const newAddress = accounts[0];
      setState((prev) => ({
        ...prev,
        isConnected: true,
        address: normalizeStoredAddress(newAddress),
      }));
    });

    return () => {
      if (emptyAccountsTimerRef.current) {
        clearTimeout(emptyAccountsTimerRef.current);
        emptyAccountsTimerRef.current = null;
      }
      cleanup();
    };
  }, [state.isConnected, state.provider]);

  const connect = useCallback(async (
    provider: KaspaWalletProvider,
    options?: { enableSIWK?: boolean; siwkParams?: { domain?: string; statement?: string; appName?: string } }
  ) => {
    try {
      // Enable SIWK by default unless explicitly disabled
      const enableSIWK = options?.enableSIWK !== false; // Default to true
      
      // Default SIWK parameters
      const domain = typeof window !== 'undefined' ? window.location.hostname : 'kasparex.com';
      const appName = 'Kasparex dApps';
      
      const siwkParams = {
        domain: options?.siwkParams?.domain || domain,
        statement: options?.siwkParams?.statement || `Welcome to ${options?.siwkParams?.appName || appName}!`,
        appName: options?.siwkParams?.appName || appName,
      };
      
      console.log('Connecting to wallet:', provider);
      const newState = await connectKaspaWallet(provider, {
        enableSIWK,
        siwkParams,
      });
      
      console.log('Connection result:', { 
        isConnected: newState.isConnected, 
        address: newState.address, 
        provider: newState.provider,
        error: newState.error 
      });
      
      // Verify connection actually succeeded
      if (!newState.isConnected || !newState.address) {
        throw new Error(newState.error || 'Connection failed');
      }
      
      // Verify wallet is actually connected (but don't fail if method doesn't exist)
      const walletProvider = getWalletProvider(provider);
      if (walletProvider && typeof walletProvider.isConnected === 'function') {
        const isActuallyConnected = walletProvider.isConnected();
        console.log('Wallet connection verification:', isActuallyConnected);
        // Don't fail if isConnected returns false - some wallets don't implement this correctly
        // If requestAccounts() succeeded, we trust the connection
        if (!isActuallyConnected) {
          console.warn('Wallet isConnected() returned false, but requestAccounts() succeeded. Continuing with connection.');
        }
      } else {
        console.log('Wallet isConnected() method not available, trusting requestAccounts() result');
      }
      
      setState(newState);
      userDisconnectedRef.current = false;
      // L1 Kaspa connect is independent from EVM; avoid auto-pairing an EVM wallet.
      await disconnectWagmiWallet();
      console.log('Wallet state updated successfully:', { 
        isConnected: newState.isConnected, 
        address: newState.address, 
        provider: newState.provider 
      });
    } catch (error) {
      console.error('Error in connect callback:', error);
      setState({
        isConnected: false,
        address: null,
        provider: null,
        error: error instanceof Error ? error.message : 'Connection failed',
      });
      throw error;
    }
  }, []);

  const disconnect = useCallback(async () => {
    userDisconnectedRef.current = true;
    if (state.provider) {
      await disconnectKaspaWallet(state.provider);
    }
    clearPersistedWalletState();
    setState({
      isConnected: false,
      address: null,
      provider: null,
      error: null,
    });
  }, [state.provider]);
  
  const signInWithKaspa = useCallback(async (
    provider: KaspaWalletProvider,
    params?: { domain?: string; statement?: string; appName?: string }
  ): Promise<SIWKAuthResult | null> => {
    if (!state.isConnected || !state.address || state.provider !== provider) {
      throw new Error('Wallet must be connected before signing in with Kaspa');
    }
    
    try {
      const { signInWithKaspa: siwkSignIn } = await import('./auth');
      const domain = params?.domain || (typeof window !== 'undefined' ? window.location.hostname : 'kasparex.com');
      const appName = params?.appName || 'Kasparex dApps';
      
      const siwkAuth = await siwkSignIn(provider, {
        domain,
        address: state.address,
        statement: params?.statement || `Welcome to ${appName}!`,
      });
      
      // Update state with SIWK auth
      setState(prev => ({
        ...prev,
        siwkAuth,
      }));
      
      return siwkAuth;
    } catch (error) {
      console.error('Error signing in with Kaspa:', error);
      return null;
    }
  }, [state.isConnected, state.address, state.provider]);

  const refresh = useCallback(async () => {
    if (!state.provider) {
      return;
    }

    try {
      const address = await getKaspaAddress(state.provider);
      if (address) {
        setState((prev) => ({
          ...prev,
          isConnected: true,
          address: normalizeStoredAddress(address),
          error: null,
        }));
      }
    } catch (error) {
      console.warn('Wallet refresh failed, keeping stored session:', error);
    }
  }, [state.provider]);

  return (
    <KaspaWalletContext.Provider value={{ state, connect, disconnect, refresh, signInWithKaspa }}>
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

