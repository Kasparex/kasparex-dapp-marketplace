'use client';

import { useState, useEffect } from 'react';
import { getProductById } from '@/lib/store/products';
import type { Product, Purchase } from '@/lib/store/types';

interface PurchasedItemsListProps {
  purchases: Purchase[];
}

export function PurchasedItemsList({ purchases }: PurchasedItemsListProps) {
  const [products, setProducts] = useState<Record<string, Product | null>>({});

  useEffect(() => {
    async function loadProducts() {
      const productMap: Record<string, Product | null> = {};
      for (const purchase of purchases) {
        if (!productMap[purchase.productId]) {
          const product = await getProductById(purchase.productId);
          productMap[purchase.productId] = product;
        }
      }
      setProducts(productMap);
    }
    if (purchases.length > 0) {
      loadProducts();
    }
  }, [purchases]);

  if (purchases.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          My Purchases (0)
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          You haven&apos;t purchased any products yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
        My Purchases ({purchases.length})
      </h2>
      <div className="space-y-2">
        {purchases.map((purchase) => {
          const product = products[purchase.productId];
          return (
            <div
              key={purchase.id}
              className="flex items-center justify-between p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg"
            >
              <div className="flex-1">
                <div className="font-medium text-zinc-900 dark:text-zinc-100">
                  {product ? (
                    <a
                      href={`/store/${product.slug}`}
                      className="hover:text-[#02abb8] transition-colors"
                    >
                      {product.title}
                    </a>
                  ) : (
                    `Product ID: ${purchase.productId.slice(0, 8)}...`
                  )}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  {new Date(purchase.purchasedAt).toLocaleDateString()}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {purchase.amountPaidKAS.toFixed(4)} KAS
                </div>
                <a
                  href={`https://explorer.kaspa.org/txs/${purchase.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#02abb8] hover:underline"
                >
                  View Transaction
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
