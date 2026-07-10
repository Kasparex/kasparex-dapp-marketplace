'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { StoreProductDetail } from '@/components/store/StoreProductDetail';
import { StorePageShell } from '@/components/store/StorePageShell';
import { getProductBySlug } from '@/lib/store/products';
import { hasUserPurchased as checkPurchase } from '@/lib/store/purchases';
import { useKaspaWallet } from '@/lib/kaspa/context';
import type { Product } from '@/lib/store/types';
import type { StoreProductContentTab } from '@/lib/store/productPageSections';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ProductPage({ params }: PageProps) {
  const [slug, setSlug] = useState<string | null>(null);
  const [paramsResolved, setParamsResolved] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [contentTab, setContentTab] = useState<StoreProductContentTab>('product');
  const { state } = useKaspaWallet();

  useEffect(() => {
    params.then((p) => {
      setSlug(p.slug);
      setParamsResolved(true);
    });
  }, [params]);

  const loadProduct = async () => {
    if (!paramsResolved || !slug) {
      if (paramsResolved && !slug) {
        setIsLoading(false);
        setError('Invalid product slug');
      }
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const productData = await getProductBySlug(slug);
      if (!productData) {
        setError('Product not found');
        return;
      }
      setProduct(productData);
    } catch {
      setError('Failed to load product');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
  }, [slug, paramsResolved]);

  useEffect(() => {
    if (!product || !state.address) {
      setHasAccess(false);
      return;
    }
    checkPurchase(product.id, state.address).then(setHasAccess).catch(() => setHasAccess(false));
  }, [product, state.address]);

  if (!paramsResolved || isLoading) {
    return (
      <StorePageShell sidebar={{ mode: 'listing' }}>
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mb-4" />
          <p className="text-zinc-600 dark:text-zinc-400">Loading product...</p>
        </div>
      </StorePageShell>
    );
  }

  if (error || !product) {
    return (
      <StorePageShell sidebar={{ mode: 'listing' }}>
        <div className="py-20 text-center">
          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 mb-2">{error || 'Product not found'}</h2>
          <Link href="/store" className="text-[#02abb8] hover:underline font-bold">Back to Store</Link>
        </div>
      </StorePageShell>
    );
  }

  return (
    <StorePageShell
      sidebar={{
        mode: 'product',
        currentProduct: product,
        productContentTab: contentTab,
        onProductTabChange: setContentTab,
      }}
    >
      <StoreProductDetail
        product={product}
        hasAccess={hasAccess}
        contentTab={contentTab}
        onContentTabChange={setContentTab}
        onPurchaseComplete={async () => {
          if (state.address) {
            const purchased = await checkPurchase(product.id, state.address);
            setHasAccess(purchased);
            if (purchased) setContentTab('product');
          }
        }}
      />
    </StorePageShell>
  );
}
