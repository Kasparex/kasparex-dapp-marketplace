'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { collections } from '@/lib/nft/collections';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import { BRIDGE_URLS } from '@/lib/walletUi';

interface NFTBuyWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

type WizardStep = 'select' | 'buy' | 'bridge' | 'complete';

export function NFTBuyWizard({ isOpen, onClose }: NFTBuyWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('select');
  const [selectedCollection, setSelectedCollection] = useState<'KREXPRIME' | 'PIXELKREX' | null>(null);
  const [collectionImages, setCollectionImages] = useState<Record<string, string | null>>({
    KREXPRIME: null,
    PIXELKREX: null,
  });

  const steps = [
    { id: 'select' as WizardStep, title: 'Select Collection', number: 1 },
    { id: 'buy' as WizardStep, title: 'Buy on L1', number: 2 },
    { id: 'bridge' as WizardStep, title: 'Bridge to L2', number: 3 },
    { id: 'complete' as WizardStep, title: 'Complete', number: 4 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const canGoToStep = (step: WizardStep): boolean => {
    if (step === 'select') return true;
    if (step === 'buy') return Boolean(selectedCollection);
    if (step === 'bridge') return Boolean(selectedCollection);
    if (step === 'complete') return Boolean(selectedCollection);
    return false;
  };

  const handleNext = () => {
    if (currentStep === 'select' && selectedCollection) {
      setCurrentStep('buy');
    } else if (currentStep === 'buy') {
      setCurrentStep('bridge');
    } else if (currentStep === 'bridge') {
      setCurrentStep('complete');
    }
  };

  const handleBack = () => {
    if (currentStep === 'buy') {
      setCurrentStep('select');
    } else if (currentStep === 'bridge') {
      setCurrentStep('buy');
    } else if (currentStep === 'complete') {
      setCurrentStep('bridge');
    }
  };

  const handleReset = () => {
    setCurrentStep('select');
    setSelectedCollection(null);
  };

  const getCollectionUrl = () => {
    if (selectedCollection === 'KREXPRIME') {
      return 'https://www.kaspa.com/nft/collections/KREXPRIME';
    }
    return 'https://www.kaspa.com/nft/collections/PIXELKREX';
  };

  const bridgeUrl = BRIDGE_URLS.nftBridge;

  // Load collection images from IPFS
  useEffect(() => {
    if (!isOpen) return;

    const loadCollectionImages = async () => {
      const images: Record<string, string | null> = {};

      for (const [collectionId, collection] of Object.entries(collections)) {
        if (collectionId !== 'KREXPRIME' && collectionId !== 'PIXELKREX') continue;

        try {
          // Try to load first NFT image as collection preview
          const firstMetadataUrl = `${collection.baseUri.replace('ipfs://', '')}/1.json`;
          const response = await fetch(`/api/ipfs?path=${encodeURIComponent(firstMetadataUrl)}`);
          if (response.ok) {
            const metadata = await response.json();
            if (metadata.image) {
              const imgUrl = metadata.image.startsWith('ipfs://')
                ? getBestGatewayUrl(metadata.image.replace('ipfs://', ''))
                : metadata.image;
              images[collectionId] = imgUrl;
            }
          }
        } catch (error) {
          console.warn(`Failed to load collection image for ${collectionId}:`, error);
          images[collectionId] = null;
        }
      }

      setCollectionImages(images);
    };

    loadCollectionImages();
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <>
      <div className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-md" onClick={onClose} />

      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        {/* Modal Content */}
        <div
          className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Buy or Bridge NFTs
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Buy on L1 (KaspaCom) and bridge to L2 (optional)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Steps (clickable) */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (!canGoToStep(step.id)) return;
                      setCurrentStep(step.id);
                    }}
                    disabled={!canGoToStep(step.id)}
                    className="flex flex-col items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    title={canGoToStep(step.id) ? `Open step: ${step.title}` : 'Complete previous steps first'}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                        index <= currentStepIndex
                          ? 'bg-[#02abb8] text-white'
                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {index < currentStepIndex ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        step.number
                      )}
                    </div>
                    <span
                      className={`text-xs mt-2 text-center ${
                        index <= currentStepIndex
                          ? 'text-zinc-900 dark:text-zinc-100 font-medium'
                          : 'text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                      {step.title}
                    </span>
                  </button>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 transition-colors ${
                      index < currentStepIndex
                        ? 'bg-[#02abb8]'
                        : 'bg-zinc-200 dark:bg-zinc-800'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6">
          {/* Step 1: Select Collection */}
          {currentStep === 'select' && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                Choose a Collection
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setSelectedCollection('KREXPRIME')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedCollection === 'KREXPRIME'
                      ? 'border-[#02abb8] bg-[#02abb8]/10 dark:bg-[#02abb8]/20'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {collectionImages.KREXPRIME ? (
                      <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                        <img
                          src={collectionImages.KREXPRIME}
                          alt="KREXPRIME"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-2xl">
                        👑
                      </div>
                    )}
                    <div className="text-left flex-1">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                        KREXPRIME
                      </div>
                      <div className="text-xs text-zinc-600 dark:text-zinc-400">
                        Poster-style NFT Collection
                      </div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setSelectedCollection('PIXELKREX')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedCollection === 'PIXELKREX'
                      ? 'border-[#02abb8] bg-[#02abb8]/10 dark:bg-[#02abb8]/20'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {collectionImages.PIXELKREX ? (
                      <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                        <img
                          src={collectionImages.PIXELKREX}
                          alt="PIXELKREX"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-2xl">
                        🎨
                      </div>
                    )}
                    <div className="text-left flex-1">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                        PIXELKREX
                      </div>
                      <div className="text-xs text-zinc-600 dark:text-zinc-400">
                        Pixel Art NFT Collection
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Buy on L1 */}
          {currentStep === 'buy' && selectedCollection && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                Buy {selectedCollection} on L1
              </h3>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  Visit KaspaCom to purchase {selectedCollection} NFTs on L1.
                </p>
                <a
                  href={getCollectionUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg font-medium transition-colors"
                >
                  <span>Open {selectedCollection} Collection</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  💡 After purchasing your NFT, return here to proceed to the bridging step.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Bridge to L2 */}
          {currentStep === 'bridge' && selectedCollection && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                Bridge {selectedCollection} to L2
              </h3>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  Use the NFT bridge to transfer your {selectedCollection} NFT from L1 to L2.
                </p>
                <a
                  href={bridgeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg font-medium transition-colors"
                >
                  <span>Open NFT Bridge</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-xs text-green-700 dark:text-green-300">
                  ✓ Once bridged, your NFT will be available on L2 and you&apos;ll start earning rewards automatically.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Complete */}
          {currentStep === 'complete' && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                All Set!
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Your {selectedCollection} NFT has been bridged to L2. You can now use it in dApps to unlock additional rewards and multipliers.
              </p>
              <div className="pt-4">
                <button
                  onClick={handleReset}
                  className="px-6 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Start Over
                </button>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          {currentStep !== 'complete' && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={currentStep === 'select' ? onClose : handleBack}
                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                {currentStep === 'select' ? 'Cancel' : 'Back'}
              </button>
              <button
                onClick={handleNext}
                disabled={currentStep === 'select' && !selectedCollection}
                className="px-6 py-2 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentStep === 'bridge' ? 'Complete' : 'Next'}
              </button>
            </div>
          )}
        </div>
        </div>
      </div>
    </>
  );

  if (typeof window === 'undefined') return null;

  return createPortal(modalContent, document.body);
}

