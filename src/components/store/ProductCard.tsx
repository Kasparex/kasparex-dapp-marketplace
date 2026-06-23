'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Product } from '@/lib/store/types';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import { storeProductGateConfig } from '@/lib/hub/gateConfigs';
import { useHubListingGate } from '@/hooks/useHubListingGate';
import { HubWalletGateModal } from '@/components/hub/HubWalletGateModal';
import { ProductPreviewModal } from './ProductPreviewModal';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const router = useRouter();
  const gateConfig = storeProductGateConfig(product);
  const { cardProps, promptGate, isOpenable, l1Modal, closeL1Modal } = useHubListingGate(gateConfig);

  const thumbnailUrl = product.thumbnailCid
    ? getBestGatewayUrl(product.thumbnailCid)
    : null;

  const goToProduct = () => {
    if (!isOpenable) {
      promptGate();
      return;
    }
    router.push(`/store/${product.slug}`);
  };

  const handleBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    goToProduct();
  };

  return (
    <>
      <KxListingCard accent="store" className="h-full flex flex-col" {...cardProps(`/store/${product.slug}`)}>
        <KxListingCardMedia aspectClass="aspect-[4/3]" className="bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900">
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

          <div className="absolute top-2 left-2 z-10">
            <span className="px-2 py-1 bg-yellow-500/20 backdrop-blur-sm text-yellow-700 dark:text-yellow-300 text-[10px] font-bold uppercase tracking-wider rounded-md border border-yellow-500/20">
              {product.category}
            </span>
          </div>

          <div className="absolute top-2 right-2 z-10">
            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm ${product.network === 'L1'
              ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
              : 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
              }`}>
              {product.network}
            </span>
          </div>
        </KxListingCardMedia>

        <KxListingCardBody className="flex-1 flex flex-col">
          <div className="text-xs font-bold text-yellow-700 dark:text-yellow-300 uppercase tracking-widest mb-1">
            by {product.sellerAddress.slice(-5)}
          </div>
          <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2 line-clamp-1">
            {product.title}
          </h4>
          <p className="text-zinc-500 dark:text-zinc-500 text-xs mb-4 line-clamp-2 flex-1">
            {product.description}
          </p>

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
                className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all bg-yellow-500 text-zinc-950 hover:bg-yellow-400"
              >
                Buy Now
              </button>
            </div>
          </div>
        </KxListingCardBody>

        <ProductPreviewModal
          product={product}
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          onBuy={() => {
            setShowPreview(false);
            goToProduct();
          }}
        />
      </KxListingCard>

      {l1Modal ? <HubWalletGateModal isOpen onClose={closeL1Modal} {...l1Modal} /> : null}
    </>
  );
}
