'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductPurchase } from '@/components/store/ProductPurchase';
import { ProductSidebar } from '@/components/store/ProductSidebar';
import { getProductBySlug } from '@/lib/store/products';
import { hasUserPurchased as checkPurchase, getPurchasesByBuyer } from '@/lib/store/purchases';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { calculatePlatformFee } from '@/lib/store/fees';
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
  const { state } = useKaspaWallet();
  const { tier: krexTier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();

  // Get slug from params
  useEffect(() => {
    params.then((p) => {
      setSlug(p.slug);
      setParamsResolved(true);
    });
  }, [params]);

  // Load product
  useEffect(() => {
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

    async function loadProduct() {
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
    }

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
      
      <main className="flex-1">
        <div className="flex">
          {/* Sidebar */}
          <ProductSidebar product={product} txHash={purchaseTxHash} />

          {/* Main Content */}
          <div className="flex-1 lg:ml-0">
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

          {/* Protected Content Section - Moved higher */}
          {hasAccess ? (
            <div className="mb-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
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
            <div className="mb-6 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
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

          {/* Product Image - Smaller, above costs */}
          {thumbnailUrl && (
            <div className="mb-6">
              <img
                src={thumbnailUrl}
                alt={product.title}
                className="w-full max-w-md rounded-lg border border-zinc-200 dark:border-zinc-800"
                loading="lazy"
                decoding="async"
              />
            </div>
          )}

          {/* Costs and Fees - In main content area */}
          <div className="mb-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Pricing & Fees
            </h3>
            {(() => {
              const fee = calculatePlatformFee(product.priceKAS, krexTier, nftStatus);
              const hasDiscount = fee.feePercent < 5;
              
              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">Product Price:</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                        {product.priceKAS}
                      </span>
                      <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">KAS</span>
                    </div>
                  </div>
                  
                  {fee.feePercent > 0 && (
                    <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-600 dark:text-zinc-400">
                          Platform Fee ({fee.feePercent.toFixed(2)}%):
                        </span>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {fee.feeAmount.toFixed(4)} KAS
                        </span>
                      </div>
                      {hasDiscount && (
                        <div className="text-xs text-green-600 dark:text-green-400">
                          ✓ Discount applied (KREX/NFT holder)
                        </div>
                      )}
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        Seller receives: {fee.sellerRevenue.toFixed(4)} KAS
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-2 border-t-2 border-zinc-300 dark:border-zinc-700 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                        Total to Pay:
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                          {product.priceKAS}
                        </span>
                        <span className="text-base font-medium text-zinc-600 dark:text-zinc-400">KAS</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Purchase Component */}
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
      </main>

      <Footer />
    </div>
  );
}
