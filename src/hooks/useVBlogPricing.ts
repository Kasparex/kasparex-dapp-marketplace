'use client';

import { useState, useEffect } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useAccount } from 'wagmi';
import { getKRC20Balance } from '@/lib/kaspa/kasware';

const KREX_TICKER = 'KREX';
const KREX_DISCOUNT_THRESHOLD = 10_000_000; // 10M KREX
const KREXPRIME_NFT_COLLECTION = 'KREXPRIME';
const PIXELKREX_NFT_COLLECTION = 'PIXELKREX';

interface UserTier {
  hasKREXDiscount: boolean;
  hasNFTPerks: boolean;
  nftCollections: string[];
}

interface PricingInfo {
  createFee: number;
  editFee: number;
  isPremium: boolean;
  tier: UserTier;
}

/**
 * Mock function to check NFT holdings
 * TODO: Replace with actual NFT checking logic
 */
async function checkNFTHoldings(walletAddress: string | null): Promise<string[]> {
  if (!walletAddress) return [];
  
  // Mock: Check localStorage for NFT holdings
  // In production, this would query the NFT contracts
  try {
    const stored = localStorage.getItem(`nft_holdings_${walletAddress.toLowerCase()}`);
    if (stored) {
      return JSON.parse(stored);
    }
    
    // For testing, return empty array
    return [];
  } catch {
    return [];
  }
}

/**
 * Mock function to get KREX balance
 * TODO: Replace with actual KREX balance checking
 */
async function getKREXBalance(walletAddress: string | null): Promise<number> {
  if (!walletAddress) return 0;
  
  try {
    // Try to get from KasWare if it's a Kaspa wallet
    if (walletAddress.startsWith('kaspa:')) {
      const tokens = await getKRC20Balance();
      const krexToken = tokens.find((t: any) => t.tick === KREX_TICKER);
      if (krexToken) {
        return typeof krexToken.amount === 'string' 
          ? parseFloat(krexToken.amount) 
          : krexToken.amount;
      }
    }
    
    // Mock balance for testing (can be stored in localStorage)
    const stored = localStorage.getItem(`krex_balance_${walletAddress.toLowerCase()}`);
    if (stored) {
      return parseFloat(stored);
    }
    
    // Default mock balance for testing
    return 0;
  } catch (error) {
    console.error('Error getting KREX balance:', error);
    return 0;
  }
}

/**
 * Hook to get vBlog pricing based on user's holdings
 */
export function useVBlogPricing() {
  const { state: kaspaState } = useKaspaWallet();
  const { address: evmAddress, isConnected: isEVMConnected } = useAccount();
  
  const walletAddress = kaspaState.address || (evmAddress ? `evm:${evmAddress}` : null);
  const isWalletConnected = kaspaState.isConnected || isEVMConnected;

  const pricing = useMemo(async (): Promise<PricingInfo> => {
    if (!walletAddress) {
      return {
        createFee: 20,
        editFee: 5,
        isPremium: false,
        tier: {
          hasKREXDiscount: false,
          hasNFTPerks: false,
          nftCollections: [],
        },
      };
    }

    const [krexBalance, nftHoldings] = await Promise.all([
      getKREXBalance(walletAddress),
      checkNFTHoldings(walletAddress),
    ]);

    const hasKREXDiscount = krexBalance >= KREX_DISCOUNT_THRESHOLD;
    const hasKREXPRIME = nftHoldings.includes(KREXPRIME_NFT_COLLECTION);
    const hasPIXELKREX = nftHoldings.includes(PIXELKREX_NFT_COLLECTION);
    const hasNFTPerks = hasKREXPRIME || hasPIXELKREX;

    return {
      createFee: hasKREXDiscount ? 5 : 20,
      editFee: hasKREXDiscount ? 1 : 5,
      isPremium: hasNFTPerks,
      tier: {
        hasKREXDiscount,
        hasNFTPerks,
        nftCollections: nftHoldings,
      },
    };
  }, [walletAddress, isWalletConnected]);

  // Since useMemo doesn't work with async, we'll use a different approach
  const [pricingInfo, setPricingInfo] = useState<PricingInfo>({
    createFee: 20,
    editFee: 5,
    isPremium: false,
    tier: {
      hasKREXDiscount: false,
      hasNFTPerks: false,
      nftCollections: [],
    },
  });

  useEffect(() => {
    if (!walletAddress) {
      setPricingInfo({
        createFee: 20,
        editFee: 5,
        isPremium: false,
        tier: {
          hasKREXDiscount: false,
          hasNFTPerks: false,
          nftCollections: [],
        },
      });
      return;
    }

    Promise.all([
      getKREXBalance(walletAddress),
      checkNFTHoldings(walletAddress),
    ]).then(([krexBalance, nftHoldings]) => {
      const hasKREXDiscount = krexBalance >= KREX_DISCOUNT_THRESHOLD;
      const hasKREXPRIME = nftHoldings.includes(KREXPRIME_NFT_COLLECTION);
      const hasPIXELKREX = nftHoldings.includes(PIXELKREX_NFT_COLLECTION);
      const hasNFTPerks = hasKREXPRIME || hasPIXELKREX;

      setPricingInfo({
        createFee: hasKREXDiscount ? 5 : 20,
        editFee: hasKREXDiscount ? 1 : 5,
        isPremium: hasNFTPerks,
        tier: {
          hasKREXDiscount,
          hasNFTPerks,
          nftCollections: nftHoldings,
        },
      });
    });
  }, [walletAddress, isWalletConnected]);

  return pricingInfo;
}

