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
import { deleteSharedCookie, getSharedCookie, setSharedCookie } from '@/lib/storage/sharedCookie';

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
const COOKIE_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getPersisted(key: string): string | null {
  if (typeof window === 'undefined') return null;
  // Prefer shared cookie (cross-subdomain), fall back to localStorage (legacy).
  const cookieVal = getSharedCookie(key);
  if (cookieVal != null) return cookieVal;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setPersisted(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  setSharedCookie(key, value, { maxAgeSeconds: COOKIE_TTL_SECONDS });
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function removePersisted(key: string): void {
  if (typeof window === 'undefined') return;
  deleteSharedCookie(key);
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
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
  /** When persisted Kaspa session exists but `getWalletProvider` is null (new subdomain / early init). */
  const pendingKaspaHydrateRef = useRef<{ provider: KaspaWalletProvider; address: string } | null>(null);

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

        const stored = getPersisted(STORAGE_KEY);
        const siwkStored = getPersisted(SIWK_STORAGE_KEY);
        
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
              // Don't auto-clear here. Wallet providers can be unavailable during early page init
              // (especially on cold loads or while extensions are initializing).
              // Queue re-hydration when the extension becomes available (e.g. after navigating subdomains).
              console.log('Stored wallet state found but provider is missing; will retry when provider is available.');
              pendingKaspaHydrateRef.current = {
                provider: parsed.provider,
                address: parsed.address,
              };
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
                  removePersisted(SIWK_STORAGE_KEY);
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
          setPersisted(STORAGE_KEY, JSON.stringify(walletState));
          
          // Save SIWK auth separately if present
          if (siwkAuth) {
            // Check if expired before saving
            if (!isSIWKExpired(siwkAuth.expirationTime)) {
              setPersisted(SIWK_STORAGE_KEY, JSON.stringify(siwkAuth));
            } else {
              removePersisted(SIWK_STORAGE_KEY);
            }
          } else {
            removePersisted(SIWK_STORAGE_KEY);
          }
        } else {
          removePersisted(STORAGE_KEY);
          removePersisted(SIWK_STORAGE_KEY);
        }
      } catch (error) {
        console.error('Error saving wallet state:', error);
      }
    }
  }, [state]);

  // Re-hydrate Kaspa session when the provider appears (cross-subdomain cookie + empty local init).
  useEffect(() => {
    const target = pendingKaspaHydrateRef.current;
    if (!target || typeof window === 'undefined') return;

    const loadSiwk = (): SIWKAuthResult | undefined => {
      const siwkStored = getPersisted(SIWK_STORAGE_KEY);
      if (!siwkStored) return undefined;
      try {
        const siwkParsed = JSON.parse(siwkStored) as SIWKAuthResult;
        if (siwkParsed.expirationTime && !isSIWKExpired(siwkParsed.expirationTime)) {
          return siwkParsed;
        }
        removePersisted(SIWK_STORAGE_KEY);
      } catch {
        // ignore
      }
      return undefined;
    };

    let alive = true;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const tick = async () => {
      if (!alive || !pendingKaspaHydrateRef.current) return;
      const wp = getWalletProvider(target.provider);
      if (!wp) return;
      try {
        const addr = await getKaspaAddress(target.provider);
        if (!addr || !alive) return;
        if (intervalId) clearInterval(intervalId);
        pendingKaspaHydrateRef.current = null;
        const normalized = addr.startsWith('kaspa:') ? addr : `kaspa:${addr}`;
        const siwkAuth = loadSiwk();
        setState({
          isConnected: true,
          address: normalized,
          provider: target.provider,
          error: null,
          ...(siwkAuth && { siwkAuth }),
        });
      } catch {
        // keep polling
      }
    };

    void tick();
    intervalId = setInterval(() => void tick(), 600);
    const maxTimer = window.setTimeout(() => {
      if (intervalId) clearInterval(intervalId);
    }, 15_000);

    const onFocus = () => void tick();
    window.addEventListener('focus', onFocus);
    return () => {
      alive = false;
      if (intervalId) clearInterval(intervalId);
      window.clearTimeout(maxTimer);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  // KasWare: `window.ethereum` can mirror Kaspa account changes; briefly suppress wagmi reinject.
  // Kastle: do not listen here — the same `ethereum` object can emit when switching L1 even when
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
      // KasWare: shared `window.ethereum` can re-attach wagmi after L1 switch — tear down EVM bursts.
      // Kastle: never disconnect wagmi here; users often pair L1 Kastle with a separate EVM (WC / MetaMask).
      if (accounts.length > 0 && state.provider === 'kasware') {
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
      removePersisted(SIWK_STORAGE_KEY);
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

