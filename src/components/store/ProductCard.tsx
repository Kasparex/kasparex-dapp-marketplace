'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Product } from '@/lib/store/types';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import { ProductPreviewModal } from './ProductPreviewModal';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const router = useRouter();

  const thumbnailUrl = product.thumbnailCid
    ? getBestGatewayUrl(product.thumbnailCid)
    : null;

  const handleBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/store/${product.slug}`);
  };

  return (
    <>
      <div
        onClick={() => router.push(`/store/${product.slug}`)}
        className="group block w-full text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-all relative flex flex-col min-h-[320px] cursor-pointer"
      >
        {/* Product Thumbnail */}
        <div className="relative w-full h-32 bg-zinc-100/80 dark:bg-zinc-900/95 flex items-center justify-center border-b border-zinc-200/50 dark:border-zinc-800/50">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={product.title}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              width={400}
              height={128}
            />
          ) : (
            <svg
              className="w-12 h-12 text-zinc-400 dark:text-zinc-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          )}

          {/* Network Badge - Top Right */}
          <div className="absolute top-3 right-3 z-20">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold backdrop-blur-sm border ${product.network === 'L1'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                  : 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700'
                } shadow-sm`}
            >
              {product.network}
            </span>
          </div>

          {/* Category Badge - Top Left */}
          <div className="absolute top-3 left-3 z-20">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold backdrop-blur-sm border bg-zinc-100 dark:bg-zinc-900/30 text-zinc-800 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 shadow-sm">
              {product.category}
            </span>
          </div>
        </div>

        <div className="p-4 relative z-10 flex flex-col flex-1 min-h-0">
          {/* Product Title */}
          <div className="mb-3">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2 line-clamp-1">
              {product.title}
            </h3>
          </div>

          {/* Description */}
          <div className="mb-3 flex-grow min-h-0">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3">
              {product.description}
            </p>
          </div>

          {/* Bottom Section: Price and Purchase Count */}
          <div className="mt-auto space-y-3">
            {/* Price - Prominent Display */}
            <div className="pt-3 border-t border-zinc-200/50 dark:border-zinc-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Price</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                      {product.priceKAS}
                    </span>
                    <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">KAS</span>
                  </div>
                </div>
                {product.purchaseCount > 0 && (
                  <div className="text-right">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">Sales</span>
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {product.purchaseCount}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons - Always visible */}
            <div className="flex gap-2">
              <button
                onClick={handleBuy}
                className="flex-1 px-3 py-2 bg-[#02abb8] hover:bg-[#028a94] active:bg-[#027a84] text-white rounded-lg text-sm font-medium transition-colors touch-manipulation"
              >
                Buy
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowPreview(true);
                }}
                className="flex-1 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:bg-zinc-300 dark:active:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg text-sm font-medium transition-colors touch-manipulation"
              >
                Preview
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <ProductPreviewModal
        product={product}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onBuy={() => {
          setShowPreview(false);
          router.push(`/store/${product.slug}`);
        }}
      />

    </>
  );
}
