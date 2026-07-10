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
import { appendHubActivityEarn } from '@/lib/rewards/appendHubActivityEarn';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { contentForRichEditor } from '@/lib/richText/html';
import { getBestGatewayUrl, normalizeIpfsUrlForForm, extractCidFromIpfsUrl } from '@/lib/hub/ipfsStandard';
import { IPFS_MAX_UPLOAD_MB } from '@/lib/ipfs/limits';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';
import { KxRichTextEditor } from '@/components/ui/KxRichTextEditor';
import { KxImageSourceField } from '@/components/ui/KxImageSourceField';
import { KxFilterDropdown } from '@/components/ui/KxFilterDropdown';
import { KxSegmentToggle } from '@/components/ui/KxSegmentToggle';
import { KxAlertRegion } from '@/components/ui/KxAlertRegion';
import { HubPaymentCurrencyDropdown } from '@/components/payments/HubPaymentCurrencyDropdown';
import {
  buildSellerListingCurrencyOptions,
  toHubPaymentMenuOptions,
} from '@/lib/payments/hubPaymentTypes';
import { StoreDashboardBenefitsPanel } from '@/components/store/StoreDashboardBenefitsPanel';
import { StoreFileUpload } from '@/components/store/StoreFileUpload';

const LISTING_FEE_KAS = 50;
export const SELLER_ACTION_FEE_KAS = 1;
const TREASURY = process.env.NEXT_PUBLIC_STORE_TREASURY_ADDRESS || '';

const FORM_PANEL_CLASS =
  'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8';

type StoreProductFormProps = {
  product?: Product;
};

export function StoreProductForm({ product }: StoreProductFormProps) {
  const isEdit = Boolean(product);
  const router = useRouter();
  const { state } = useKaspaWallet();
  const { balance: krexBalance } = useKREXBalance();
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
  const [thumbnailSource, setThumbnailSource] = useState<'url' | 'file'>('file');
  const [thumbnailUrl, setThumbnailUrl] = useState(
    product?.thumbnailCid ? getBestGatewayUrl(product.thumbnailCid) : '',
  );
  const [thumbnailCid, setThumbnailCid] = useState<string | null>(product?.thumbnailCid ?? null);
  const [thumbnailName, setThumbnailName] = useState<string | null>(null);
  const [assetCids, setAssetCids] = useState<string[]>(product?.assetCids ?? []);
  const [assetFileNames, setAssetFileNames] = useState<string[]>(product?.assetFileNames ?? []);

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
  const actionFee = isEdit ? SELLER_ACTION_FEE_KAS : LISTING_FEE_KAS;

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
      amount: kasToSompis(actionFee).toString(),
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

    setIsProcessing(true);
    setError(null);
    setStep('payment');

    try {
      const feeTxHash = await payActionFee();
      const descriptionPayload = description.trim();
      const contentPayload = content.trim() || undefined;

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
            status: 'active',
          },
          feeTxHash,
        );
        if (!productResult) throw new Error('Failed to create product');

        const txNorm = extractKaspaTransactionId(feeTxHash) ?? feeTxHash;
        appendHubActivityEarn({
          walletRaw: state.address,
          source: 'store_product_list',
          redeemableDelta: HUB_EARN_POINTS.storeProductList,
          krexBalance,
          idempotencyKey: `store:product:${txNorm}`,
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
    <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
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
                : `Add product details buyers see on the Store. Listing fee: ${LISTING_FEE_KAS} KAS.`}
            </p>
          </div>

          <div>
            <KxFormFieldLabel>
              Title <span className="text-red-500">*</span>
            </KxFormFieldLabel>
            <input
              type="text"
              className="k-input text-base"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Product title"
              required
              disabled={isProcessing}
            />
          </div>

          <div>
            <KxFormFieldLabel>
              Description <span className="text-red-500">*</span>
            </KxFormFieldLabel>
            <KxRichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Describe your product for buyers..."
              minRows={6}
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
                triggerClassName="k-control-btn w-full min-w-0"
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
      </div>

      <div className="flex flex-col gap-4 xl:sticky xl:top-6">
        <StoreDashboardBenefitsPanel />

        <aside className="flex flex-col bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-[0_10px_30px_-18px_rgba(2,171,184,0.4)]">
          <DAppSectionHeader title="Listing & pricing" className="mb-1" />

          <div>
            <KxFormFieldLabel>
              Price <span className="text-red-500">*</span>
            </KxFormFieldLabel>
            <input
              type="number"
              step="0.0001"
              min="0"
              className="k-input mb-3"
              value={formData.priceKAS}
              onChange={(e) => setFormData({ ...formData, priceKAS: e.target.value })}
              placeholder="0.0000"
              required
              disabled={isProcessing}
            />
            <KxFormFieldLabel>Listed payment currency</KxFormFieldLabel>
            <HubPaymentCurrencyDropdown
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

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-3">
            <p className="text-xs uppercase tracking-widest text-zinc-500">
              {isEdit ? 'Update fee' : 'Listing fee'}
            </p>
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tabular-nums">
              {actionFee} KAS
            </p>
          </div>

          <div className="rounded-xl bg-[#02abb8]/10 border border-[#02abb8]/25 p-3 text-sm text-zinc-700 dark:text-zinc-300">
            Listing fees are paid in KAS to the Store treasury. Buyers can pay in KAS or any verified
            token you have enabled under Kasparex Tokens utility.
          </div>

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
                  ? `Save changes (${actionFee} KAS fee)`
                  : `Publish (${actionFee} KAS fee)`}
          </button>
        </aside>
      </div>
    </form>
  );
}
