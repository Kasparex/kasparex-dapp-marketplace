'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Product } from '@/lib/store/types';
import { getProductPaymentCurrency } from '@/lib/store/currencies';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import { htmlToPlainText } from '@/lib/richText/html';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';
import { KxListingCategoryChip } from '@/components/ui/KxListingCategoryChip';
import { KX_LISTING_PLACEHOLDER_GRADIENT } from '@/lib/ui/kxListingPlaceholder';
import { KX_CARD_EXCERPT } from '@/lib/ui/kxTypography';
import { HUB_DELETE_FEE_KAS } from '@/lib/hub/paidDelete';
import { SELLER_ACTION_FEE_KAS } from '@/components/store/StoreProductForm';

type StoreSellerProductListProps = {
  products: Product[];
  onArchive: (productId: string) => void;
  actionProductId: string | null;
  onListProduct: () => void;
};

export function StoreSellerProductList({
  products,
  onArchive,
  actionProductId,
  onListProduct,
}: StoreSellerProductListProps) {
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null);

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-600 dark:text-zinc-400 mb-4">You haven&apos;t listed any products yet.</p>
        <button
          type="button"
          onClick={onListProduct}
          className="k-control-btn !bg-[#02abb8] !text-white !border-[#02abb8] hover:!bg-[#028a94]"
        >
          List your first product
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
      {products.map((product) => {
        const currency = getProductPaymentCurrency(product);
        const thumbnailUrl = product.thumbnailCid ? getBestGatewayUrl(product.thumbnailCid) : null;
        const excerpt = htmlToPlainText(product.description);

        return (
          <KxListingCard key={product.id} accent="store" href={`/store/${product.slug}`}>
            <KxListingCardMedia>
              {thumbnailUrl ? (
                <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className={`flex h-full w-full items-center justify-center ${KX_LISTING_PLACEHOLDER_GRADIENT}`}>
                  <svg className="h-8 w-8 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              )}
            </KxListingCardMedia>
            <KxListingCardBody>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <KxListingCategoryChip>{product.category}</KxListingCategoryChip>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{product.network}</span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                    product.status === 'active'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'
                  }`}
                >
                  {product.status}
                </span>
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2">{product.title}</h3>
              <p className={`${KX_CARD_EXCERPT} mt-1 line-clamp-2`}>{excerpt}</p>
              <p className="mt-2 text-sm font-black text-[#02abb8] tabular-nums">
                {product.priceKAS} {currency}
                <span className="ml-2 text-xs font-semibold text-zinc-500">{product.purchaseCount} sales</span>
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2" onClick={(e) => e.preventDefault()} onKeyDown={(e) => e.stopPropagation()} role="presentation">
                {product.status === 'active' ? (
                  <>
                    <Link
                      href={`/store/edit/${product.slug}`}
                      className="flex-1 k-control-btn justify-center !bg-[#02abb8] !text-white !border-[#02abb8] hover:!bg-[#028a94]"
                    >
                      Edit ({SELLER_ACTION_FEE_KAS} KAS)
                    </Link>
                    {confirmArchiveId === product.id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            onArchive(product.id);
                            setConfirmArchiveId(null);
                          }}
                          disabled={actionProductId === product.id}
                          className="flex-1 k-control-btn justify-center !bg-red-600 !text-white !border-red-600 hover:!bg-red-700 disabled:opacity-50"
                        >
                          {actionProductId === product.id ? 'Archiving...' : 'Confirm'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmArchiveId(null)}
                          disabled={actionProductId === product.id}
                          className="k-control-btn"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmArchiveId(product.id)}
                        disabled={actionProductId === product.id}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/40"
                      >
                        Archive ({HUB_DELETE_FEE_KAS.store} KAS)
                      </button>
                    )}
                  </>
                ) : null}
              </div>
            </KxListingCardBody>
          </KxListingCard>
        );
      })}
    </div>
  );
}
