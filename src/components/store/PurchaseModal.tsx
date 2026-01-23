'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { calculatePlatformFee } from '@/lib/store/fees';
import type { Product } from '@/lib/store/types';

interface PurchaseModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
}

export function PurchaseModal({ product, isOpen, onClose, onProceed }: PurchaseModalProps) {
  const [mounted, setMounted] = useState(false);
  const { state } = useKaspaWallet();
  const { tier: krexTier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const fee = calculatePlatformFee(product.priceKAS, krexTier, nftStatus);
  const hasDiscount = fee.feePercent < 5;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div
        className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-2xl max-w-md w-full border border-zinc-200 dark:border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Purchase Confirmation
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Product Info */}
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              {product.title}
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
              {product.description}
            </p>
          </div>

          {/* Cost Breakdown */}
          <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-4 space-y-3 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Product Price:</span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {product.priceKAS}
                </span>
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">KAS</span>
              </div>
            </div>

            {fee.feePercent > 0 && (
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Platform Fee ({fee.feePercent.toFixed(2)}%):
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {fee.feeAmount.toFixed(4)} KAS
                  </span>
                </div>
                {hasDiscount && (
                  <div className="text-xs text-green-600 dark:text-green-400">
                    ✓ Discount applied (KREX/NFT holder)
                  </div>
                )}
                <div className="text-xs text-zinc-500 dark:text-zinc-400 pt-1">
                  Seller receives: {fee.sellerRevenue.toFixed(4)} KAS
                </div>
              </div>
            )}

            <div className="pt-2 border-t-2 border-zinc-300 dark:border-zinc-700 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Total to Pay:
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {product.priceKAS}
                  </span>
                  <span className="text-base font-medium text-zinc-600 dark:text-zinc-400">KAS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Wallet Info */}
          {state.address && (
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Paying from: {state.address.slice(0, 8)}...{state.address.slice(-6)}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onProceed}
              className="flex-1 px-4 py-2.5 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg font-medium transition-colors"
            >
              Proceed to Payment
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
