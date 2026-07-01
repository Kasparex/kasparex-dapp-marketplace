'use client';

import { useState, useEffect } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useAccount } from 'wagmi';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import {
  computeVBlogArticlePrice,
  VBLOG_DELETE_BASE_FEE_KAS,
  type VBlogAction,
  type VBlogPriceQuote,
  type VBlogPricingDraft,
} from '@/lib/vblog/pricing';
import { krexTierDiscountPercent } from '@/lib/chronicles/vault/pricing';
import type { KREXTier } from '@/lib/rewards/types';

const KREXPRIME_NFT_COLLECTION = 'KREXPRIME';
const PIXELKREX_NFT_COLLECTION = 'PIXELKREX';

interface UserTier {
  krexTier: KREXTier;
  krexDiscountPercent: number;
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

async function checkNFTHoldings(walletAddress: string | null): Promise<string[]> {
  if (!walletAddress || typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(`nft_holdings_${walletAddress.toLowerCase()}`);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch {
    return [];
  }
}

export function useVBlogPricing() {
  const { state: kaspaState } = useKaspaWallet();
  const { address: evmAddress, isConnected: isEVMConnected } = useAccount();

  const walletAddress = kaspaState.address || (evmAddress ? `evm:${evmAddress}` : null);
  const isWalletConnected = kaspaState.isConnected || isEVMConnected;

  const { balance: krexBalance, tier: krexTier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const krexDiscountPercent = krexTierDiscountPercent(krexTier);

  const [pricingInfo, setPricingInfo] = useState<PricingInfo>({
    createFee: 10.41,
    editFee: 0,
    deleteFee: VBLOG_DELETE_BASE_FEE_KAS,
    isPremium: false,
    tier: {
      krexTier: 'Tier0',
      krexDiscountPercent: 0,
      hasKREXDiscount: false,
      hasNFTPerks: false,
      nftCollections: [],
    },
    estimateQuote: (draft, action) =>
      computeVBlogArticlePrice(draft, action, 0, { tier: krexTier, nft: nftStatus }),
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    const loadPricing = async () => {
      try {
        const discountPct = krexTierDiscountPercent(krexTier);

        if (!walletAddress) {
          setPricingInfo((prev) => {
            if (
              prev.createFee === 10.41 &&
              prev.editFee === 2.41 &&
              prev.deleteFee === VBLOG_DELETE_BASE_FEE_KAS &&
              !prev.isPremium &&
              !prev.tier.hasKREXDiscount &&
              !prev.tier.hasNFTPerks &&
              prev.tier.nftCollections.length === 0
            ) {
              return prev;
            }
            return {
              createFee: 10.41,
              editFee: 0,
              deleteFee: VBLOG_DELETE_BASE_FEE_KAS,
              isPremium: false,
              tier: {
                krexTier: 'Tier0',
                krexDiscountPercent: 0,
                hasKREXDiscount: false,
                hasNFTPerks: false,
                nftCollections: [],
              },
              estimateQuote: (draft, action) =>
                computeVBlogArticlePrice(draft, action, 0, { tier: krexTier, nft: nftStatus }),
            };
          });
          return;
        }

        timeoutId = setTimeout(async () => {
          try {
            const nftHoldings = await checkNFTHoldings(walletAddress).catch(() => [] as string[]);

            if (!isMounted) return;

            const hasKREXPRIME = nftHoldings.includes(KREXPRIME_NFT_COLLECTION);
            const hasPIXELKREX = nftHoldings.includes(PIXELKREX_NFT_COLLECTION);
            const hasNFTPerks = hasKREXPRIME || hasPIXELKREX;
            const createQuote = computeVBlogArticlePrice(
              { title: '', description: '', content: '' },
              'create',
              discountPct,
            );
            const editQuote = computeVBlogArticlePrice(
              { title: '', description: '', content: '' },
              'edit',
              discountPct,
            );

            if (isMounted) {
              setPricingInfo((prev) => {
                const newCreateFee = createQuote.totalKas;
                const newEditFee = editQuote.totalKas;
                const hasDiscount = discountPct > 0;

                if (
                  prev.createFee === newCreateFee &&
                  prev.editFee === newEditFee &&
                  prev.isPremium === hasNFTPerks &&
                  prev.tier.hasKREXDiscount === hasDiscount &&
                  prev.tier.krexDiscountPercent === discountPct &&
                  prev.tier.krexTier === krexTier &&
                  prev.tier.hasNFTPerks === hasNFTPerks &&
                  JSON.stringify(prev.tier.nftCollections.sort()) === JSON.stringify(nftHoldings.sort())
                ) {
                  return prev;
                }

                return {
                  createFee: newCreateFee,
                  editFee: newEditFee,
                  deleteFee: VBLOG_DELETE_BASE_FEE_KAS,
                  isPremium: hasNFTPerks,
                  tier: {
                    krexTier,
                    krexDiscountPercent: discountPct,
                    hasKREXDiscount: hasDiscount,
                    hasNFTPerks,
                    nftCollections: nftHoldings,
                  },
                  estimateQuote: (draft, action) =>
                    computeVBlogArticlePrice(draft, action, discountPct, {
                      tier: krexTier,
                      nft: nftStatus,
                    }),
                };
              });
            }
          } catch (error) {
            if (isMounted) {
              console.error('Error loading pricing info:', error);
            }
          }
        }, 0);
      } catch (error) {
        if (isMounted) {
          console.error('Error loading pricing info:', error);
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
  }, [walletAddress, isWalletConnected, krexBalance, krexTier, krexDiscountPercent, nftStatus]);

  return pricingInfo;
}
