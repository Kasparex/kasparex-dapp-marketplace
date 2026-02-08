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
    <Link href={`/store/${product.slug}`} className="group h-full">
      <div className="h-full flex flex-col bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-[#02abb8]/10 hover:-translate-y-1">
        {/* Product Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100 dark:bg-zinc-950">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={product.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-300">
              <svg className="w-12 h-12 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Category Badge */}
          <div className="absolute top-2 left-2 z-10">
            <span className="px-2 py-1 bg-[#02abb8]/20 backdrop-blur-sm text-[#02abb8] text-[10px] font-bold uppercase tracking-wider rounded-md">
              {product.category}
            </span>
          </div>

          {/* Network Badge */}
          <div className="absolute top-2 right-2 z-10">
            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm ${product.network === 'L1'
              ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
              : 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
              }`}>
              {product.network}
            </span>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4 flex-1 flex flex-col">
          <div className="text-xs font-bold text-[#02abb8] uppercase tracking-widest mb-1">
            by {product.sellerAddress.slice(-5)}
          </div>
          <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2 line-clamp-1">
            {product.title}
          </h4>
          <p className="text-zinc-500 dark:text-zinc-500 text-xs mb-4 line-clamp-2 flex-1">
            {product.description}
          </p>

          {/* Footer with Price and Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <div className="text-lg font-black text-zinc-900 dark:text-zinc-100">
              {product.priceKAS} <span className="text-sm text-zinc-500 font-bold">KAS</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowPreview(true);
                }}
                className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                title="Quick Preview"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
              <button
                onClick={handleBuy}
                className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all bg-[#02abb8] text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-400"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>

      <ProductPreviewModal
        product={product}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onBuy={() => {
          setShowPreview(false);
          router.push(`/store/${product.slug}`);
        }}
      />
    </Link>
  );
}
