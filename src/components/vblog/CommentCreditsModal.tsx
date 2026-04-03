'use client';

import { useState, useEffect } from 'react';
import { useCommentCredits } from '@/hooks/useCommentCredits';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useAccount } from 'wagmi';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import { kasToSompis } from '@/lib/kaspa/api';
import { getErrorMessage } from '@/lib/utils';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { TokenLogoImage } from '@/components/ui/TokenLogoImage';
const KREX_UNLIMITED_THRESHOLD = 100_000_000; // 100M KREX
const KREXPRIME_NFT_COLLECTION = 'KREXPRIME';
const PIXELKREX_NFT_COLLECTION = 'PIXELKREX';
const RARE_NFT_IDS = {
  KREXPRIME: [345],
  PIXELKREX: [515],
};

interface NFTStatus {
  hasStandardNFT: boolean;
  hasDiamondNFT: boolean;
  hasRareNFT: boolean;
  collections: string[];
}

interface CommentCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CreditPackage {
  credits: number;
  basePrice: number; // in KAS
}

const CREDIT_PACKAGES: CreditPackage[] = [
  { credits: 10, basePrice: 10 },
  { credits: 25, basePrice: 25 },
  { credits: 50, basePrice: 50 },
  { credits: 100, basePrice: 100 },
];

/**
 * Mock function to check NFT holdings with detailed status
 */
async function checkNFTStatus(walletAddress: string | null): Promise<NFTStatus> {
  if (!walletAddress || typeof window === 'undefined') {
    return {
      hasStandardNFT: false,
      hasDiamondNFT: false,
      hasRareNFT: false,
      collections: [],
    };
  }

  try {
    const stored = localStorage.getItem(`nft_status_${walletAddress.toLowerCase()}`);
    if (stored) {
      return JSON.parse(stored);
    }

    // For testing, return empty status
    return {
      hasStandardNFT: false,
      hasDiamondNFT: false,
      hasRareNFT: false,
      collections: [],
    };
  } catch {
    return {
      hasStandardNFT: false,
      hasDiamondNFT: false,
      hasRareNFT: false,
      collections: [],
    };
  }
}


