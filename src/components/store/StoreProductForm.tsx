'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import { kasToSompis } from '@/lib/kaspa/api';
import { useIPFSUpload } from '@/lib/ipfs/hooks';
import { createProduct, updateProduct } from '@/lib/store/products';
import type { Product, ProductCategory, ProductNetwork, StorePaymentCurrency } from '@/lib/store/types';
import { STORE_PAYMENT_CURRENCIES } from '@/lib/store/currencies';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { appendHubActivityEarn } from '@/lib/rewards/appendHubActivityEarn';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { StoreFileUpload } from '@/components/store/StoreFileUpload';
import { KxFilterDropdown } from '@/components/ui/KxFilterDropdown';
import { KxSegmentToggle } from '@/components/ui/KxSegmentToggle';

const LISTING_FEE_KAS = 50;
export const SELLER_ACTION_FEE_KAS = 1;
const TREASURY = process.env.NEXT_PUBLIC_STORE_TREASURY_ADDRESS || '';

type StoreProductFormProps = {
  product?: Product;
};

export function StoreProductForm({ product }: StoreProductFormProps) {
  const isEdit = Boolean(product);
  const router = useRouter();
  const { state } = useKaspaWallet();
  const { upload, isUploading } = useIPFSUpload();

  const [formData, setFormData] = useState({
    title: product?.title ?? '',
    description: product?.description ?? '',
    content: product?.content ?? '',
    priceKAS: product ? String(product.priceKAS) : '',
    paymentCurrency: (product?.paymentCurrency ?? 'KAS') as StorePaymentCurrency,
    category: (product?.category ?? 'Software') as ProductCategory,
    network: (product?.network ?? 'L1') as ProductNetwork,
  });

  const [thumbnailCid, setThumbnailCid] = useState<string | null>(product?.thumbnailCid ?? null);
  const [thumbnailName, setThumbnailName] = useState<string | null>(null);
  const [assetCids, setAssetCids] = useState<string[]>(product?.assetCids ?? []);
  const [assetFileNames, setAssetFileNames] = useState<string[]>(product?.assetFileNames ?? []);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'payment' | 'complete'>('form');

  const categories: ProductCategory[] = ['Software', 'Art', 'Music', 'Templates', 'Other'];
  const actionFee = isEdit ? SELLER_ACTION_FEE_KAS : LISTING_FEE_KAS;

  const canSubmit = useMemo(
    () =>
      Boolean(
        formData.title.trim() &&
          formData.description.trim() &&
          formData.priceKAS &&
          parseFloat(formData.priceKAS) > 0 &&
          thumbnailCid &&
          state.isConnected,
      ),
    [formData, thumbnailCid, state.isConnected],
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

  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Thumbnail must be under 2MB');
      e.target.value = '';
      return;
    }
    const cid = await upload(file, { filename: file.name });
    if (cid) {
      setThumbnailCid(cid);
      setThumbnailName(file.name);
      setError(null);
    } else {
      setError('Failed to upload thumbnail');
    }
  };

  const handleAssetChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 2 * 1024 * 1024;
    const cids: string[] = [];
    const names: string[] = [];
    for (const file of files) {
      if (file.size > maxSize) {
        setError(`${file.name} exceeds 2MB limit`);
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
    if (!canSubmit || !state.address || !state.provider) return;

    setIsProcessing(true);
    setError(null);
    setStep('payment');

    try {
      const feeTxHash = await payActionFee();

      if (isEdit && product) {
        const result = await updateProduct(product.id, state.address, {
          title: formData.title.trim(),
          description: formData.description.trim(),
          content: formData.content.trim() || undefined,
          priceKAS: parseFloat(formData.priceKAS),
          paymentCurrency: formData.paymentCurrency,
          network: formData.network,
          category: formData.category,
          assetCids,
          assetFileNames,
          thumbnailCid: thumbnailCid!,
        });
        if (!result) throw new Error('Failed to update product');
        if (typeof window !== 'undefined') {
          localStorage.setItem('store-registry-cid', result.registryCid);
        }
      } else {
        const productResult = await createProduct(
          {
            title: formData.title.trim(),
            description: formData.description.trim(),
            content: formData.content.trim() || undefined,
            sellerAddress: state.address,
            priceKAS: parseFloat(formData.priceKAS),
            paymentCurrency: formData.paymentCurrency,
            network: formData.network,
            category: formData.category,
            assetCids,
            assetFileNames,
            thumbnailCid: thumbnailCid!,
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
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-8">
        <div className="space-y-6">
          <div className="k-form-group">
            <label className="k-label">Title *</label>
            <input
              type="text"
              className="k-input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Product title"
              required
            />
          </div>

          <div className="k-form-group">
            <label className="k-label">Description *</label>
            <textarea
              className="k-textarea min-h-[100px]"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your product for buyers"
              required
            />
          </div>

          <div className="k-form-group">
            <label className="k-label">Protected content (buyers only)</label>
            <textarea
              className="k-textarea min-h-[120px]"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="License keys, download instructions, or unlock text..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="k-form-group">
              <label className="k-label">Category *</label>
              <KxFilterDropdown
                value={formData.category}
                onChange={(category) => setFormData({ ...formData, category })}
                options={categories.map((c) => ({ value: c, label: c }))}
                ariaLabel="Product category"
                triggerClassName="k-control-btn w-full min-w-0"
                menuClassName="w-full min-w-[12rem]"
              />
            </div>
            <div className="k-form-group">
              <label className="k-label">Network *</label>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <StoreFileUpload
              label="Thumbnail *"
              hint="PNG, JPG, or WebP under 2MB"
              accept="image/*"
              fileName={thumbnailName ?? (thumbnailCid && !thumbnailName ? 'Uploaded thumbnail' : null)}
              onClear={() => {
                setThumbnailCid(null);
                setThumbnailName(null);
              }}
              onChange={handleThumbnailChange}
              disabled={isUploading}
            />
            <StoreFileUpload
              label="Product files"
              hint="Optional assets, 2MB max each"
              multiple
              fileCount={assetCids.length}
              onChange={handleAssetChange}
              disabled={isUploading}
            />
          </div>
        </div>

        <aside className="xl:sticky xl:top-6 h-fit space-y-4">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-5">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100 mb-4">
              {isEdit ? 'Update listing' : 'Listing fee'}
            </h3>
            <div className="k-form-group mb-4">
              <label className="k-label">Price *</label>
              <input
                type="number"
                step="0.0001"
                min="0"
                className="k-input mb-3"
                value={formData.priceKAS}
                onChange={(e) => setFormData({ ...formData, priceKAS: e.target.value })}
                placeholder="0.0000"
                required
              />
              <label className="k-label">Payment currency *</label>
              <KxSegmentToggle
                value={formData.paymentCurrency}
                onChange={(paymentCurrency) => setFormData({ ...formData, paymentCurrency })}
                options={STORE_PAYMENT_CURRENCIES.map((cur) => ({ value: cur, label: cur }))}
                ariaLabel="Payment currency"
              />
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {isEdit ? 'Update fee' : 'One-time listing fee'}:{' '}
              <span className="font-black text-[#02abb8]">{actionFee} KAS</span>
            </p>
            <p className="text-xs text-zinc-500 mt-2">Paid to the Store treasury when you publish.</p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-800 dark:text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit || isProcessing || isUploading}
            className="w-full k-cta-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
