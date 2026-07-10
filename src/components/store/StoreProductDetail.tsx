'use client';

import { useMemo } from 'react';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import type { Product } from '@/lib/store/types';
import type { StoreProductContentTab } from '@/lib/store/productPageSections';
import { DAppTabs, type DAppTab } from '@/components/dapps/layout/DAppTabs';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { KxRichTextContent } from '@/components/ui/KxRichTextContent';
import { HubPageRightPanelGrid, HubPageRightPanelToggle } from '@/components/hub/HubPageRightPanel';
import { SidePanelCollapsedContentWrap } from '@/components/layout/SidePanelCollapsedContentWrap';
import { useStoreRightPanelOpen } from '@/hooks/useStoreRightPanelOpen';
import { useStoreComments } from '@/hooks/useStoreComments';
import { ProductPurchase } from '@/components/store/ProductPurchase';
import { StoreBuyerBenefitsPanel } from '@/components/store/StoreBuyerBenefitsPanel';
import { StoreProductPremiumPanel } from '@/components/store/StoreProductPremiumPanel';
import { StoreProductInfoSection } from '@/components/store/StoreProductInfoSection';
import { StoreCommentsSection } from '@/components/store/StoreCommentsSection';
import { StoreSellerProductsTab } from '@/components/store/StoreSellerProductsTab';
import { AuthorInline } from '@/components/ui/AuthorInline';
import { StoreProductTags } from '@/components/store/StoreProductTags';
import { normalizeStoreProductTags } from '@/lib/store/tags';
import { formatAddress } from '@/lib/vblog/utils';

export type { StoreProductContentTab };

const IconProduct = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const IconInfo = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconModules = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
  </svg>
);

const IconSeller = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
);

const IconComments = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

export function StoreProductDetail({
  product,
  hasAccess,
  contentTab,
  onContentTabChange,
  onPurchaseComplete,
}: {
  product: Product;
  hasAccess: boolean;
  contentTab: StoreProductContentTab;
  onContentTabChange: (tab: StoreProductContentTab) => void;
  onPurchaseComplete?: () => void;
}) {
  const [rightOpen, setRightOpen] = useStoreRightPanelOpen(true);
  const { comments } = useStoreComments(product.id);
  const commentCount = comments.length;
  const thumbnailUrl = product.thumbnailCid ? getBestGatewayUrl(product.thumbnailCid) : null;
  const productTags = normalizeStoreProductTags(product.tags);

  const productTabs: readonly DAppTab<StoreProductContentTab>[] = useMemo(
    () => [
      { id: 'product', label: 'Product', icon: <IconProduct /> },
      { id: 'info', label: 'Info', icon: <IconInfo /> },
      { id: 'modules', label: 'Modules', icon: <IconModules /> },
      { id: 'seller', label: 'More from This Seller', icon: <IconSeller /> },
      {
        id: 'comments',
        label: 'Comments',
        icon: <IconComments />,
        rightAdornment:
          commentCount > 0 ? (
            <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-[#02abb8]/15 px-1.5 py-0.5 text-[10px] font-black text-[#02abb8]">
              {commentCount}
            </span>
          ) : null,
      },
    ],
    [commentCount],
  );

  const rightPanel = (
    <div className="space-y-6">
      <StoreBuyerBenefitsPanel />
      <ProductPurchase product={product} onPurchaseComplete={onPurchaseComplete} />
      <StoreProductPremiumPanel product={product} hasAccess={hasAccess} variant="sidebar" />
    </div>
  );

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <div className="mb-2 flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
        <div className="min-w-0 flex-1">
          <DAppTabs tabs={productTabs} value={contentTab} onChange={onContentTabChange} />
        </div>
        <HubPageRightPanelToggle
          panelId="kasparex-store-product-panel"
          rightOpen={rightOpen}
          onToggle={() => setRightOpen(!rightOpen)}
        />
      </div>

      <HubPageRightPanelGrid
        panelId="kasparex-store-product-panel"
        panelTitle="Purchase panel"
        rightOpen={rightOpen}
        onToggle={() => setRightOpen(!rightOpen)}
        sidebar={rightPanel}
        mainColClass="lg:col-span-7"
        asideColClass="lg:col-span-5"
        gridClassName="grid grid-cols-1 gap-8 xl:gap-12"
        hideToggle
      >
        <SidePanelCollapsedContentWrap panelOpen={rightOpen}>
          <div className="flex min-w-0 flex-col space-y-6">
            {contentTab === 'product' ? (
              <div id="store-tab-product" className="scroll-mt-24 space-y-6">
                {thumbnailUrl ? (
                  <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <img src={thumbnailUrl} alt={product.title} className="h-auto w-full object-cover" loading="lazy" />
                  </div>
                ) : null}
                <div>
                  <h1 className="mb-4 text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                    {product.title}
                  </h1>
                  <AuthorInline
                    address={product.sellerAddress}
                    displayName={formatAddress(product.sellerAddress)}
                    href={`/u/${encodeURIComponent(product.sellerAddress)}`}
                    className="mb-4"
                  />
                  {productTags.length > 0 ? (
                    <StoreProductTags tags={productTags} className="mb-4" />
                  ) : null}
                  <KxRichTextContent html={product.description} className="kx-prose" />
                </div>

                {hasAccess ? (
                  <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm ring-1 ring-cyan-500/20 dark:border-zinc-800 dark:bg-zinc-950">
                    <h2 className="mb-4 text-xl font-black uppercase tracking-wide text-zinc-900 dark:text-zinc-100">
                      Purchased content
                    </h2>
                    {product.content ? (
                      <div className="mb-8 rounded-xl border border-zinc-100 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
                        <KxRichTextContent html={product.content} className="kx-prose" />
                      </div>
                    ) : null}
                    {product.assetCids && product.assetCids.length > 0 ? (
                      <div className="grid gap-3">
                        {product.assetCids.map((cid, index) => (
                          <a
                            key={cid}
                            href={getBestGatewayUrl(cid)}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-4 transition-all hover:border-cyan-500/30 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                          >
                            <span className="text-sm font-bold group-hover:text-[#02abb8]">
                              {product.assetFileNames?.[index] ?? `Asset file ${index + 1}`}
                            </span>
                            <svg className="h-5 w-5 text-zinc-300 group-hover:text-[#02abb8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {contentTab === 'info' ? <StoreProductInfoSection product={product} /> : null}

            {contentTab === 'modules' ? (
              <div id="store-tab-modules" className="scroll-mt-24 space-y-4">
                <DAppSectionHeader title="Modules" className="mb-0" />
                <p className="kx-body text-zinc-600 dark:text-zinc-400">
                  Optional seller modules such as featured badges, buyer support links, and purchase limits will
                  appear here when enabled on this listing.
                </p>
                {hasAccess ? (
                  <StoreProductPremiumPanel product={product} hasAccess={hasAccess} variant="embedded" />
                ) : null}
              </div>
            ) : null}

            {contentTab === 'seller' ? (
              <div id="store-tab-seller" className="scroll-mt-24">
                <StoreSellerProductsTab product={product} />
              </div>
            ) : null}

            {contentTab === 'comments' ? (
              <div id="store-tab-comments" className="scroll-mt-24">
                <StoreCommentsSection productId={product.id} showSectionHeader />
              </div>
            ) : null}
          </div>
        </SidePanelCollapsedContentWrap>
      </HubPageRightPanelGrid>
    </div>
  );
}
