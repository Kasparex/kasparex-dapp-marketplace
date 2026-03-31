'use client';

import { useState, useEffect } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useAccount } from 'wagmi';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { computeVBlogArticlePrice, VBLOG_DELETE_BASE_FEE_KAS, type VBlogAction, type VBlogPriceQuote, type VBlogPricingDraft } from '@/lib/vblog/pricing';
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
  deleteFee: number;
  isPremium: boolean;
  tier: UserTier;
  estimateQuote: (draft: VBlogPricingDraft, action: VBlogAction) => VBlogPriceQuote;
}

/**
 * Mock function to check NFT holdings
 * TODO: Replace with actual NFT checking logic
 */
async function checkNFTHoldings(walletAddress: string | null): Promise<string[]> {
  if (!walletAddress || typeof window === 'undefined') return [];

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
 * Hook to get vBlog pricing based on user's holdings
 */
export function useVBlogPricing() {
  const { state: kaspaState } = useKaspaWallet();
  const { address: evmAddress, isConnected: isEVMConnected } = useAccount();

  const walletAddress = kaspaState.address || (evmAddress ? `evm:${evmAddress}` : null);
  const isWalletConnected = kaspaState.isConnected || isEVMConnected;

  // Get real KREX balance from hook
  const { balance: krexBalance } = useKREXBalance();
  const hasKREXDiscount = krexBalance >= KREX_DISCOUNT_THRESHOLD;
  const discountPercent = hasKREXDiscount ? 80 : 0;

  // Initialize with default values - always return a stable object
  const [pricingInfo, setPricingInfo] = useState<PricingInfo>({
    createFee: 10.41,
    editFee: 2.41,
    deleteFee: VBLOG_DELETE_BASE_FEE_KAS,
    isPremium: false,
    tier: {
      hasKREXDiscount: false,
      hasNFTPerks: false,
      nftCollections: [],
    },
    estimateQuote: (draft, action) => computeVBlogArticlePrice(draft, action, 0),
  });

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      return;
    }

    // Use a flag to prevent state updates if component unmounts
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    const loadPricing = async () => {
      try {
        if (!walletAddress) {
          // CRITICAL: Only update state if it's different to prevent infinite loops
          // Check if current state is already the default before setting
          setPricingInfo(prev => {
            if (prev.createFee === 10.41 && prev.editFee === 2.41 && prev.deleteFee === VBLOG_DELETE_BASE_FEE_KAS && !prev.isPremium &&
              !prev.tier.hasKREXDiscount && !prev.tier.hasNFTPerks &&
              prev.tier.nftCollections.length === 0) {
              return prev; // Already at default, don't update
            }
            return {
              createFee: 10.41,
              editFee: 2.41,
              deleteFee: VBLOG_DELETE_BASE_FEE_KAS,
              isPremium: false,
              tier: {
                hasKREXDiscount: false,
                hasNFTPerks: false,
                nftCollections: [],
              },
              estimateQuote: (draft, action) => computeVBlogArticlePrice(draft, action, 0),
            };
          });
          return;
        }

        // Use setTimeout to defer async operations and prevent hook order issues
        timeoutId = setTimeout(async () => {
          try {
            const nftHoldings = await checkNFTHoldings(walletAddress).catch(() => [] as string[]);

            if (!isMounted) return;

            // Use KREX balance from hook (available in closure)
            const hasKREXDiscountInner = krexBalance >= KREX_DISCOUNT_THRESHOLD;
            const hasKREXPRIME = nftHoldings.includes(KREXPRIME_NFT_COLLECTION);
            const hasPIXELKREX = nftHoldings.includes(PIXELKREX_NFT_COLLECTION);
            const hasNFTPerks = hasKREXPRIME || hasPIXELKREX;
            const createQuote = computeVBlogArticlePrice({ title: '', description: '', content: '' }, 'create', hasKREXDiscountInner ? 80 : 0);
            const editQuote = computeVBlogArticlePrice({ title: '', description: '', content: '' }, 'edit', hasKREXDiscountInner ? 80 : 0);

            if (isMounted) {
              // CRITICAL: Only update if values actually changed to prevent infinite loops
              setPricingInfo(prev => {
                const newCreateFee = createQuote.totalKas;
                const newEditFee = editQuote.totalKas;

                if (prev.createFee === newCreateFee &&
                  prev.editFee === newEditFee &&
                  prev.isPremium === hasNFTPerks &&
                  prev.tier.hasKREXDiscount === hasKREXDiscountInner &&
                  prev.tier.hasNFTPerks === hasNFTPerks &&
                  JSON.stringify(prev.tier.nftCollections.sort()) === JSON.stringify(nftHoldings.sort())) {
                  return prev; // No changes, don't update
                }

                return {
                  createFee: newCreateFee,
                  editFee: newEditFee,
                  deleteFee: VBLOG_DELETE_BASE_FEE_KAS,
                  isPremium: hasNFTPerks,
                  tier: {
                    hasKREXDiscount: hasKREXDiscountInner,
                    hasNFTPerks,
                    nftCollections: nftHoldings,
                  },
                  estimateQuote: (draft, action) =>
                    computeVBlogArticlePrice(draft, action, hasKREXDiscountInner ? 80 : 0),
                };
              });
            }
          } catch (error) {
            // Silently fail and use default pricing
            if (isMounted) {
              console.error('Error loading pricing info:', error);
              setPricingInfo(prev => {
                if (prev.createFee === 10.41 && prev.editFee === 2.41 && prev.deleteFee === VBLOG_DELETE_BASE_FEE_KAS && !prev.isPremium &&
                  !prev.tier.hasKREXDiscount && !prev.tier.hasNFTPerks &&
                  prev.tier.nftCollections.length === 0) {
                  return prev; // Already at default
                }
                return {
                  createFee: 10.41,
                  editFee: 2.41,
                  deleteFee: VBLOG_DELETE_BASE_FEE_KAS,
                  isPremium: false,
                  tier: {
                    hasKREXDiscount: false,
                    hasNFTPerks: false,
                    nftCollections: [],
                  },
                  estimateQuote: (draft, action) =>
                    computeVBlogArticlePrice(draft, action, 0),
                };
              });
            }
          }
        }, 0);
      } catch (error) {
        // Ultimate fallback
        if (isMounted) {
          setPricingInfo(prev => {
            if (prev.createFee === 10.41 && prev.editFee === 2.41 && prev.deleteFee === VBLOG_DELETE_BASE_FEE_KAS && !prev.isPremium &&
              !prev.tier.hasKREXDiscount && !prev.tier.hasNFTPerks &&
              prev.tier.nftCollections.length === 0) {
              return prev; // Already at default
            }
            return {
              createFee: 10.41,
              editFee: 2.41,
              deleteFee: VBLOG_DELETE_BASE_FEE_KAS,
              isPremium: false,
              tier: {
                hasKREXDiscount: false,
                hasNFTPerks: false,
                nftCollections: [],
              },
              estimateQuote: (draft, action) => computeVBlogArticlePrice(draft, action, 0),
            };
          });
        }
      }
    };

    loadPricing();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [walletAddress, isWalletConnected, krexBalance, discountPercent]);

  return pricingInfo;
}

