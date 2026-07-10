'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { getProductBySlug } from '@/lib/store/products';
import { StorePageShell } from '@/components/store/StorePageShell';
import { StoreProductForm } from '@/components/store/StoreProductForm';
import { StoreSellerPricing } from '@/components/store/StoreSellerPricing';
import { StoreWalletBanner } from '@/components/store/StoreWalletBanner';
import { STORE_DASHBOARD_GATE } from '@/lib/hub/gateConfigs';
import type { Product } from '@/lib/store/types';

interface PageProps {
  params: Promise<{ slug: string }>;
}

function EditProductInner({ params }: PageProps) {
  const { state } = useKaspaWallet();
  const [slug, setSlug] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    if (!slug) return;
    setIsLoading(true);
    getProductBySlug(slug)
      .then((data) => {
        if (!data) setError('Product not found');
        else setProduct(data);
      })
      .catch(() => setError('Failed to load product'))
      .finally(() => setIsLoading(false));
  }, [slug]);

  const isOwner =
    product &&
    state.address &&
    product.sellerAddress.toLowerCase() === state.address.toLowerCase();

  return (
    <StorePageShell sidebar={{ mode: 'listing', backHref: '/store', backLabel: 'Back to Store' }}>
      <div className="mb-10">
        <p className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-2">Seller tools</p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-900 dark:text-zinc-100 mb-3 tracking-tight">
          Edit <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-emerald-500">listing</span>
        </h1>
      </div>

      <StoreWalletBanner config={STORE_DASHBOARD_GATE} />

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" />
        </div>
      ) : error || !product ? (
        <div className="py-12 text-center">
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">{error || 'Product not found'}</p>
          <Link href="/store/dashboard?tab=products" className="text-[#02abb8] font-bold hover:underline">
            Back to dashboard
          </Link>
        </div>
      ) : !state.isConnected ? (
        <p className="text-center text-zinc-500 py-12">Connect your Kaspa wallet to edit this product.</p>
      ) : !isOwner ? (
        <p className="text-center text-zinc-500 py-12">Only the seller can edit this listing.</p>
      ) : (
        <div className="space-y-8">
          <div id="store-edit-pricing" className="scroll-mt-24">
            <StoreSellerPricing />
          </div>
          <StoreProductForm product={product} />
        </div>
      )}
    </StorePageShell>
  );
}

export default function StoreEditPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <StorePageShell sidebar={{ mode: 'listing', backHref: '/store', backLabel: 'Back to Store' }}>
          <div className="py-20 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" />
          </div>
        </StorePageShell>
      }
    >
      <EditProductInner params={params} />
    </Suspense>
  );
}
