/**
 * React Hook for KasWare Wallet
 * 
 * Provides easy access to KasWare wallet functionality
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getKasWare,
  isKasWareInstalled,
  isKasWareConnected,
  getKRC20Balance,
  getUtxoEntries,
  sendKaspa,
  signPskt,
  getNetwork,
  getVersion,
  createKRC20Order,
  buyKRC20Token,
  cancelKRC20Order,
  signKRC20Transaction,
  signMessage,
} from '@/lib/kaspa/kasware';
import type { KasWareAPI } from '@/lib/kaspa/kasware';

export interface UseKasWareReturn {
  // Wallet state
  kasware: KasWareAPI | null;
  isInstalled: boolean;
  isConnected: boolean;
  address: string | null;
  balance: string | null;
  network: string | null;
  version: string | null;
  
  // KRC-20 tokens
  krc20Tokens: Array<{ tick: string; amount: string | number; [key: string]: any }>;
  krc20TokensLoading: boolean;
  
  // UTXO entries
  utxoEntries: Array<{ amount: number | string; [key: string]: any }>;
  utxoEntriesLoading: boolean;
  
  // Methods
  refreshBalance: () => Promise<void>;
  refreshKRC20Tokens: () => Promise<void>;
  refreshUtxoEntries: () => Promise<void>;
  refreshNetwork: () => Promise<void>;
  refreshVersion: () => Promise<void>;
  
  // Transaction methods
  sendTransaction: (toAddress: string, sompi: number | string, options?: Record<string, any>) => Promise<string>;
  signTransaction: (txJsonString: string, options?: Record<string, any>) => Promise<string>;
  
  // KRC-20 methods
  createOrder: (params: {
    krc20Tick: string;
    krc20Amount: string | number;
    kasAmount: string | number;
    psktExtraOutput?: string;
    priorityFee?: number | string;
  }) => Promise<string>;
  buyToken: (params: {
    txJsonString: string;
    extraOutput?: string;
    priorityFee?: number | string;
  }) => Promise<string>;
  cancelOrder: (params: {
    krc20Tick: string;
    txJsonString: string;
    sendCommitTxId?: string;
  }) => Promise<string>;
  signKRC20Tx: (inscribeJsonString: string, type: string, destAddr: string, priorityFee?: number | string) => Promise<string>;
  
  // Message signing
  signMsg: (message: string, type?: string) => Promise<string>;
  
  // Error handling
  error: Error | null;
}

/**
 * Hook to interact with KasWare wallet
 * 
 * @example
 * ```tsx
 * const { isInstalled, isConnected, address, balance, sendTransaction } = useKasWare();
 * 
 * if (!isInstalled) {
 *   return <div>Please install KasWare wallet</div>;
 * }
 * 
 * const handleSend = async () => {
 *   try {
 *     const txHash = await sendTransaction('kaspa:...', 100000000); // 1 KAS
 *     console.log('Transaction sent:', txHash);
 *   } catch (error) {
 *     console.error('Failed to send transaction:', error);
 *   }
 * };
 * ```
 */
