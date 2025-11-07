'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DApp } from '@/lib/dapps';
import { useTreasuryPayment } from '@/hooks/useTreasuryPayment';
import { useAccount } from 'wagmi';
import { isDeployer } from '@/lib/dapps/deployer';

interface FeaturedImageUploadModalProps {
  dapp: DApp;
  contractAddress?: string;
  deployerAddress?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function FeaturedImageUploadModal({
  dapp,
  contractAddress,
  deployerAddress,
  onClose,
  onSuccess,
}: FeaturedImageUploadModalProps) {
  const { address: connectedAddress, isConnected } = useAccount();
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [previewLoaded, setPreviewLoaded] = useState(false);

  // Check if user is deployer
  const isDeployerUser = deployerAddress && connectedAddress
    ? isDeployer(connectedAddress, deployerAddress)
    : false;

  // Treasury payment hook
  const {
    pay,
    isPaying,
    isConfirming,
    isSuccess,
    error: paymentError,
    treasuryAddress,
    isTreasuryAvailable,
  } = useTreasuryPayment({
    amount: '10',
    onSuccess: (txHash) => {
      // Save image URL to localStorage
      if (imageUrl.trim()) {
        try {
          const key = `dapp_${dapp.id}_featuredImage`;
          localStorage.setItem(key, imageUrl.trim());
          
          // Trigger success callback
          if (onSuccess) {
            onSuccess();
          }
          
          // Close modal after short delay
          setTimeout(() => {
            onClose();
            window.location.reload();
          }, 1500);
        } catch (err) {
          console.error('Error saving featured image:', err);
          setError('Failed to save image URL');
        }
      }
    },
    onError: (err) => {
      setError(err.message || 'Payment failed');
    },
  });

  // Validate image URL
  const validateImageUrl = (url: string): boolean => {
    if (!url.trim()) return false;
    try {
      const parsedUrl = new URL(url);
      return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  };

  // Handle image load error
  const handleImageError = () => {
    setImageError(true);
    setPreviewLoaded(false);
  };

  // Handle image load success
  const handleImageLoad = () => {
    setImageError(false);
    setPreviewLoaded(true);
  };

  // Handle save
  const handleSave = async () => {
    setError(null);

    if (!isConnected || !connectedAddress) {
      setError('Please connect your wallet');
      return;
    }

    if (!isDeployerUser) {
      setError('Only the dApp deployer can upload images');
      return;
    }

    if (!validateImageUrl(imageUrl)) {
      setError('Please enter a valid image URL (http:// or https://)');
      return;
    }

    if (!isTreasuryAvailable) {
      setError('Treasury address not available for this network');
      return;
    }

    // Make payment
    await pay();
  };

  // Handle delete
  const handleDelete = () => {
    if (!isDeployerUser) {
      setError('Only the dApp deployer can delete images');
      return;
    }

    try {
      const key = `dapp_${dapp.id}_featuredImage`;
      localStorage.removeItem(key);
      
      if (onSuccess) {
        onSuccess();
      }
      
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 500);
    } catch (err) {
      console.error('Error deleting featured image:', err);
      setError('Failed to delete image');
    }
  };

  // Load existing image URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const key = `dapp_${dapp.id}_featuredImage`;
        const stored = localStorage.getItem(key);
        if (stored) {
          setImageUrl(stored);
        } else if (dapp.featuredImage) {
          setImageUrl(dapp.featuredImage);
        }
      } catch (err) {
        console.error('Error loading featured image:', err);
      }
    }
  }, [dapp.id, dapp.featuredImage]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPaying && !isConfirming) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose, isPaying, isConfirming]);

  const isLoading = isPaying || isConfirming;
  const displayError = error || paymentError;
  const currentImageUrl = imageUrl.trim() || dapp.featuredImage;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={!isLoading ? onClose : undefined}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                Upload Featured Image
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Upload a featured image for {dapp.name}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors disabled:opacity-50"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Error Message */}
          {displayError && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {displayError}
            </div>
          )}

          {/* Success Message */}
          {isSuccess && (
            <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 text-sm">
              Image uploaded successfully!
            </div>
          )}

          {/* Image Requirements */}
          <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Image Requirements
            </h3>
            <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
              <li>• Aspect Ratio: 16:9 (recommended)</li>
              <li>• Minimum Size: 800x450px</li>
              <li>• Maximum Size: 1920x1080px</li>
              <li>• Formats: PNG, JPG, JPEG, WebP</li>
              <li>• Must be accessible via public URL (http:// or https://)</li>
            </ul>
          </div>

          {/* URL Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Image URL
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setImageError(false);
                setPreviewLoaded(false);
              }}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
              disabled={isLoading}
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Enter a publicly accessible image URL
            </p>
          </div>

          {/* Preview Section */}
          {currentImageUrl && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                Preview
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* dApp Page Preview */}
                <div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">dApp Page</p>
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                    {imageError ? (
                      <div className="w-full h-full flex items-center justify-center bg-red-50 dark:bg-red-900/20">
                        <p className="text-xs text-red-600 dark:text-red-400">Failed to load</p>
                      </div>
                    ) : (
                      <img
                        src={currentImageUrl}
                        alt="Preview"
                        onError={handleImageError}
                        onLoad={handleImageLoad}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </div>

                {/* dApp Card Preview */}
                <div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">dApp Card</p>
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                    {imageError ? (
                      <div className="w-full h-full flex items-center justify-center bg-red-50 dark:bg-red-900/20">
                        <p className="text-xs text-red-600 dark:text-red-400">Failed to load</p>
                      </div>
                    ) : (
                      <>
                        <img
                          src={currentImageUrl}
                          alt="Preview"
                          onError={handleImageError}
                          onLoad={handleImageLoad}
                          className="w-full h-full object-cover opacity-30"
                        />
                        <div className="absolute inset-0 bg-zinc-900/50 flex items-center justify-center">
                          <div className="text-center p-2">
                            <p className="text-xs font-semibold text-white mb-1">{dapp.name}</p>
                            <p className="text-xs text-zinc-300">Category • Version</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Widget Preview */}
                <div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">Widget</p>
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                    {imageError ? (
                      <div className="w-full h-full flex items-center justify-center bg-red-50 dark:bg-red-900/20">
                        <p className="text-xs text-red-600 dark:text-red-400">Failed to load</p>
                      </div>
                    ) : (
                      <img
                        src={currentImageUrl}
                        alt="Preview"
                        onError={handleImageError}
                        onLoad={handleImageLoad}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <div>
              {currentImageUrl && (
                <button
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  Delete Image
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading || !validateImageUrl(imageUrl) || !isTreasuryAvailable || !isDeployerUser}
                className="px-4 py-2 text-sm font-medium text-white bg-[#02abb8] hover:bg-[#0299a3] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (isConfirming ? 'Confirming...' : 'Processing...') : 'Save & Pay 10 KAS'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof window === 'undefined') {
    return null;
  }

  return createPortal(modalContent, document.body);
}

