'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import { kasToSompis } from '@/lib/kaspa/api';
import { useIPFSUpload } from '@/lib/ipfs/hooks';
import { createProduct, updateProduct } from '@/lib/store/products';
import type { Product, ProductCategory, ProductNetwork } from '@/lib/store/types';
import type { StorePaymentCurrency } from '@/lib/store/currencies';
import { useIntegratedTokens } from '@/hooks/useIntegratedToken';
import { usePricingSnapshot } from '@/hooks/usePricingSnapshot';
import { formatKasEq, toKasEq, mergePricingTickers } from '@/lib/pricing';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { creditHubListingEarn } from '@/lib/rewards/creditHubListingEarn';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { contentForRichEditor } from '@/lib/richText/html';
import { getBestGatewayUrl, normalizeIpfsUrlForForm, extractCidFromIpfsUrl } from '@/lib/hub/ipfsStandard';
import { IPFS_MAX_UPLOAD_MB } from '@/lib/ipfs/limits';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';
import { KxFieldCharCount } from '@/components/ui/KxFieldCharCount';
import { HUB_FORM_LIMITS } from '@/lib/hub/formLimits';
import { KxRichTextEditor } from '@/components/ui/KxRichTextEditor';
import { KxImageSourceField } from '@/components/ui/KxImageSourceField';
import { KxFilterDropdown } from '@/components/ui/KxFilterDropdown';
import { KxSegmentToggle } from '@/components/ui/KxSegmentToggle';
import { KxAlertRegion } from '@/components/ui/KxAlertRegion';
import { StorePaymentCurrencyDropdown } from '@/components/payments/StorePaymentCurrencyDropdown';
import {
  buildSellerListingCurrencyOptions,
  toHubPaymentMenuOptions,
} from '@/lib/payments/hubPaymentTypes';
import { StoreSellerBenefitsPanel } from '@/components/store/StoreSellerBenefitsPanel';
import { StoreListingCalculationPanel } from '@/components/store/StoreListingCalculationPanel';
import { HubAsideRail } from '@/components/hub/HubAsideRail';
import { estimateStoreListingQuote } from '@/lib/store/listingQuote';
import { KxInFormPremiumRow } from '@/components/ui/KxInFormPremiumRow';
import { STORE_MODULE_OFFERS, type StoreModuleId } from '@/lib/store/modules';
import { StoreFileUpload } from '@/components/store/StoreFileUpload';
import { parseStoreProductTags, normalizeStoreProductTags } from '@/lib/store/tags';

import { STORE_LISTING_FEE_KAS, STORE_UPDATE_FEE_KAS } from '@/lib/store/listingQuote';
const TREASURY = process.env.NEXT_PUBLIC_STORE_TREASURY_ADDRESS || '';

const FORM_PANEL_CLASS =
  'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8';

const PREMIUM_MODULE_CARD_CLASS =
  'rounded-2xl border-2 border-dashed border-amber-400/60 dark:border-amber-300/40 bg-gradient-to-b from-amber-50/70 to-white dark:from-amber-500/[0.08] dark:to-zinc-900 p-5 sm:p-6 shadow-sm';

type StoreProductFormProps = {
  product?: Product;
};

