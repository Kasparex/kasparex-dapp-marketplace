'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductPurchase } from '@/components/store/ProductPurchase';
import { StoreSidebar } from '@/components/store/StoreSidebar';
import { ProductSubmissionModal } from '@/components/store/ProductSubmissionModal';
import { getProductBySlug } from '@/lib/store/products';
import { hasUserPurchased as checkPurchase, getPurchasesByBuyer } from '@/lib/store/purchases';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import type { Product } from '@/lib/store/types';
import { StoreCommentsSection } from '@/components/store/StoreCommentsSection';

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
    if (!paramsResolved) return;
    if (!slug) {
      setIsLoading(false);
      setError('Invalid product slug');
      return;
    }

    const currentSlug = slug;
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

    const currentProduct = product;
    const currentAddress = state.address;

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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
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
            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 mb-2">
              {error || 'Product not found'}
            </h2>
            <Link
              href="/store"
              className="text-yellow-600 dark:text-yellow-400 hover:underline font-bold"
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

      <div className="flex flex-1">
        {/* Sidebar */}
        <StoreSidebar
          mode="product"
          currentProduct={product}
        />

        {/* Main Content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 lg:pl-6 overflow-y-auto bg-white dark:bg-zinc-950">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8">

              {/* Left Column: Image & Details */}
              <div className="space-y-8">
                {/* Product Image */}
                {thumbnailUrl && (
                  <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 shadow-xl shadow-black/5 relative group">
                    <img
                      src={thumbnailUrl}
                      alt={product.title}
                      className="w-full h-auto object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                )}

                {/* Title & Description */}
                <div>
                  <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                      {product.title}
                    </h1>
                  </div>
                  <div className="flex items-center gap-2 mb-6 text-sm">
                    <span className={`px-2.5 py-1 font-bold rounded uppercase tracking-wider ${product.network === 'L1'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                      }`}>
                      {product.network}
                    </span>
                    <span className="px-2.5 py-1 font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded uppercase tracking-wider">
                      {product.category}
                    </span>
                  </div>

                  <div className="prose dark:prose-invert max-w-none">
                    <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                      {product.description}
                    </p>
                  </div>
                </div>

                {/* Protected Content Section */}
                <div id="content-section" className="scroll-mt-24">
                  {hasAccess ? (
                    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm ring-1 ring-yellow-500/20">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
                            Purchased Content
                          </h2>
                          <p className="text-xs text-zinc-500 font-medium">You have full access to this product</p>
                        </div>
                      </div>

                      {product.content && (
                        <div className="prose dark:prose-invert max-w-none mb-8 bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-xl border border-zinc-100 dark:border-zinc-800">
                          <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-mono text-sm">
                            {product.content}
                          </p>
                        </div>
                      )}

                      {/* Asset Downloads */}
                      {product.assetCids && product.assetCids.length > 0 && (
                        <div>
                          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-4">
                            Download Assets
                          </h3>
                          <div className="grid gap-3">
                            {product.assetCids.map((cid, index) => {
                              const fileUrl = getBestGatewayUrl(cid);
                              return (
                                <a
                                  key={cid}
                                  href={fileUrl}
                                  download
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between px-5 py-4 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-all group hover:border-yellow-500/30 hover:shadow-lg hover:shadow-yellow-500/5"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-500 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
                                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    </div>
                                    <div>
                                      <span className="block text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
                                        Asset File {index + 1}
                                      </span>
                                      <span className="text-[10px] font-mono text-zinc-400">IPFS: {cid.substring(0, 12)}...</span>
                                    </div>
                                  </div>
                                  <svg className="w-5 h-5 text-zinc-300 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                  </svg>
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-10 text-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] opacity-50" />
                      <div className="relative z-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white dark:bg-zinc-900 shadow-xl shadow-zinc-200/50 dark:shadow-zinc-950/50 mb-6 text-zinc-300 dark:text-zinc-700">
                          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </div>
                        <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-3 tracking-tight">
                          Premium Content Locked
                        </h3>
                        <p className="text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto font-medium">
                          Purchase this product to instantly access the full content, source files, and download links.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* On-Chain Comments Module */}
                <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800">
                  <StoreCommentsSection productId={product.id} />
                </div>
              </div>

              {/* Right Column: Purchase Component */}
              <div className="lg:pt-0">
                <div className="sticky top-6 space-y-6">
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
                          // Smooth scroll to content
                          document.getElementById('content-section')?.scrollIntoView({ behavior: 'smooth' });
                        }
                      }
                    }}
                  />

                  {/* Trust Badges */}
                  <div className="bg-white dark:bg-zinc-950 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <div className="flex items-center gap-3 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Verified Purchase
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                      <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      Instant Delivery
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                      <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      Secure Transaction
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <Footer />

      {/* Submit Product Modal */}
      <ProductSubmissionModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onSuccess={async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
          await loadProduct();
        }}
      />
    </div>
  );
}
