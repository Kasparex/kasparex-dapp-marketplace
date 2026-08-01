'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getProductById } from '@/lib/store/products';
import { getExplorerTxUrl } from '@/lib/store/utils';
import { resolveStoreProductImageUrl } from '@/lib/store/productMedia';
import type { Product, Purchase } from '@/lib/store/types';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';
import { KX_LISTING_PLACEHOLDER_GRADIENT } from '@/lib/ui/kxListingPlaceholder';

type StorePurchasedGridProps = {
  purchases: Purchase[];
};

export function StorePurchasedGrid({ purchases }: StorePurchasedGridProps) {
  const [products, setProducts] = useState<Record<string, Product | null>>({});

  useEffect(() => {
    async function loadProducts() {
      const productMap: Record<string, Product | null> = {};
      for (const purchase of purchases) {
        if (!productMap[purchase.productId]) {
          productMap[purchase.productId] = await getProductById(purchase.productId);
        }
      }
      setProducts(productMap);
    }
    if (purchases.length > 0) void loadProducts();
  }, [purchases]);

  if (purchases.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-600 dark:text-zinc-400">You haven&apos;t purchased any products yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
      {purchases.map((purchase) => {
        const product = products[purchase.productId];
        const thumbnailUrl = resolveStoreProductImageUrl(product) ?? null;
        const href = product ? `/store/${product.slug}` : undefined;

        return (
          <KxListingCard key={purchase.id} accent="store" href={href}>
            <KxListingCardMedia>
              {thumbnailUrl ? (
                <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className={`flex h-full w-full items-center justify-center ${KX_LISTING_PLACEHOLDER_GRADIENT}`}>
                  <svg className="h-8 w-8 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
              )}
            </KxListingCardMedia>
            <KxListingCardBody>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2">
                {product?.title ?? `Product ${purchase.productId.slice(0, 8)}...`}
              </h3>
              <p className="mt-1 text-sm text-zinc-500">{new Date(purchase.purchasedAt).toLocaleDateString()}</p>
              <p className="mt-2 text-sm font-black text-zinc-900 dark:text-zinc-100 tabular-nums">
                {purchase.amountPaidKAS.toFixed(4)} KAS
              </p>
              <div className="mt-4 flex flex-wrap gap-2" onClick={(e) => e.preventDefault()} role="presentation">
                {product ? (
                  <Link
                    href={`/store/${product.slug}`}
                    className="flex-1 k-control-btn justify-center !bg-[#02abb8] !text-white !border-[#02abb8] hover:!bg-[#028a94]"
                  >
                    View product
                  </Link>
                ) : null}
                <a
                  href={getExplorerTxUrl(purchase.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="k-control-btn justify-center"
                >
                  View tx
                </a>
              </div>
            </KxListingCardBody>
          </KxListingCard>
        );
      })}
    </div>
  );
}
