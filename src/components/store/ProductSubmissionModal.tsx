'use client';

import { useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import { kasToSompis } from '@/lib/kaspa/api';
import { useIPFSUpload } from '@/lib/ipfs/hooks';
import { createProduct } from '@/lib/store/products';
import type { ProductCategory, ProductNetwork } from '@/lib/store/types';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { appendHubActivityEarn } from '@/lib/rewards/appendHubActivityEarn';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';

interface ProductSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const LISTING_FEE_KAS = 50;
const LISTING_FEE_TREASURY = process.env.NEXT_PUBLIC_STORE_TREASURY_ADDRESS || '';

export function ProductSubmissionModal({
  isOpen,
  onClose,
  onSuccess,
}: ProductSubmissionModalProps) {
  const { state, connect } = useKaspaWallet();
  const { upload, uploadJSON, isUploading } = useIPFSUpload();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    priceKAS: '',
    category: 'Software' as ProductCategory,
    network: 'L1' as ProductNetwork,
  });

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [assetFiles, setAssetFiles] = useState<File[]>([]);
  const [thumbnailCid, setThumbnailCid] = useState<string | null>(null);
  const [assetCids, setAssetCids] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'upload' | 'payment' | 'complete'>('form');

  const categories: ProductCategory[] = ['Software', 'Art', 'Music', 'Templates', 'Other'];

  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (2MB limit)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      setError(`Image size exceeds 2MB limit. Please use a smaller image. (Current: ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      e.target.value = ''; // Clear the input
      return;
    }

    setThumbnailFile(file);
    setError(null);

    // Upload thumbnail
    const cid = await upload(file, { filename: file.name });
    if (cid) {
      setThumbnailCid(cid);
    } else {
      setError('Failed to upload thumbnail');
    }
  };

  const handleAssetChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check file sizes (2MB limit per file)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    const oversizedFiles = files.filter(f => f.size > maxSize);

    if (oversizedFiles.length > 0) {
      const fileNames = oversizedFiles.map(f => `${f.name} (${(f.size / 1024 / 1024).toFixed(2)}MB)`).join(', ');
      setError(`Some files exceed 2MB limit: ${fileNames}. Please use smaller files.`);
      e.target.value = ''; // Clear the input
      return;
    }

    setAssetFiles((prev) => [...prev, ...files]);
    setError(null);

    // Upload all files
    const cids: string[] = [];
    for (const file of files) {
      const cid = await upload(file, { filename: file.name });
      if (cid) {
        cids.push(cid);
      }
    }

    setAssetCids((prev) => [...prev, ...cids]);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }
    if (!formData.priceKAS || parseFloat(formData.priceKAS) <= 0) {
      setError('Valid price is required');
      return;
    }
    if (!thumbnailCid) {
      setError('Thumbnail image is required');
      return;
    }
    if (!state.isConnected || !state.address) {
      setError('Please connect your wallet');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setStep('payment');

    try {
      // Pay listing fee
      const sompiAmount = kasToSompis(LISTING_FEE_KAS);
      const transaction = {
        to: LISTING_FEE_TREASURY,
        amount: sompiAmount.toString(),
      };

      const result = await sendKaspaTransaction(state.provider!, transaction);
      if (result.status === 'failed') {
        throw new Error(result.error || 'Listing fee payment failed');
      }

      // Create product
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
          thumbnailCid,
          status: 'active',
        },
        result.txHash
      );

      if (!productResult) {
        throw new Error('Failed to create product');
      }

      const txNorm = extractKaspaTransactionId(result.txHash) ?? result.txHash;
      appendHubActivityEarn({
        walletRaw: state.address,
        source: 'store_product_list',
        redeemableDelta: HUB_EARN_POINTS.storeProductList,
        idempotencyKey: `store:product:${txNorm}`,
        meta: { productId: productResult.product.id },
      });

      // Store the new registry CID for immediate access
      if (typeof window !== 'undefined') {
        localStorage.setItem('store-registry-cid', productResult.registryCid);
      }

      setStep('complete');

      // Call onSuccess to refresh product list
      if (onSuccess) {
        // Small delay to ensure registry is accessible
        setTimeout(() => {
          onSuccess();
        }, 500);
      }

      // Reset form after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit product';
      setError(errorMessage);
      setStep('form');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      content: '',
      priceKAS: '',
      category: 'Software',
      network: 'L1',
    });
    setThumbnailFile(null);
    setAssetFiles([]);
    setThumbnailCid(null);
    setAssetCids([]);
    setError(null);
    setStep('form');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-white dark:bg-zinc-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Submit Product
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          {step === 'form' && (
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="k-label">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="k-input"
                  placeholder="Product title"
                />
              </div>

              {/* Description */}
              <div>
                <label className="k-label">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="k-textarea min-h-[80px]"
                  placeholder="Product description"
                />
              </div>

              {/* Protected Content */}
              <div>
                <label className="k-label">
                  Protected Content (for buyers)
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={4}
                  className="k-textarea min-h-[100px]"
                  placeholder="Content that will be visible only to buyers..."
                />
              </div>

              {/* Price */}
              <div>
                <label className="k-label">
                  Price (KAS) *
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={formData.priceKAS}
                  onChange={(e) => setFormData({ ...formData, priceKAS: e.target.value })}
                  className="k-input"
                  placeholder="0.0000"
                />
              </div>

              {/* Category */}
              <div>
                <label className="k-label">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                  className="k-select"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Network */}
              <div>
                <label className="k-label">
                  Network *
                </label>
                <div className="flex gap-4 p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                  {(['L1', 'L2'] as ProductNetwork[]).map((net) => (
                    <label key={net} className="flex items-center gap-2 cursor-pointer group no-k-style">
                      <input
                        type="radio"
                        name="network"
                        value={net}
                        checked={formData.network === net}
                        onChange={() => setFormData({ ...formData, network: net })}
                        className="w-4 h-4 text-[#02abb8] focus:ring-[#02abb8] bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 no-k-style"
                      />
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-[#02abb8] transition-colors">{net}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Thumbnail */}
              <div>
                <label className="k-label">
                  Thumbnail Image *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="k-input"
                />
                {isUploading && <p className="text-xs text-zinc-500 mt-1">Uploading...</p>}
                {thumbnailCid && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ Thumbnail uploaded</p>
                )}
              </div>

              {/* Product Files */}
              <div>
                <label className="k-label">
                  Product Files
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleAssetChange}
                  className="k-input"
                />
                {isUploading && <p className="text-xs text-zinc-500 mt-1">Uploading...</p>}
                {assetCids.length > 0 && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    ✓ {assetCids.length} file(s) uploaded
                  </p>
                )}
              </div>

              {/* Listing Fee Info */}
              <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Listing fee: <span className="font-semibold">{LISTING_FEE_KAS} KAS</span>
                </p>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isProcessing || !state.isConnected}
                  className="flex-1 px-4 py-2 bg-[#02abb8] hover:bg-[#028a94] disabled:bg-zinc-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  {!state.isConnected ? 'Connect Wallet' : isProcessing ? 'Processing...' : `Submit (${LISTING_FEE_KAS} KAS fee)`}
                </button>
              </div>
            </div>
          )}

          {/* Payment Step */}
          {step === 'payment' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#02abb8] mx-auto mb-4"></div>
              <p className="text-zinc-600 dark:text-zinc-400">Processing payment and creating product...</p>
            </div>
          )}

          {/* Complete Step */}
          {step === 'complete' && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">✓</div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Product Submitted!
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Your product has been listed successfully.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