export function CommentCreditsModal({ isOpen, onClose }: CommentCreditsModalProps) {
  const { state: kaspaState } = useKaspaWallet();
  const { address: evmAddress, isConnected: isEVMConnected } = useAccount();
  const walletAddress = kaspaState.address || (evmAddress ? `evm:${evmAddress}` : null);
  const isWalletConnected = kaspaState.isConnected || isEVMConnected;

  const { purchaseCredits, credits } = useCommentCredits(walletAddress);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage>(CREDIT_PACKAGES[0]);
  const [nftStatus, setNftStatus] = useState<NFTStatus>({
    hasStandardNFT: false,
    hasDiamondNFT: false,
    hasRareNFT: false,
    collections: [],
  });
  
  // Get real KREX balance from hook
  const { balance: krexBalance } = useKREXBalance();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // Treasury address for comment credit purchases
  // TODO: Replace with actual treasury address from config
  const COMMENT_CREDITS_TREASURY = 'kaspa:qqd36zqt94yr23cmjj73d34e2lc05ltd9duw582s303m30ux567ps9ljnhp6y';

  useEffect(() => {
    if (!isOpen || !walletAddress) return;

    const loadStatus = async () => {
      const nft = await checkNFTStatus(walletAddress);
      setNftStatus(nft);
    };

    loadStatus();
  }, [isOpen, walletAddress]);

  // Calculate discount based on NFT status
  const getDiscount = (): number => {
    if (nftStatus.hasRareNFT) return 30;
    if (nftStatus.hasDiamondNFT) return 20;
    if (nftStatus.hasStandardNFT) return 10;
    return 0;
  };

  const discount = getDiscount();
  const hasUnlimitedCredits = krexBalance >= KREX_UNLIMITED_THRESHOLD;
  const finalPrice = hasUnlimitedCredits ? 0 : selectedPackage.basePrice * (1 - discount / 100);
  const creditsToReceive = selectedPackage.credits;

  const handlePurchase = async () => {
    if (!walletAddress) {
      setError('Wallet not connected');
      return;
    }

    if (hasUnlimitedCredits) {
      setError('You already have unlimited credits with 100M+ KREX!');
      return;
    }

    if (finalPrice <= 0) {
      setError('Invalid purchase amount');
      return;
    }

    // Only allow Kaspa wallet for now (EVM support can be added later)
    if (!kaspaState.isConnected || !kaspaState.address || !kaspaState.provider) {
      setError('Please connect your Kaspa wallet to purchase credits');
      return;
    }
    if (kaspaState.provider !== 'kasware' && kaspaState.provider !== 'kastle') {
      setError('Comment credits purchase requires KasWare or Kastle on L1');
      return;
    }

    setIsPurchasing(true);
    setError(null);
    setTxHash(null);
    setIsConfirming(false);

    try {
      // Convert KAS to sompis
      const sompiAmount = kasToSompis(finalPrice);
      
      // Remove 'kaspa:' prefix if present
      const treasuryAddress = COMMENT_CREDITS_TREASURY.replace(/^kaspa:/, '');

      // Send transaction to treasury
      setIsConfirming(true);
      const sent = await sendKaspaTransaction(kaspaState.provider, {
        to: treasuryAddress,
        amount: String(sompiAmount),
        note: `Comment Credits Purchase: ${creditsToReceive} credits`,
      });
      if (sent.status === 'failed') {
        throw new Error(sent.error || 'Transaction failed');
      }
      const hash = sent.txHash;
      setTxHash(hash);
      
      // Wait a moment for transaction to be processed
      // In production, you might want to poll for confirmation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update credits after successful transaction
      const success = await purchaseCredits(creditsToReceive, finalPrice, hash);
      if (success) {
        // Close modal after a short delay to show success
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError('Failed to update credits. Transaction succeeded but credit update failed.');
      }
    } catch (err) {
      console.error('Error purchasing credits:', err);
      const errorMessage = getErrorMessage(err, 'Failed to purchase credits');
      
      // Handle specific error cases
      if (errorMessage.includes('user rejected') || errorMessage.includes('rejected')) {
        setError('Transaction was cancelled');
      } else if (errorMessage.includes('insufficient')) {
        setError('Insufficient balance. Please check your KAS balance.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsPurchasing(false);
      setIsConfirming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Purchase Comment Credits
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Buy credits to unlock commenting on articles and dApps
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!isWalletConnected ? (
            <div className="text-center py-8">
              <p className="text-base text-zinc-600 dark:text-zinc-400">
                Please connect your wallet to purchase credits
              </p>
            </div>
          ) : (
            <>
              {/* NFT Badges */}
              {(nftStatus.hasStandardNFT || nftStatus.hasDiamondNFT || nftStatus.hasRareNFT || hasUnlimitedCredits) && (
                <div className="mb-6 space-y-2">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                    Your Benefits
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {hasUnlimitedCredits && (
                      <div className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        Unlimited Credits
                      </div>
                    )}
                    {nftStatus.hasRareNFT && (
                      <div className="px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        Rare NFT - 30% Off
                      </div>
                    )}
                    {nftStatus.hasDiamondNFT && (
                      <div className="px-3 py-1.5 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5">
                        <span>💎</span>
                        Diamond NFT - 20% Off
                      </div>
                    )}
                    {nftStatus.hasStandardNFT && (
                      <div className="px-3 py-1.5 bg-zinc-700 dark:bg-zinc-600 text-white rounded-lg text-xs font-medium flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Standard NFT - 10% Off
                      </div>
                    )}
                  </div>
                </div>
              )}

              {hasUnlimitedCredits ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                    Unlimited Credits Unlocked!
                  </h3>
                  <p className="text-base text-zinc-600 dark:text-zinc-400 mb-4">
                    You hold 100M+ KREX tokens, giving you unlimited comment credits.
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-500">
                    Current balance: {krexBalance.toLocaleString()} KREX
                  </p>
                </div>
              ) : (
                <>
                  {/* Credit Packages */}
                  <div className="mb-6">
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                      Select Package
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {CREDIT_PACKAGES.map((pkg) => {
                        const packagePrice = pkg.basePrice * (1 - discount / 100);
                        const isSelected = selectedPackage.credits === pkg.credits;
                        return (
                          <button
                            key={pkg.credits}
                            onClick={() => setSelectedPackage(pkg)}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              isSelected
                                ? 'border-[#02abb8] bg-[#02abb8]/10 dark:bg-[#02abb8]/20'
                                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                            }`}
                          >
                            <div className="text-center">
                              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                                {pkg.credits}
                              </div>
                              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                                credits
                              </div>
                              <div className="mt-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                                {packagePrice.toFixed(2)} KAS
                              </div>
                              {discount > 0 && (
                                <div className="text-xs text-zinc-500 dark:text-zinc-400 line-through mt-1">
                                  {pkg.basePrice.toFixed(2)} KAS
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pricing Summary */}
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 mb-6">
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                      Purchase Summary
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-zinc-600 dark:text-zinc-400">Credits:</span>
                        <span className="text-zinc-900 dark:text-zinc-100 font-medium">{creditsToReceive}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600 dark:text-zinc-400">Base Price:</span>
                        <span className="text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                          <TokenLogoImage tokenId="kas" size={14} />
                          {selectedPackage.basePrice.toFixed(2)} KAS
                        </span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-zinc-600 dark:text-zinc-400">Discount ({discount}%):</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            <span className="flex items-center gap-1">
                              <TokenLogoImage tokenId="kas" size={14} />
                              -{(selectedPackage.basePrice * discount / 100).toFixed(2)} KAS
                            </span>
                          </span>
                        </div>
                      )}
                      {txHash && (
                        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                          <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                            <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Transaction: {txHash.slice(0, 10)}...{txHash.slice(-8)}</span>
                          </div>
                        </div>
                      )}
                      <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-between">
                        <span className="text-zinc-900 dark:text-zinc-100 font-semibold">Total:</span>
                        <span className="text-zinc-900 dark:text-zinc-100 font-bold text-lg">{finalPrice.toFixed(2)} KAS</span>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {isWalletConnected && !hasUnlimitedCredits && (
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePurchase}
              disabled={isPurchasing || isConfirming}
              className="px-4 py-2 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConfirming ? 'Confirming Transaction...' : isPurchasing ? 'Sending Transaction...' : `Purchase for ${finalPrice.toFixed(2)} KAS`}
            </button>
          </div>
        )}
        {isWalletConnected && hasUnlimitedCredits && (
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

