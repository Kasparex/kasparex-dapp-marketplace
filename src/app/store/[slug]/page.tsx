'use client';

import { useState, useEffect } from 'react';
// Removed notFound - using client-side error handling
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductPurchase } from '@/components/store/ProductPurchase';
import { getProductBySlug } from '@/lib/store/products';
import { hasUserPurchased as checkPurchase } from '@/lib/store/purchases';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import type { Product } from '@/lib/store/types';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function ProductPage({ params }: PageProps) {
  const [slug, setSlug] = useState<string | null>(null);
  const [paramsResolved, setParamsResolved] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const { state } = useKaspaWallet();

  // Get slug from params
  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  // Load product
  useEffect(() => {
    if (!slug) return;

    async function loadProduct() {
      setIsLoading(true);
      try {
        const productData = await getProductBySlug(slug);
        if (!productData) {
          notFound();
        }
        setProduct(productData);
      } catch (error) {
        console.error('Failed to load product:', error);
        notFound();
      } finally {
        setIsLoading(false);
      }
    }

    loadProduct();
  }, [slug]);

  // Check access
  useEffect(() => {
    if (!product || !state.address) {
      setHasAccess(false);
      setCheckingAccess(false);
      return;
    }

    async function checkAccess() {
      setCheckingAccess(true);
      try {
        const purchased = await checkPurchase(product.id, state.address);
        setHasAccess(purchased);
      } catch (error) {
        console.error('Failed to check access:', error);
        setHasAccess(false);
      } finally {
        setCheckingAccess(false);
      }
    }

    checkAccess();
  }, [product, state.address]);

  if (!paramsResolved || isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#02abb8] mx-auto mb-4"></div>
            <p className="text-zinc-600 dark:text-zinc-400">Loading product...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">❌</div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              {error || 'Product not found'}
            </h2>
            <a
              href="/store"
              className="text-[#02abb8] hover:underline"
            >
              Back to Store
            </a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const thumbnailUrl = product.thumbnailCid
    ? getBestGatewayUrl(product.thumbnailCid)
    : null;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        <div className="max-w-6xl mx-auto w-full p-4 sm:p-6 lg:px-16 lg:py-12">
          {/* Product Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                {product.title}
              </h1>
              <span
                className={`px-2.5 py-1 text-xs font-medium rounded ${
                  product.network === 'L1'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                    : 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                }`}
              >
                {product.network}
              </span>
              <span className="px-2.5 py-1 text-xs font-medium bg-zinc-100 dark:bg-zinc-900/30 text-zinc-800 dark:text-zinc-300 rounded">
                {product.category}
              </span>
            </div>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              {product.description}
            </p>
          </div>

          {/* Product Image */}
          {thumbnailUrl && (
            <div className="mb-6">
              <img
                src={thumbnailUrl}
                alt={product.title}
                className="w-full max-w-2xl rounded-lg border border-zinc-200 dark:border-zinc-800"
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Protected Content Section */}
              {hasAccess ? (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                    Product Content
                  </h2>
                  {product.content && (
                    <div className="prose dark:prose-invert max-w-none">
                      <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                        {product.content}
                      </p>
                    </div>
                  )}
                  
                  {/* Asset Downloads */}
                  {product.assetCids && product.assetCids.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                        Download Files
                      </h3>
                      <div className="space-y-2">
                        {product.assetCids.map((cid, index) => (
                          <a
                            key={cid}
                            href={getBestGatewayUrl(cid)}
                            download
                            className="block px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-sm font-medium text-zinc-900 dark:text-zinc-100 transition-colors"
                          >
                            Download File {index + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🔒</div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                      Purchase Required
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Purchase this product to access the content and download files
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Purchase Component */}
              <ProductPurchase
                product={product}
                onPurchaseComplete={() => {
                  // Refresh access check
                  if (state.address) {
                    checkPurchase(product.id, state.address).then(setHasAccess);
                  }
                }}
              />

              {/* Product Info */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                  Product Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">Price:</span>
                    <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                      {product.priceKAS} KAS
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">Network:</span>
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      {product.network}
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">Category:</span>
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      {product.category}
                    </div>
                  </div>
                  {product.purchaseCount > 0 && (
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400">Sales:</span>
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">
                        {product.purchaseCount}
                      </div>
                    </div>
                  )}
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">Seller:</span>
                    <div className="font-mono text-xs text-zinc-600 dark:text-zinc-400 break-all">
                      {product.sellerAddress}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
