'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Product } from '@/lib/store/types';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';

interface ProductPreviewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onBuy?: () => void;
}

export function ProductPreviewModal({
  product,
  isOpen,
  onClose,
  onBuy,
}: ProductPreviewModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !product || !mounted) return null;

  const thumbnailUrl = product.thumbnailCid
    ? getBestGatewayUrl(product.thumbnailCid)
    : null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      
      {/* Modal Content */}
      <div
        className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              {product.title}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`px-2.5 py-1 text-xs font-medium rounded ${
                  product.network === 'L1'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                    : 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                }`}
              >
                {product.network}
              </span>
              <span className="px-2.5 py-1 text-xs font-medium bg-zinc-100 dark:bg-zinc-900/30 text-zinc-800 dark:text-zinc-300 rounded">
                {product.category}
              </span>
            </div>
          </div>
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
        <div className="p-6">
          {/* Thumbnail */}
          {thumbnailUrl && (
            <div className="mb-6">
              <img
                src={thumbnailUrl}
                alt={product.title}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800"
                loading="lazy"
                decoding="async"
              />
            </div>
          )}

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Description
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Price */}
          <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Price</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {product.priceKAS}
                </span>
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">KAS</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors font-medium"
            >
              Close
            </button>
            {onBuy && (
              <button
                onClick={() => {
                  onBuy();
                  onClose();
                }}
                className="flex-1 px-4 py-2 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg font-medium transition-colors"
              >
                Buy Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
