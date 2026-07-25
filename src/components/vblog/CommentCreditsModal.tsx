'use client';

import { useState, useEffect } from 'react';
import { useCommentCredits } from '@/hooks/useCommentCredits';
import { useCommentCreditsPayment } from '@/hooks/useCommentCreditsPayment';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useAccount } from 'wagmi';
import { getErrorMessage } from '@/lib/utils';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { KxSegmentToggle } from '@/components/ui/KxSegmentToggle';
import { HubPaymentCurrencyDropdown } from '@/components/payments/HubPaymentCurrencyDropdown';
import { buildKasKrexMenuOptions } from '@/lib/payments/hubPaymentTypes';
import { usePricingSnapshot } from '@/hooks/usePricingSnapshot';
import { formatHubPaymentFromKas } from '@/lib/pricing';
import type { StorePaymentCurrency } from '@/lib/store/currencies';
import { KxModalHeader, KxModalSectionTitle, KxPaymentSummary } from '@/components/payments/KxPaymentUi';
import { MobileWalletUnavailableNotice } from '@/components/hub/MobileWalletUnavailableNotice';

const KREX_UNLIMITED_THRESHOLD = 100_000_000;

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
  basePrice: number;
}

const CREDIT_PACKAGES: CreditPackage[] = [
  { credits: 10, basePrice: 10 },
  { credits: 25, basePrice: 25 },
  { credits: 50, basePrice: 50 },
  { credits: 100, basePrice: 100 },
];

async function checkNFTStatus(walletAddress: string | null): Promise<NFTStatus> {
  if (!walletAddress || typeof window === 'undefined') {
    return { hasStandardNFT: false, hasDiamondNFT: false, hasRareNFT: false, collections: [] };
  }
  try {
    const stored = localStorage.getItem(`nft_status_${walletAddress.toLowerCase()}`);
    if (stored) return JSON.parse(stored) as NFTStatus;
  } catch {
    /* ignore */
  }
  return { hasStandardNFT: false, hasDiamondNFT: false, hasRareNFT: false, collections: [] };
}

