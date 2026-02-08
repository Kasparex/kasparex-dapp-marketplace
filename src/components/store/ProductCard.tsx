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
      <div className="h-full flex flex-col bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/10 hover:-translate-y-1">
        <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100 dark:bg-zinc-950">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />

          {/* Tags / Badges */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
            <span className="self-start px-3 py-1 bg-violet-600/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg border border-white/10">
              {product.category}
            </span>
          </div>

          <div className="absolute top-4 right-4 z-20">
            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-lg backdrop-blur-sm ${product.network === 'L1'
                ? 'bg-blue-500/90 text-white'
                : 'bg-indigo-500/90 text-white'
              }`}>
              {product.network}
            </span>
          </div>

          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={product.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-300">
              <svg className="w-12 h-12 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          <div className="absolute bottom-4 left-4 right-4 z-20">
            <div className="flex items-end justify-between">
              <div className="flex-1 mr-4">
                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-violet-300 transition-colors line-clamp-1">
                  {product.title}
                </h3>
                <p className="text-zinc-300 text-xs line-clamp-1">
                  by {product.seller.substring(0, 8)}...
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 flex-1 flex flex-col">
          <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4 line-clamp-2 h-10">
            {product.description}
          </p>

          <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Price</p>
              <p className="text-lg font-black text-zinc-900 dark:text-white">
                {product.priceKAS} <span className="text-sm font-bold text-zinc-500">KAS</span>
              </p>
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
                className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold uppercase tracking-wider hover:bg-violet-600 dark:hover:bg-violet-400 hover:text-white dark:hover:text-white transition-all transform active:scale-95"
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
