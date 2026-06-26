'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProductCard } from './ProductCard';
import type { Product } from '@/lib/store/types';
import type { ProductViewMode } from '@/app/store/page';

interface ProductGridProps {
  products: Product[];
  viewMode: ProductViewMode;
}

export function ProductGrid({ products, viewMode }: ProductGridProps) {
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);

  // Check sidebar state from localStorage
  useEffect(() => {
    const checkSidebarState = () => {
      const savedHidden = localStorage.getItem('store-sidebar-hidden');
      setIsSidebarHidden(savedHidden === 'true');
    };
    
    checkSidebarState();
    window.addEventListener('storage', checkSidebarState);
    const interval = setInterval(checkSidebarState, 100);
    
    return () => {
      window.removeEventListener('storage', checkSidebarState);
      clearInterval(interval);
    };
  }, []);

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500 dark:text-zinc-400">
          No products found matching your filters.
        </p>
      </div>
    );
  }

  // Grid column classes based on view mode and sidebar visibility
  let gridCols: string;
  if (viewMode === 'compact') {
    gridCols = isSidebarHidden 
      ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' 
      : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3';
  } else if (viewMode === 'table') {
    gridCols = 'grid-cols-1';
  } else {
    // Default grid view - 3 columns
    gridCols = isSidebarHidden 
      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
  }

  // Card size classes based on view mode
  const cardClasses = {
    grid: '',
    compact: 'min-h-[240px]',
    table: 'min-h-[120px] flex-row',
  };

  if (viewMode === 'table') {
    return (
      <div className="space-y-2">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 hover:border-cyan-500/30 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded flex items-center justify-center overflow-hidden">
                {product.thumbnailCid ? (
                  <img
                    src={`https://gateway.pinata.cloud/ipfs/${product.thumbnailCid}`}
                    alt={product.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                    width={64}
                    height={64}
                  />
                ) : (
                  <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {product.title}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-1 mt-1">
                  {product.description}
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {product.priceKAS} KAS
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {product.category} • {product.network}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid ${gridCols} gap-4`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