export function CommentCreditsModal({ isOpen, onClose }: CommentCreditsModalProps) {
  const { state: kaspaState } = useKaspaWallet();
  const { address: evmAddress, isConnected: isEVMConnected } = useAccount();
  const walletAddress = kaspaState.address || (evmAddress ? `evm:${evmAddress}` : null);
  const isWalletConnected = kaspaState.isConnected || isEVMConnected;

  const { purchaseCredits } = useCommentCredits(walletAddress);
  const { payCredits, isProcessing, error, setError } = useCommentCreditsPayment();
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage>(CREDIT_PACKAGES[0]);
  const [paymentCurrency, setPaymentCurrency] = useState<StorePaymentCurrency>('KAS');
  const [nftStatus, setNftStatus] = useState<NFTStatus>({
    hasStandardNFT: false,
    hasDiamondNFT: false,
    hasRareNFT: false,
    collections: [],
  });
  const { balance: krexBalance } = useKREXBalance();
  const { snapshot: pricingSnapshot } = usePricingSnapshot(['KREX']);
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !walletAddress) return;
    void checkNFTStatus(walletAddress).then(setNftStatus);
  }, [isOpen, walletAddress]);

  useEffect(() => {
    if (!isOpen) {
      setTxHash(null);
      setError(null);
      setPaymentCurrency('KAS');
    }
  }, [isOpen, setError]);

  const getDiscount = (): number => {
    if (nftStatus.hasRareNFT) return 30;
    if (nftStatus.hasDiamondNFT) return 20;
    if (nftStatus.hasStandardNFT) return 10;
    return 0;
  };

  const discount = getDiscount();
  const hasUnlimitedCredits = krexBalance >= KREX_UNLIMITED_THRESHOLD;
  const finalPriceKas = hasUnlimitedCredits ? 0 : selectedPackage.basePrice * (1 - discount / 100);
  const formatPrice = (kas: number) => formatHubPaymentFromKas(kas, paymentCurrency, pricingSnapshot);
  const payLabel = formatPrice(finalPriceKas);
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
    if (finalPriceKas <= 0) {
      setError('Invalid purchase amount');
      return;
    }

    setError(null);
    setTxHash(null);

    try {
      const hash = await payCredits(paymentCurrency, finalPriceKas, creditsToReceive, pricingSnapshot);
      setTxHash(hash);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const success = await purchaseCredits(creditsToReceive, finalPriceKas, hash);
      if (success) {
        setTimeout(() => onClose(), 1500);
      } else {
        setError('Transaction succeeded but credit update failed.');
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Failed to purchase credits');
      if (errorMessage.includes('user rejected') || errorMessage.includes('rejected')) {
        setError('Transaction was cancelled');
      } else if (errorMessage.includes('insufficient')) {
        setError(`Insufficient ${paymentCurrency} balance.`);
      } else {
        setError(errorMessage);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
      <div
        role="presentation"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
        onMouseDown={onClose}
      />
      <div
        className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-xl max-w-xl w-full border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <KxModalHeader
          title="Purchase Comment Credits"
          subtitle="Buy credits to unlock commenting on articles and dApps"
          onClose={onClose}
        />

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <MobileWalletUnavailableNotice networks="L1" />
          {!isWalletConnected ? (
            <p className="text-center py-8 kx-body">
              Connect your wallet to purchase credits
            </p>
          ) : hasUnlimitedCredits ? (
            <div className="text-center py-8">
              <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Unlimited Credits Unlocked</p>
              <p className="kx-body">
                You hold 100M+ KREX ({krexBalance.toLocaleString()} KREX).
              </p>
            </div>
          ) : (
            <>
              {(nftStatus.hasStandardNFT || nftStatus.hasDiamondNFT || nftStatus.hasRareNFT) && (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-3">
                  <KxModalSectionTitle>Your benefits</KxModalSectionTitle>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {nftStatus.hasRareNFT && (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-semibold">
                        Rare NFT - 30% off
                      </span>
                    )}
                    {nftStatus.hasDiamondNFT && (
                      <span className="px-2.5 py-1 rounded-lg bg-[#e30d1b]/15 text-red-800 dark:text-red-300 text-xs font-semibold">
                        Diamond NFT - 20% off
                      </span>
                    )}
                    {nftStatus.hasStandardNFT && (
                      <span className="px-2.5 py-1 rounded-lg bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 text-xs font-semibold">
                        Standard NFT - 10% off
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div>
                <KxModalSectionTitle>Select package</KxModalSectionTitle>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {CREDIT_PACKAGES.map((pkg) => {
                    const packagePriceKas = pkg.basePrice * (1 - discount / 100);
                    const isSelected = selectedPackage.credits === pkg.credits;
                    return (
                      <button
                        key={pkg.credits}
                        type="button"
                        onClick={() => setSelectedPackage(pkg)}
                        className={`p-4 rounded-2xl border transition-all text-left ${
                          isSelected
                            ? 'border-[#e30d1b] bg-[#e30d1b]/10 dark:bg-[#e30d1b]/20'
                            : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                        }`}
                      >
                        <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{pkg.credits}</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">credits</div>
                        <div className="mt-2 text-sm font-bold text-[#e30d1b] tabular-nums">
                          {formatPrice(packagePriceKas)}
                        </div>
                        {discount > 0 && (
                          <div className="text-[10px] text-zinc-400 line-through tabular-nums">
                            {formatPrice(pkg.basePrice)}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-3">
                <KxModalSectionTitle className="mb-2">Pay with</KxModalSectionTitle>
                <HubPaymentCurrencyDropdown
                  value={paymentCurrency}
                  onChange={setPaymentCurrency}
                  options={buildKasKrexMenuOptions()}
                  ariaLabel="Comment credits payment currency"
                />
              </div>

              <KxPaymentSummary totalValue={payLabel}>
                <p>
                  Credits:{' '}
                  <strong className="text-zinc-900 dark:text-zinc-100">{creditsToReceive}</strong>
                </p>
                <p>
                  Base price:{' '}
                  <strong className="text-zinc-900 dark:text-zinc-100 tabular-nums">
                    {formatPrice(selectedPackage.basePrice)}
                  </strong>
                </p>
                {discount > 0 && (
                  <p>
                    NFT discount ({discount}%):{' '}
                    <strong className="text-emerald-600 dark:text-emerald-400 tabular-nums">
                      -{formatPrice(selectedPackage.basePrice * (discount / 100))}
                    </strong>
                  </p>
                )}
                {txHash && (
                  <p className="font-mono text-[10px] break-all text-emerald-600 dark:text-emerald-400">
                    Tx: {txHash}
                  </p>
                )}
              </KxPaymentSummary>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:underline text-sm"
          >
            Cancel
          </button>
          {isWalletConnected && !hasUnlimitedCredits && (
            <button
              type="button"
              onClick={() => void handlePurchase()}
              disabled={isProcessing}
              className="px-4 py-2 rounded-lg bg-[#e30d1b] text-white font-medium text-sm disabled:opacity-50 min-w-[140px]"
            >
              {isProcessing ? 'Sending…' : `Pay ${payLabel}`}
            </button>
          )}
          {isWalletConnected && hasUnlimitedCredits && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#e30d1b] text-white font-medium text-sm"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
