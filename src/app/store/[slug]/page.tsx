'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProductPurchase } from '@/components/store/ProductPurchase';
import { StoreProductPremiumPanel } from '@/components/store/StoreProductPremiumPanel';
import { StorePageShell } from '@/components/store/StorePageShell';
import { getProductBySlug } from '@/lib/store/products';
import { hasUserPurchased as checkPurchase } from '@/lib/store/purchases';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import type { Product } from '@/lib/store/types';
import { StoreCommentsSection } from '@/components/store/StoreCommentsSection';

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

  const thumbnailUrl = product.thumbnailCid ? getBestGatewayUrl(product.thumbnailCid) : null;

  return (
    <StorePageShell sidebar={{ mode: 'product', currentProduct: product }}>
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8">
        <div className="space-y-8">
          {thumbnailUrl && (
            <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 shadow-sm">
              <img src={thumbnailUrl} alt={product.title} className="w-full h-auto object-cover" loading="lazy" />
            </div>
          )}

          <div id="product-overview" className="scroll-mt-24">
            <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight mb-4">{product.title}</h1>
            <div className="flex items-center gap-2 mb-6 text-sm flex-wrap">
              <span className={`px-2.5 py-1 font-bold rounded uppercase tracking-wider ${product.network === 'L1' ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' : 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'}`}>
                {product.network}
              </span>
              <span className="px-2.5 py-1 font-bold bg-cyan-500/10 text-cyan-800 dark:text-cyan-300 rounded uppercase tracking-wider border border-cyan-500/20">
                {product.category}
              </span>
            </div>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">{product.description}</p>
          </div>

          {hasAccess ? (
            <div id="product-downloads" className="scroll-mt-24">
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm ring-1 ring-cyan-500/20">
                <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wide mb-4">Purchased content</h2>
                {product.content && (
                  <div className="prose dark:prose-invert max-w-none mb-8 bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-xl border border-zinc-100 dark:border-zinc-800">
                    <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-mono text-sm">{product.content}</p>
                  </div>
                )}
                {product.assetCids && product.assetCids.length > 0 && (
                  <div className="grid gap-3">
                    {product.assetCids.map((cid, index) => (
                      <a
                        key={cid}
                        href={getBestGatewayUrl(cid)}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-5 py-4 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-all group hover:border-cyan-500/30"
                      >
                        <span className="text-sm font-bold group-hover:text-[#02abb8]">
                          {product.assetFileNames?.[index] ?? `Asset file ${index + 1}`}
                        </span>
                        <svg className="w-5 h-5 text-zinc-300 group-hover:text-[#02abb8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}

          <div id="product-comments" className="scroll-mt-24 pt-8 border-t border-zinc-200 dark:border-zinc-800">
            <StoreCommentsSection productId={product.id} />
          </div>
        </div>

        <div className="lg:pt-0">
          <div className="sticky top-6 space-y-6">
            <ProductPurchase
              product={product}
              onPurchaseComplete={async () => {
                if (state.address) {
                  const purchased = await checkPurchase(product.id, state.address);
                  setHasAccess(purchased);
                  if (purchased) {
                    document.getElementById('product-downloads')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }
              }}
            />
            <StoreProductPremiumPanel product={product} hasAccess={hasAccess} />
          </div>
        </div>
      </div>
    </StorePageShell>
  );
}
