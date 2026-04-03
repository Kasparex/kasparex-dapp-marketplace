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

/**
 * Kaspa Wallet Provider Component
 */
export function KaspaWalletProvider({ children }: { children: ReactNode }) {
  /**
   * KasWare (and some L1 wallets) share `window.ethereum` with wagmi. After a Kaspa
   * account switch, EIP-1193 `accountsChanged` can reconnect EVM and clear wagmi's
   * disconnect shim. While this timestamp is in the future, we tear EVM down again.
   */
  const suppressEvmReconnectUntilRef = useRef(0);

  const [state, setState] = useState<KaspaWalletState & { siwkAuth?: SIWKAuthResult }>(() => {
    // Load from localStorage on mount
    if (typeof window !== 'undefined') {
      try {
        // Clear old localStorage keys from previous implementation
        const oldKeys = ['kasware_wallet_state'];
        oldKeys.forEach(key => {
          if (localStorage.getItem(key)) {
            console.log(`Clearing old localStorage key: ${key}`);
            localStorage.removeItem(key);
          }
        });

        const stored = localStorage.getItem(STORAGE_KEY);
        const siwkStored = localStorage.getItem(SIWK_STORAGE_KEY);
        
        if (stored) {
          const parsed = JSON.parse(stored);
          // Validate stored state and verify wallet is still connected
          if (parsed.isConnected && parsed.address && parsed.provider) {
            // Verify wallet is still actually connected.
            // Some wallet extensions report false during early page init,
            // so avoid hard-disconnecting on a single negative signal.
            const walletProvider = getWalletProvider(parsed.provider);
            const hasProvider = Boolean(walletProvider);
            const isActuallyConnected = walletProvider?.isConnected?.();

            if (!hasProvider) {
              // Wallet is not actually connected, clear stored state
              console.log('Stored wallet state found but provider is missing, clearing...');
              localStorage.removeItem(STORAGE_KEY);
              localStorage.removeItem(SIWK_STORAGE_KEY);
              return {
                isConnected: false,
                address: null,
                provider: null,
                error: null,
              };
            }

            // Load SIWK auth if available
            let siwkAuth: SIWKAuthResult | undefined;
            if (siwkStored) {
              try {
                const siwkParsed = JSON.parse(siwkStored);
                // Check if SIWK auth is expired
                if (siwkParsed.expirationTime && !isSIWKExpired(siwkParsed.expirationTime)) {
                  siwkAuth = siwkParsed;
                } else {
                  // Remove expired SIWK auth
                  localStorage.removeItem(SIWK_STORAGE_KEY);
                }
              } catch (error) {
                console.error('Error loading SIWK auth:', error);
              }
            }
            
            return {
              ...parsed,
              ...(siwkAuth && { siwkAuth }),
            };
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
          // Save wallet state (without siwkAuth for backward compatibility)
          const { siwkAuth, ...walletState } = state;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(walletState));
          
          // Save SIWK auth separately if present
          if (siwkAuth) {
            // Check if expired before saving
            if (!isSIWKExpired(siwkAuth.expirationTime)) {
              localStorage.setItem(SIWK_STORAGE_KEY, JSON.stringify(siwkAuth));
            } else {
              localStorage.removeItem(SIWK_STORAGE_KEY);
            }
          } else {
            localStorage.removeItem(SIWK_STORAGE_KEY);
          }
        } else {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(SIWK_STORAGE_KEY);
        }
      } catch (error) {
        console.error('Error saving wallet state:', error);
      }
    }
  }, [state]);

  // KasWare / Kastle: same browser provider may emit Ethereum `accountsChanged` when Kaspa accounts change.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!state.isConnected || !state.provider) return;
    if (state.provider !== 'kasware' && state.provider !== 'kastle') return;

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
      // KasWare / Kastle account switch or reconnect should not leave an unrelated EVM session active.
      if (accounts.length > 0) {
        suppressEvmReconnectUntilRef.current = Date.now() + 1500;
        scheduleDisconnectWagmiWalletBursts();
      }

      if (accounts.length === 0) {
        // Some providers may emit transient empty arrays during page transitions.
        // Re-check address before forcing disconnect.
        try {
          const currentAddress = await getKaspaAddress(state.provider!);
          if (currentAddress) {
            setState(prev => ({
              ...prev,
              isConnected: true,
              address: currentAddress,
              error: null,
            }));
            return;
          }
        } catch {
          // fall through to disconnect
        }
        await disconnectWagmiWallet();
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
    if (state.provider) {
      await disconnectKaspaWallet(state.provider);
    }
    setState({
      isConnected: false,
      address: null,
      provider: null,
      error: null,
    });
    // Clear SIWK auth from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SIWK_STORAGE_KEY);
    }
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

