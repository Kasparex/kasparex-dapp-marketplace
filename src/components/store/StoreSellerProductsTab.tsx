'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getProductsBySeller } from '@/lib/store/products';
import type { Product } from '@/lib/store/types';
import { ProductCard } from '@/components/store/ProductCard';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';

export function StoreSellerProductsTab({
  product,
  className = '',
}: {
  product: Product;
  className?: string;
}) {
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getProductsBySeller(product.sellerAddress)
      .then((items) => {
        if (cancelled) return;
        setSellerProducts(items.filter((p) => p.id !== product.id && p.status === 'active'));
      })
      .catch(() => {
        if (!cancelled) setSellerProducts([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [product.id, product.sellerAddress]);

  return (
    <div className={className}>
      <DAppSectionHeader title="More from this seller" className="mb-4" />
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500" />
        </div>
      ) : sellerProducts.length === 0 ? (
        <p className="kx-body text-zinc-500">No other active listings from this seller yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sellerProducts.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      )}
      <div className="mt-6">
        <Link href="/store/dashboard" className="text-sm font-bold text-[#02abb8] hover:underline">
          Open seller dashboard
        </Link>
      </div>
    </div>
  );
}
