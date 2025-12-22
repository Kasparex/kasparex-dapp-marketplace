/**
 * Hook for fetching Kaspa wallet balance
 * 
 * Uses the SDK wallet connection to fetch balance from connected wallet
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { getBalanceInKas } from '@/lib/kaspa/api';
import { getWalletProvider } from '@/lib/kaspa/wallet';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';

export interface UseKaspaBalanceReturn {
  balance: string | null;
  balanceInKas: number | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch and manage Kaspa wallet balance
 */
export function useKaspaBalance(): UseKaspaBalanceReturn {
  const { state } = useKaspaWallet();
  const [balance, setBalance] = useState<string | null>(null);
  const [balanceInKas, setBalanceInKas] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!state.isConnected || !state.address || !state.provider) {
      console.log('Balance fetch skipped - not connected:', { 
        isConnected: state.isConnected, 
        address: state.address, 
        provider: state.provider 
      });
      setBalance(null);
      setBalanceInKas(null);
      setIsLoading(false);
      return;
    }

    console.log('Fetching balance for:', { address: state.address, provider: state.provider });
    setIsLoading(true);
    setError(null);

    try {
      // Try to get balance from wallet provider first
      const walletProvider = getWalletProvider(state.provider);
      
      if (walletProvider && walletProvider.getBalance) {
        try {
          console.log('Calling walletProvider.getBalance()...');
          const balanceResult = await walletProvider.getBalance();
          console.log('Balance result from wallet:', balanceResult);
          console.log('Balance result type:', typeof balanceResult);
          if (balanceResult && typeof balanceResult === 'object') {
            console.log('Balance result keys:', Object.keys(balanceResult));
            console.log('Balance result full object:', JSON.stringify(balanceResult, null, 2));
          }
          
          if (balanceResult !== null && balanceResult !== undefined) {
            let balanceValue: string | number | null = null;
            
            // Handle different response formats
            if (typeof balanceResult === 'string' || typeof balanceResult === 'number') {
              balanceValue = balanceResult;
              console.log('Balance is primitive:', balanceValue);
            } else if (balanceResult && typeof balanceResult === 'object') {
              const resultObj = balanceResult as Record<string, any>;
              // Try common keys
              if ('balance' in resultObj) {
                balanceValue = resultObj.balance;
                console.log('Found balance key:', balanceValue);
              } else if ('amount' in resultObj) {
                balanceValue = resultObj.amount;
                console.log('Found amount key:', balanceValue);
              } else if ('value' in resultObj) {
                balanceValue = resultObj.value;
                console.log('Found value key:', balanceValue);
              } else if ('total' in resultObj) {
                balanceValue = resultObj.total;
                console.log('Found total key:', balanceValue);
              } else if ('kas' in resultObj) {
                balanceValue = resultObj.kas;
                console.log('Found kas key:', balanceValue);
              } else {
                // Try to get first numeric value from object
                const keys = Object.keys(resultObj);
                for (const key of keys) {
                  const val = resultObj[key];
                  if (typeof val === 'number' || (typeof val === 'string' && !isNaN(parseFloat(val)))) {
                    balanceValue = val;
                    console.log(`Found numeric value in key "${key}":`, balanceValue);
                    break;
                  }
                }
                if (balanceValue === null) {
                  console.warn('Could not extract balance from object:', resultObj);
                }
              }
            }

            if (balanceValue !== null && balanceValue !== undefined && balanceValue !== '') {
              const balanceNum = typeof balanceValue === 'string' ? parseFloat(balanceValue) : balanceValue;
              
              if (!isNaN(balanceNum) && balanceNum >= 0) {
                // Convert from sompis to KAS
                // KasWare and other wallets return balance in sompis (smallest unit)
                const strValue = balanceNum.toString();
                const hasDecimals = strValue.includes('.');
                const decimalPlaces = hasDecimals ? strValue.split('.')[1]?.length || 0 : 0;
                
                let kasBalance: string;
                let kasBalanceNum: number;
                
                // If balance < 0.01 and has > 6 decimal places, likely already in KAS
                if (balanceNum < 0.01 && decimalPlaces > 6) {
                  kasBalance = balanceNum.toFixed(8);
                  kasBalanceNum = balanceNum;
                } else {
                  // Otherwise, assume it's in sompis and convert to KAS
                  kasBalanceNum = balanceNum / 100000000;
                  kasBalance = kasBalanceNum.toFixed(2);
                }
                
                setBalance(kasBalance);
                setBalanceInKas(kasBalanceNum);
                setIsLoading(false);
                console.log(`✓ Balance fetched successfully: ${kasBalance} KAS`);
                return;
              }
            }
          }
        } catch (walletError) {
          console.warn('Wallet getBalance() failed, trying API fallback:', walletError);
        }
      }

      // Fallback to API if wallet method doesn't exist or failed
      if (state.address) {
        console.log('Using API fallback for balance...');
        const balanceInKasValue = await getBalanceInKas(state.address);
        const balanceStr = balanceInKasValue.toFixed(2);
        setBalance(balanceStr);
        setBalanceInKas(balanceInKasValue);
        console.log(`✓ Balance fetched from API: ${balanceStr} KAS`);
      }
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
      setBalance(null);
      setBalanceInKas(null);
    } finally {
      setIsLoading(false);
    }
  }, [state.isConnected, state.address, state.provider]);

  // Fetch balance when connected
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Auto-refresh balance every 30 seconds when connected
  useEffect(() => {
    if (!state.isConnected) return;

    const interval = setInterval(() => {
      fetchBalance();
    }, 30000);

    return () => clearInterval(interval);
  }, [state.isConnected, fetchBalance]);

  return {
    balance,
    balanceInKas,
    isLoading,
    error,
    refresh: fetchBalance,
  };
}

