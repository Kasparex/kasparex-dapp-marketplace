'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductPurchase } from '@/components/store/ProductPurchase';
import { ProductSidebar } from '@/components/store/ProductSidebar';
import { ProductSubmissionModal } from '@/components/store/ProductSubmissionModal';
import { getProductBySlug, getAllProducts } from '@/lib/store/products';
import { hasUserPurchased as checkPurchase, getPurchasesByBuyer } from '@/lib/store/purchases';
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
  const [purchaseTxHash, setPurchaseTxHash] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const { state } = useKaspaWallet();

  // Get slug from params
  useEffect(() => {
    params.then((p) => {
      setSlug(p.slug);
      setParamsResolved(true);
    });
  }, [params]);

  // Load product
  const loadProduct = async () => {
    // Wait for params to resolve before checking slug
    if (!paramsResolved) {
      return;
    }

    if (!slug) {
      setIsLoading(false);
      setError('Invalid product slug');
      return;
    }

    const currentSlug = slug; // Capture slug in a const for TypeScript

    setIsLoading(true);
    setError(null);
    try {
      const productData = await getProductBySlug(currentSlug);
      if (!productData) {
        setError('Product not found');
        setIsLoading(false);
        return;
      }
      setProduct(productData);
    } catch (error) {
      console.error('Failed to load product:', error);
      setError('Failed to load product');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
  }, [slug, paramsResolved]);

  // Check access
  useEffect(() => {
    if (!product || !state.address) {
      setHasAccess(false);
      setCheckingAccess(false);
      return;
    }

    const currentProduct = product; // Capture product in a const for TypeScript
    const currentAddress = state.address; // Capture address in a const for TypeScript

    async function checkAccess() {
      setCheckingAccess(true);
      try {
        const purchased = await checkPurchase(currentProduct.id, currentAddress);
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
            <Link
              href="/store"
              className="text-[#02abb8] hover:underline"
            >
              Back to Store
            </Link>
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

      <main className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Left Sidebar - Rewards Status */}
          <ProductSidebar onSubmitProduct={() => setShowSubmitModal(true)} />

          {/* Main Content */}
          <div className="flex-1 min-w-0 p-4 sm:p-6 lg:px-12 lg:py-12">
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8">
              {/* Left Column: Image, Description, Content */}
              <div className="space-y-8">
                {/* Product Image */}
                {thumbnailUrl && (
                  <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900">
                    <img
                      src={thumbnailUrl}
                      alt={product.title}
                      className="w-full h-auto object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                )}

                {/* Product Header Info */}
                <div>
                  <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                      {product.title}
                    </h1>
                    <span
                      className={`px-2.5 py-1 text-xs font-medium rounded ${product.network === 'L1'
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
                  <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Protected Content Section */}
                {hasAccess ? (
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                      Product Content
                    </h2>
                    {product.content && (
                      <div className="prose dark:prose-invert max-w-none mb-6">
                        <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                          {product.content}
                        </p>
                      </div>
                    )}

                    {/* Asset Downloads */}
                    {product.assetCids && product.assetCids.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                          Download Files
                        </h3>
                        <div className="space-y-2">
                          {product.assetCids.map((cid, index) => {
                            const fileUrl = getBestGatewayUrl(cid);
                            return (
                              <a
                                key={cid}
                                href={fileUrl}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 transition-all group"
                              >
                                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                  File {index + 1}
                                </span>
                                <svg className="w-5 h-5 text-zinc-400 group-hover:text-[#02abb8] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4">
                      <span className="text-3xl">🔒</span>
                    </div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                      Purchase Required
                    </h3>
                    <p className="text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto">
                      Purchase this product to access the content and download files.
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: Purchase Component */}
              <div className="lg:pt-0">
                <div className="sticky top-24">
                  <ProductPurchase
                    product={product}
                    onPurchaseComplete={async () => {
                      // Refresh access check and get transaction hash
                      if (state.address) {
                        const purchased = await checkPurchase(product.id, state.address);
                        setHasAccess(purchased);
                        if (purchased) {
                          const purchases = await getPurchasesByBuyer(state.address);
                          const purchase = purchases.find(p => p.productId === product.id);
                          if (purchase) {
                            setPurchaseTxHash(purchase.txHash);
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Submit Product Modal */}
      <ProductSubmissionModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onSuccess={async () => {
          // Reload products - the new registry CID is now in localStorage
          // Wait a moment for IPFS propagation, then reload
          await new Promise(resolve => setTimeout(resolve, 1000));
          await loadProduct();
        }}
      />
    </div>
  );
}