export function useKasWare(): UseKasWareReturn {
  const [kasware, setKasware] = useState<KasWareAPI | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [version, setVersion] = useState<string | null>(null);
  const [krc20Tokens, setKrc20Tokens] = useState<Array<{ tick: string; amount: string | number; [key: string]: any }>>([]);
  const [krc20TokensLoading, setKrc20TokensLoading] = useState(false);
  const [utxoEntries, setUtxoEntries] = useState<Array<{ amount: number | string; [key: string]: any }>>([]);
  const [utxoEntriesLoading, setUtxoEntriesLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize wallet connection status
  useEffect(() => {
    const checkWallet = async () => {
      const installed = isKasWareInstalled();
      setIsInstalled(installed);
      
      if (installed) {
        const wallet = getKasWare();
        setKasware(wallet);
        
        const connected = isKasWareConnected();
        setIsConnected(connected);
        
        if (connected && wallet) {
          try {
            const addr = await wallet.getAddress();
            setAddress(addr);
            
            // Fetch initial data
            await refreshBalance();
            await refreshNetwork();
            await refreshVersion();
          } catch (err) {
            console.error('Error initializing wallet:', err);
            setError(err instanceof Error ? err : new Error('Unknown error'));
          }
        }
      }
    };

    checkWallet();

    // Listen for account changes
    if (typeof window !== 'undefined') {
      const wallet = getKasWare();
      if (wallet && typeof wallet.on === 'function') {
        const handleAccountsChanged = (accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            setAddress(accounts[0]);
            setIsConnected(true);
            refreshBalance();
            refreshKRC20Tokens();
            refreshUtxoEntries();
          } else {
            setAddress(null);
            setIsConnected(false);
            setBalance(null);
            setKrc20Tokens([]);
            setUtxoEntries([]);
          }
        };

        wallet.on('accountsChanged', handleAccountsChanged);

        return () => {
          if (wallet && typeof wallet.removeListener === 'function') {
            wallet.removeListener('accountsChanged', handleAccountsChanged);
          }
        };
      }
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!kasware || !isConnected) return;
    
    try {
      const balanceResult = await kasware.getBalance();
      if (balanceResult !== null && balanceResult !== undefined) {
        let balanceValue: string | number;
        
        if (typeof balanceResult === 'object' && 'balance' in balanceResult) {
          balanceValue = balanceResult.balance;
        } else if (typeof balanceResult === 'object' && 'amount' in balanceResult) {
          balanceValue = (balanceResult as any).amount;
        } else if (typeof balanceResult === 'object' && 'value' in balanceResult) {
          balanceValue = (balanceResult as any).value;
        } else {
          balanceValue = balanceResult;
        }
        
        const balanceNum = typeof balanceValue === 'string' ? parseFloat(balanceValue) : balanceValue;
        if (!isNaN(balanceNum) && balanceNum >= 0) {
          const kasBalance = balanceNum > 1000000 
            ? (balanceNum / 100000000).toFixed(2) 
            : balanceNum.toFixed(2);
          setBalance(kasBalance);
        }
      }
    } catch (err) {
      console.error('Error refreshing balance:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    }
  }, [kasware, isConnected]);

  const refreshKRC20Tokens = useCallback(async () => {
    if (!isConnected) {
      setKrc20Tokens([]);
      return;
    }
    
    setKrc20TokensLoading(true);
    try {
      const tokens = await getKRC20Balance();
      setKrc20Tokens(tokens || []);
      setError(null);
    } catch (err) {
      console.error('Error refreshing KRC-20 tokens:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setKrc20Tokens([]);
    } finally {
      setKrc20TokensLoading(false);
    }
  }, [isConnected]);

  const refreshUtxoEntries = useCallback(async () => {
    if (!isConnected) {
      setUtxoEntries([]);
      return;
    }
    
    setUtxoEntriesLoading(true);
    try {
      const entries = await getUtxoEntries();
      setUtxoEntries(entries || []);
      setError(null);
    } catch (err) {
      console.error('Error refreshing UTXO entries:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setUtxoEntries([]);
    } finally {
      setUtxoEntriesLoading(false);
    }
  }, [isConnected]);

  const refreshNetwork = useCallback(async () => {
    if (!isConnected) return;
    
    try {
      const net = await getNetwork();
      setNetwork(net);
      setError(null);
    } catch (err) {
      console.error('Error refreshing network:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    }
  }, [isConnected]);

  const refreshVersion = useCallback(async () => {
    if (!isConnected) return;
    
    try {
      const ver = await getVersion();
      setVersion(ver);
      setError(null);
    } catch (err) {
      console.error('Error refreshing version:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    }
  }, [isConnected]);

  const sendTransaction = useCallback(async (
    toAddress: string,
    sompi: number | string,
    options?: Record<string, any>
  ): Promise<string> => {
    if (!isConnected) {
      throw new Error('Wallet is not connected');
    }
    return await sendKaspa(toAddress, sompi, options);
  }, [isConnected]);

  const signTransaction = useCallback(async (
    txJsonString: string,
    options?: Record<string, any>
  ): Promise<string> => {
    if (!isConnected) {
      throw new Error('Wallet is not connected');
    }
    return await signPskt(txJsonString, options);
  }, [isConnected]);

  const createOrder = useCallback(async (params: {
    krc20Tick: string;
    krc20Amount: string | number;
    kasAmount: string | number;
    psktExtraOutput?: string;
    priorityFee?: number | string;
  }): Promise<string> => {
    if (!isConnected) {
      throw new Error('Wallet is not connected');
    }
    return await createKRC20Order(params);
  }, [isConnected]);

  const buyToken = useCallback(async (params: {
    txJsonString: string;
    extraOutput?: string;
    priorityFee?: number | string;
  }): Promise<string> => {
    if (!isConnected) {
      throw new Error('Wallet is not connected');
    }
    return await buyKRC20Token(params);
  }, [isConnected]);

  const cancelOrder = useCallback(async (params: {
    krc20Tick: string;
    txJsonString: string;
    sendCommitTxId?: string;
  }): Promise<string> => {
    if (!isConnected) {
      throw new Error('Wallet is not connected');
    }
    return await cancelKRC20Order(params);
  }, [isConnected]);

  const signKRC20Tx = useCallback(async (
    inscribeJsonString: string,
    type: string,
    destAddr: string,
    priorityFee?: number | string
  ): Promise<string> => {
    if (!isConnected) {
      throw new Error('Wallet is not connected');
    }
    return await signKRC20Transaction(inscribeJsonString, type, destAddr, priorityFee);
  }, [isConnected]);

  const signMsg = useCallback(async (message: string, type?: string): Promise<string> => {
    if (!isConnected) {
      throw new Error('Wallet is not connected');
    }
    return await signMessage(message, type);
  }, [isConnected]);

  return {
    kasware,
    isInstalled,
    isConnected,
    address,
    balance,
    network,
    version,
    krc20Tokens,
    krc20TokensLoading,
    utxoEntries,
    utxoEntriesLoading,
    refreshBalance,
    refreshKRC20Tokens,
    refreshUtxoEntries,
    refreshNetwork,
    refreshVersion,
    sendTransaction,
    signTransaction,
    createOrder,
    buyToken,
    cancelOrder,
    signKRC20Tx,
    signMsg,
    error,
  };
}

