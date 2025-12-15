/**
 * Kaspa Wallet Context
 * 
 * React context for managing Kaspa wallet connection state
 */

'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { KaspaWalletState, KaspaWalletProvider } from './types';
import type { SIWKAuthResult } from './auth';
import { 
  connectKaspaWallet, 
  disconnectKaspaWallet, 
  getKaspaAddress,
  detectKaspaWallets,
  onKaspaAccountChange,
} from './wallet';
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
  const [state, setState] = useState<KaspaWalletState & { siwkAuth?: SIWKAuthResult }>(() => {
    // Load from localStorage on mount
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const siwkStored = localStorage.getItem(SIWK_STORAGE_KEY);
        
        if (stored) {
          const parsed = JSON.parse(stored);
          // Validate stored state
          if (parsed.isConnected && parsed.address && parsed.provider) {
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

  const connect = useCallback(async (
    provider: KaspaWalletProvider,
    options?: { enableSIWK?: boolean; siwkParams?: { domain?: string; statement?: string; appName?: string } }
  ) => {
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
    
    const newState = await connectKaspaWallet(provider, {
      enableSIWK,
      siwkParams,
    });
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

