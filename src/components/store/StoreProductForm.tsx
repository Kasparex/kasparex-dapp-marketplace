'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import { kasToSompis } from '@/lib/kaspa/api';
import { useIPFSUpload } from '@/lib/ipfs/hooks';
import { createProduct } from '@/lib/store/products';
import type { ProductCategory, ProductNetwork } from '@/lib/store/types';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { appendHubActivityEarn } from '@/lib/rewards/appendHubActivityEarn';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';

const LISTING_FEE_KAS = 50;
const LISTING_FEE_TREASURY = process.env.NEXT_PUBLIC_STORE_TREASURY_ADDRESS || '';

export function StoreProductForm() {
  const router = useRouter();
  const { state } = useKaspaWallet();
  const { upload, isUploading } = useIPFSUpload();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    priceKAS: '',
    category: 'Software' as ProductCategory,
    network: 'L1' as ProductNetwork,
  });

  const [thumbnailCid, setThumbnailCid] = useState<string | null>(null);
  const [assetCids, setAssetCids] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'payment' | 'complete'>('form');

  const categories: ProductCategory[] = ['Software', 'Art', 'Music', 'Templates', 'Other'];

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
      setError(null);
    } else {
      setError('Failed to upload thumbnail');
    }
  };

  const handleAssetChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 2 * 1024 * 1024;
    const cids: string[] = [];
    for (const file of files) {
      if (file.size > maxSize) {
        setError(`${file.name} exceeds 2MB limit`);
        continue;
      }
      const cid = await upload(file, { filename: file.name });
      if (cid) cids.push(cid);
    }
    if (cids.length) setAssetCids((prev) => [...prev, ...cids]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !state.address || !state.provider) return;

    setIsProcessing(true);
    setError(null);
    setStep('payment');

    try {
      const result = await sendKaspaTransaction(state.provider, {
        to: LISTING_FEE_TREASURY,
        amount: kasToSompis(LISTING_FEE_KAS).toString(),
      });

      if (result.status === 'failed') throw new Error(result.error || 'Listing fee payment failed');

      const productResult = await createProduct(
        {
          title: formData.title.trim(),
          description: formData.description.trim(),
          content: formData.content.trim() || undefined,
          sellerAddress: state.address,
          priceKAS: parseFloat(formData.priceKAS),
          network: formData.network,
          category: formData.category,
          assetCids,
          thumbnailCid: thumbnailCid!,
          status: 'active',
        },
        result.txHash,
      );

      if (!productResult) throw new Error('Failed to create product');

      const txNorm = extractKaspaTransactionId(result.txHash) ?? result.txHash;
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
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">Processing listing payment...</p>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">✓</div>
        <p className="text-zinc-900 dark:text-zinc-100 font-black uppercase tracking-widest">Product listed</p>
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
              <select
                className="k-select"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="k-form-group">
              <label className="k-label">Network *</label>
              <div className="k-control-group h-10 p-1 w-full">
                {(['L1', 'L2'] as ProductNetwork[]).map((net) => (
                  <button
                    key={net}
                    type="button"
                    onClick={() => setFormData({ ...formData, network: net })}
                    className={`flex-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                      formData.network === net
                        ? 'bg-[#02abb8] text-white shadow-sm'
                        : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {net}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="k-form-group">
              <label className="k-label">Thumbnail *</label>
              <input type="file" accept="image/*" onChange={handleThumbnailChange} className="k-input" />
              {thumbnailCid && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Thumbnail uploaded</p>}
            </div>
            <div className="k-form-group">
              <label className="k-label">Product files</label>
              <input type="file" multiple onChange={handleAssetChange} className="k-input" />
              {assetCids.length > 0 && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{assetCids.length} file(s) uploaded</p>
              )}
            </div>
          </div>
        </div>

        <aside className="xl:sticky xl:top-6 h-fit space-y-4">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-5">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100 mb-4">Listing fee</h3>
            <div className="k-form-group mb-4">
              <label className="k-label">Price (KAS) *</label>
              <input
                type="number"
                step="0.0001"
                min="0"
                className="k-input"
                value={formData.priceKAS}
                onChange={(e) => setFormData({ ...formData, priceKAS: e.target.value })}
                placeholder="0.0000"
                required
              />
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              One-time listing fee: <span className="font-black text-[#02abb8]">{LISTING_FEE_KAS} KAS</span>
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
            {isUploading ? 'Uploading...' : isProcessing ? 'Processing...' : `Publish (${LISTING_FEE_KAS} KAS fee)`}
          </button>
        </aside>
      </div>
    </form>
  );
}