export function StoreProductForm({ product }: StoreProductFormProps) {
  const isEdit = Boolean(product);
  const router = useRouter();
  const { state } = useKaspaWallet();
  const { balance: krexBalance, tier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const { upload, isUploading } = useIPFSUpload();

  const [formData, setFormData] = useState({
    title: product?.title ?? '',
    priceKAS: product ? String(product.priceKAS) : '',
    paymentCurrency: (product?.paymentCurrency ?? 'KAS') as StorePaymentCurrency,
    category: (product?.category ?? 'Software') as ProductCategory,
    network: (product?.network ?? 'L1') as ProductNetwork,
  });

  const [description, setDescription] = useState(() => contentForRichEditor(product?.description ?? ''));
  const [content, setContent] = useState(() => contentForRichEditor(product?.content ?? ''));
  const [tagsRaw, setTagsRaw] = useState(() => (product?.tags ?? []).join(', '));
  const [thumbnailSource, setThumbnailSource] = useState<'url' | 'file'>('file');
  const [thumbnailUrl, setThumbnailUrl] = useState(
    product?.thumbnailCid ? getBestGatewayUrl(product.thumbnailCid) : '',
  );
  const [thumbnailCid, setThumbnailCid] = useState<string | null>(product?.thumbnailCid ?? null);
  const [thumbnailName, setThumbnailName] = useState<string | null>(null);
  const [assetCids, setAssetCids] = useState<string[]>(product?.assetCids ?? []);
  const [assetFileNames, setAssetFileNames] = useState<string[]>(product?.assetFileNames ?? []);
  const [showPurchaseCount, setShowPurchaseCount] = useState(true);
  const [publicListing, setPublicListing] = useState(true);
  const [enableBuyerComments, setEnableBuyerComments] = useState(false);
  const [enabledModules, setEnabledModules] = useState<Record<StoreModuleId, boolean>>({
    featured_badge: false,
    buyer_support: false,
    purchase_limit: false,
  });
  const [buyerSupportUrl, setBuyerSupportUrl] = useState('');

  const { tokens: integratedStoreTokens } = useIntegratedTokens(state.address, 'store');
  const { snapshot: pricingSnapshot } = usePricingSnapshot(
    mergePricingTickers([
      formData.paymentCurrency,
      ...integratedStoreTokens.map((token) => token.tick),
    ]),
  );

  const paymentCurrencyOptions = useMemo(
    () => toHubPaymentMenuOptions(buildSellerListingCurrencyOptions(integratedStoreTokens)),
    [integratedStoreTokens],
  );

  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'form' | 'payment' | 'complete'>('form');

  const categories: ProductCategory[] = ['Software', 'Art', 'Music', 'Templates', 'Other'];
  const actionFee = isEdit ? STORE_UPDATE_FEE_KAS : STORE_LISTING_FEE_KAS;
  const parsedTags = useMemo(() => parseStoreProductTags(tagsRaw), [tagsRaw]);

  const listingQuote = useMemo(
    () =>
      estimateStoreListingQuote({
        baseFeeKas: actionFee,
        enabledModules,
        krexTier: tier,
        nftStatus,
      }),
    [actionFee, enabledModules, tier, nftStatus],
  );

  const resolvedThumbnailCid = useMemo(
    () => thumbnailCid ?? extractCidFromIpfsUrl(thumbnailUrl.trim()) ?? null,
    [thumbnailCid, thumbnailUrl],
  );

  const canSubmit = useMemo(
    () =>
      Boolean(
        formData.title.trim() &&
          description.trim() &&
          formData.priceKAS &&
          parseFloat(formData.priceKAS) > 0 &&
          resolvedThumbnailCid &&
          state.isConnected,
      ),
    [formData, description, resolvedThumbnailCid, state.isConnected],
  );

  const payActionFee = async () => {
    if (!state.provider) throw new Error('Wallet not connected');
    const result = await sendKaspaTransaction(state.provider, {
      to: TREASURY,
      amount: kasToSompis(listingQuote.totalKas).toString(),
    });
    if (result.status === 'failed') throw new Error(result.error || 'Payment failed');
    return result.txHash;
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = IPFS_MAX_UPLOAD_MB * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`Thumbnail must be under ${IPFS_MAX_UPLOAD_MB}MB`);
      e.target.value = '';
      return;
    }
    const cid = await upload(file, { filename: file.name });
    if (cid) {
      setThumbnailCid(cid);
      setThumbnailName(file.name);
      setThumbnailUrl(normalizeIpfsUrlForForm(null, cid));
      setThumbnailSource('url');
      setError(null);
    } else {
      setError('Failed to upload thumbnail');
    }
    e.target.value = '';
  };

  const handleAssetChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSize = IPFS_MAX_UPLOAD_MB * 1024 * 1024;
    const cids: string[] = [];
    const names: string[] = [];
    for (const file of files) {
      if (file.size > maxSize) {
        setError(`${file.name} exceeds ${IPFS_MAX_UPLOAD_MB}MB limit`);
        continue;
      }
      const cid = await upload(file, { filename: file.name });
      if (cid) {
        cids.push(cid);
        names.push(file.name);
      }
    }
    if (cids.length) {
      setAssetCids((prev) => [...prev, ...cids]);
      setAssetFileNames((prev) => [...prev, ...names]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !state.address || !state.provider || !resolvedThumbnailCid) return;

    if (enabledModules.buyer_support && !buyerSupportUrl.trim()) {
      setError('Buyer support URL is required when the Buyer Support module is enabled.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setStep('payment');

    try {
      const feeTxHash = await payActionFee();
      const descriptionPayload = description.trim();
      const contentPayload = content.trim() || undefined;
      const tagsPayload = normalizeStoreProductTags(parsedTags);

      if (isEdit && product) {
        const result = await updateProduct(product.id, state.address, {
          title: formData.title.trim(),
          description: descriptionPayload,
          content: contentPayload,
          priceKAS: parseFloat(formData.priceKAS),
          paymentCurrency: formData.paymentCurrency,
          network: formData.network,
          category: formData.category,
          assetCids,
          assetFileNames,
          thumbnailCid: resolvedThumbnailCid,
          tags: tagsPayload,
        });
        if (!result) throw new Error('Failed to update product');
        if (typeof window !== 'undefined') {
          localStorage.setItem('store-registry-cid', result.registryCid);
        }
      } else {
        const productResult = await createProduct(
          {
            title: formData.title.trim(),
            description: descriptionPayload,
            content: contentPayload,
            sellerAddress: state.address,
            priceKAS: parseFloat(formData.priceKAS),
            paymentCurrency: formData.paymentCurrency,
            network: formData.network,
            category: formData.category,
            assetCids,
            assetFileNames,
            thumbnailCid: resolvedThumbnailCid,
            tags: tagsPayload,
            status: 'active',
          },
          feeTxHash,
        );
        if (!productResult) throw new Error('Failed to create product');

        const txNorm = extractKaspaTransactionId(feeTxHash) ?? feeTxHash;
        creditHubListingEarn({
          walletRaw: state.address,
          source: 'store_product_list',
          redeemableDelta: HUB_EARN_POINTS.storeProductList,
          krexBalance,
          krexTier: tier,
          idempotencyKey: `store:product:${txNorm}`,
          txHash: txNorm,
          meta: { productId: productResult.product.id },
        });

        if (typeof window !== 'undefined') {
          localStorage.setItem('store-registry-cid', productResult.registryCid);
        }
      }

      setStep('complete');
      setTimeout(() => router.push('/store/dashboard?tab=products'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit product');
      setStep('form');
    } finally {
      setIsProcessing(false);
    }
  };

  if (step === 'payment') {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-6" />
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">
          {isEdit ? 'Processing update payment...' : 'Processing listing payment...'}
        </p>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">✓</div>
        <p className="text-zinc-900 dark:text-zinc-100 font-black uppercase tracking-widest">
          {isEdit ? 'Product updated' : 'Product listed'}
        </p>
        <p className="text-sm text-zinc-500 mt-2">Redirecting to your dashboard...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 items-stretch xl:grid-cols-[minmax(0,1fr)_340px] gap-6">
      <div className="flex flex-col gap-6 min-w-0">
        <div className={`${FORM_PANEL_CLASS} space-y-6`}>
          <div>
            <DAppSectionHeader title="Main content" className="mb-3" />
            <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-4 tracking-tight">
              {isEdit ? 'Edit product' : 'List new product'}
            </h3>
            <p className="kx-body">
              {isEdit
                ? `Update your listing. A ${actionFee} KAS fee applies when you save changes.`
                : `Add product details buyers see on the Store. Listing fee: ${STORE_LISTING_FEE_KAS} KAS.`}
            </p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <KxFormFieldLabel required>Title</KxFormFieldLabel>
              <KxFieldCharCount
                value={formData.title}
                max={HUB_FORM_LIMITS.title.max}
                min={HUB_FORM_LIMITS.title.min}
              />
            </div>
            <input
              type="text"
              className="k-input text-base"
              value={formData.title}
              maxLength={HUB_FORM_LIMITS.title.max}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Product title"
              required
              disabled={isProcessing}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <KxFormFieldLabel required>Price</KxFormFieldLabel>
              <input
                type="number"
                step="0.0001"
                min="0"
                className="k-input"
                value={formData.priceKAS}
                onChange={(e) => setFormData({ ...formData, priceKAS: e.target.value })}
                placeholder="0.0000"
                required
                disabled={isProcessing}
              />
            </div>
            <div>
              <KxFormFieldLabel>Listed payment currency</KxFormFieldLabel>
              <StorePaymentCurrencyDropdown
                value={formData.paymentCurrency}
                onChange={(paymentCurrency) =>
                  setFormData({ ...formData, paymentCurrency: paymentCurrency as StorePaymentCurrency })
                }
                options={paymentCurrencyOptions}
                ariaLabel="Listed payment currency"
              />
              {formData.paymentCurrency !== 'KAS' && formData.priceKAS && pricingSnapshot ? (
                <p className="text-xs text-zinc-500 mt-2">
                  {(() => {
                    const amount = parseFloat(formData.priceKAS);
                    if (!Number.isFinite(amount) || amount <= 0) return null;
                    const kasEq = toKasEq(amount, formData.paymentCurrency, pricingSnapshot);
                    return kasEq != null ? `Listed value: ${formatKasEq(kasEq)}` : null;
                  })()}
                </p>
              ) : null}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <KxFormFieldLabel required>Description</KxFormFieldLabel>
              <KxFieldCharCount
                value={description.replace(/<[^>]*>/g, '')}
                max={HUB_FORM_LIMITS.content.max}
                min={HUB_FORM_LIMITS.shortDescription.min}
              />
            </div>
            <KxRichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Describe your product for buyers..."
              minRows={6}
              maxLength={HUB_FORM_LIMITS.content.max}
              disabled={isProcessing || isUploading}
            />
          </div>

          <div>
            <KxFormFieldLabel>Protected content (buyers only)</KxFormFieldLabel>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-2">
              License keys, download links, or unlock instructions visible only after purchase.
            </p>
            <KxRichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Content unlocked after purchase..."
              minRows={8}
              disabled={isProcessing || isUploading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <KxFormFieldLabel>Category</KxFormFieldLabel>
              <KxFilterDropdown
                value={formData.category}
                onChange={(category) => setFormData({ ...formData, category })}
                options={categories.map((c) => ({ value: c, label: c }))}
                ariaLabel="Product category"
                triggerClassName="k-field-trigger w-full min-w-0"
                menuClassName="w-full min-w-[12rem]"
              />
            </div>
            <div>
              <KxFormFieldLabel>Network</KxFormFieldLabel>
              <KxSegmentToggle
                value={formData.network}
                onChange={(network) => setFormData({ ...formData, network })}
                options={[
                  { value: 'L1', label: 'L1' },
                  { value: 'L2', label: 'L2' },
                ]}
                ariaLabel="Product network"
              />
            </div>
          </div>

          <div>
            <KxFormFieldLabel>Tags (comma-separated)</KxFormFieldLabel>
            <input
              type="text"
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              placeholder="tag1, tag2, tag3"
              className="k-input"
              disabled={isProcessing}
            />
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Tags appear on the product page and help buyers find your listing in the Store sidebar filter.
            </p>
          </div>

          <div className="k-form-group !mb-0">
            <KxFormFieldLabel>
              Thumbnail <span className="text-red-500">*</span>
            </KxFormFieldLabel>
            <KxImageSourceField
              source={thumbnailSource}
              onSourceChange={setThumbnailSource}
              url={thumbnailUrl}
              onUrlChange={(next) => {
                setThumbnailUrl(normalizeIpfsUrlForForm(next));
                setThumbnailCid(null);
                setThumbnailName(null);
              }}
              urlPlaceholder="https://..."
              urlHint="Direct HTTPS image URL, or upload to IPFS below."
              fileName={
                thumbnailName ??
                (thumbnailCid && !thumbnailName ? 'Uploaded thumbnail' : null)
              }
              onClearFile={() => {
                setThumbnailCid(null);
                setThumbnailName(null);
              }}
              onFileChange={handleThumbnailUpload}
              uploadHint={`PNG, JPG, or WebP under ${IPFS_MAX_UPLOAD_MB} MB`}
              isUploading={isUploading}
              inputClassName="k-input"
            />
          </div>

          <StoreFileUpload
            label="Product files"
            hint={`Optional assets, ${IPFS_MAX_UPLOAD_MB}MB max each`}
            multiple
            fileCount={assetCids.length}
            onChange={handleAssetChange}
            disabled={isUploading || isProcessing}
          />

          <KxAlertRegion>
            {error ? (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            ) : null}
          </KxAlertRegion>
        </div>

        <div className={`${FORM_PANEL_CLASS} space-y-4`}>
          <div>
            <DAppSectionHeader title="Advanced options" className="mb-0" />
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Control how your listing appears and behaves on the Store.
            </p>
          </div>
          <div className="space-y-2">
            <KxInFormPremiumRow
              title="Public listing"
              description="Show this product in Store browse grids and search results."
              checked={publicListing}
              disabled={isProcessing || isUploading}
              onToggle={() => setPublicListing((v) => !v)}
            />
            <KxInFormPremiumRow
              title="Show purchase count"
              description="Display how many times this product has been purchased."
              checked={showPurchaseCount}
              disabled={isProcessing || isUploading}
              onToggle={() => setShowPurchaseCount((v) => !v)}
            />
            <KxInFormPremiumRow
              title="Enable buyer comments"
              description="Allow verified buyers to leave comments on your product page."
              checked={enableBuyerComments}
              disabled={isProcessing || isUploading}
              onToggle={() => setEnableBuyerComments((v) => !v)}
            />
          </div>
        </div>

        <div
          id="store-dashboard-modules"
          className={`${FORM_PANEL_CLASS} scroll-mt-24 my-2 py-10 sm:py-12 space-y-6`}
        >
          <div className="space-y-2">
            <DAppSectionHeader title="Premium modules" className="mb-0" />
            <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              Optional seller modules
            </h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Toggle modules on to enhance your listing. Store module billing will roll out in a future update.
            </p>
          </div>
          {STORE_MODULE_OFFERS.map((offer) => {
            const enabled = enabledModules[offer.id];
            return (
              <div key={offer.id} className={PREMIUM_MODULE_CARD_CLASS}>
                <KxInFormPremiumRow
                  flat
                  title={offer.title}
                  description={offer.description}
                  priceLabel={offer.unlockPriceKas > 0 ? `+${offer.unlockPriceKas} KAS` : 'Free'}
                  checked={enabled}
                  disabled={isProcessing || isUploading}
                  onToggle={() =>
                    setEnabledModules((prev) => ({ ...prev, [offer.id]: !prev[offer.id] }))
                  }
                />
                {enabled && offer.id === 'buyer_support' ? (
                  <div className="pt-4 mt-4 border-t border-zinc-200 dark:border-zinc-700">
                    <KxFormFieldLabel>Support URL</KxFormFieldLabel>
                    <input
                      type="url"
                      className="k-input"
                      value={buyerSupportUrl}
                      onChange={(e) => setBuyerSupportUrl(e.target.value)}
                      placeholder="https://..."
                      disabled={isProcessing || isUploading}
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <HubAsideRail adSlotId="HALO_STORE_RIGHT" adId="ad-slot-store-listing-form-rail">
        <StoreSellerBenefitsPanel />

        <StoreListingCalculationPanel
          quote={listingQuote}
          isEdit={isEdit}
          tier={tier}
          krexBalance={krexBalance}
          flowBusy={isProcessing || isUploading}
          footer={
            <>
              <button
                type="submit"
                disabled={!canSubmit || isProcessing || isUploading || !resolvedThumbnailCid}
                className="w-full k-control-btn !bg-[#02abb8] !text-white !border-[#02abb8] hover:!bg-[#028a94] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading
                  ? 'Uploading...'
                  : isProcessing
                    ? 'Processing...'
                    : isEdit
                      ? `Save changes (${listingQuote.totalKas} KAS fee)`
                      : `Publish (${listingQuote.totalKas} KAS fee)`}
              </button>
            </>
          }
        />
        </HubAsideRail>
    </form>
  );
}
