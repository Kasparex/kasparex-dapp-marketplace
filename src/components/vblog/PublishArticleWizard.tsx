'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { VBlogArticle } from '@/lib/vblog/types';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useAccount } from 'wagmi';
import { useVBlog } from '@/hooks/useVBlog';
import { useVBlogPricing } from '@/hooks/useVBlogPricing';
import { 
  validateTitle, 
  validateDescription, 
  validateContent, 
  validateFile,
  validateImage,
  getCharacterCount,
  getFileSizeDisplay,
  CONTENT_LIMITS,
  FILE_LIMITS,
  IMAGE_LIMITS,
} from '@/lib/vblog/limits';
import { Alert } from '@/components/Alert';
import { KASFeeConfirmation } from './KASFeeConfirmation';
import { KASFeeInfo } from '@/lib/vblog/types';

interface PublishArticleWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

type WizardStep = 'content' | 'metadata' | 'ipfs' | 'review' | 'publishing' | 'complete';

const DEFAULT_CATEGORIES = [
  'Introduction',
  'Technical',
  'Tutorial',
  'News',
  'Opinion',
  'Review',
  'Other',
];

const STORAGE_KEY_CATEGORIES = 'vblog_custom_categories';

export function PublishArticleWizard({ isOpen, onClose, onComplete }: PublishArticleWizardProps) {
  // ALL HOOKS MUST BE CALLED UNCONDITIONALLY - SAME ORDER EVERY RENDER
  const { state: kaspaState } = useKaspaWallet();
  const { address: evmAddress, isConnected: isEVMConnected } = useAccount();
  const { createNewArticle } = useVBlog();
  const pricing = useVBlogPricing();
  
  // State hooks - all called unconditionally
  const [currentStep, setCurrentStep] = useState<WizardStep>('content');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFeeConfirmation, setShowFeeConfirmation] = useState(false);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    featuredImage: '',
    category: DEFAULT_CATEGORIES[0],
    tags: '',
  });
  
  const [featuredImageIpfs, setFeaturedImageIpfs] = useState<{
    cid: string | null;
    isUploading: boolean;
    uploadProgress: number;
    uploadedFile?: File;
  }>({
    cid: null,
    isUploading: false,
    uploadProgress: 0,
  });

  const [ipfsData, setIpfsData] = useState<{
    cid: string | null;
    isUploading: boolean;
    uploadProgress: number;
    uploadedFile?: File;
    uploadedFileName?: string;
  }>({
    cid: null,
    isUploading: false,
    uploadProgress: 0,
  });

  // Refs - all called unconditionally
  const fileInputRef = useRef<HTMLInputElement>(null);
  const featuredImageInputRef = useRef<HTMLInputElement>(null);

  // Load categories from localStorage - only on client
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CATEGORIES);
      if (stored) {
        const custom = JSON.parse(stored);
        setCategories([...DEFAULT_CATEGORIES, ...custom]);
      }
    } catch (error) {
      console.warn('Error loading custom categories:', error);
    }
  }, []);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep('content');
      setFormData({
        title: '',
        description: '',
        content: '',
        featuredImage: '',
        category: categories[0] || DEFAULT_CATEGORIES[0],
        tags: '',
      });
      setIpfsData({ cid: null, isUploading: false, uploadProgress: 0 });
      setFeaturedImageIpfs({ cid: null, isUploading: false, uploadProgress: 0 });
      setError(null);
      setShowFeeConfirmation(false);
      setNewCategory('');
      setShowNewCategoryInput(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (featuredImageInputRef.current) featuredImageInputRef.current.value = '';
    }
  }, [isOpen, categories]);

  // Computed values - after all hooks
  const isWalletConnected = kaspaState.isConnected || isEVMConnected;
  const walletAddress = kaspaState.address || (evmAddress ? `evm:${evmAddress}` : null);
  const walletType = kaspaState.isConnected ? 'kaspa' : isEVMConnected ? 'evm' : null;

  const steps = [
    { id: 'content' as WizardStep, title: 'Content', number: 1 },
    { id: 'metadata' as WizardStep, title: 'Metadata', number: 2 },
    { id: 'ipfs' as WizardStep, title: 'IPFS Storage', number: 3 },
    { id: 'review' as WizardStep, title: 'Review', number: 4 },
    { id: 'publishing' as WizardStep, title: 'Publishing', number: 5 },
    { id: 'complete' as WizardStep, title: 'Complete', number: 6 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  // Handlers - use useCallback for stability
  const updateFormData = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const addCustomCategory = useCallback(() => {
    if (!newCategory.trim() || categories.includes(newCategory.trim())) return;
    const updated = [...categories, newCategory.trim()];
    setCategories(updated);
    setFormData(prev => ({ ...prev, category: newCategory.trim() }));
    setNewCategory('');
    setShowNewCategoryInput(false);
    try {
      const custom = updated.filter(c => !DEFAULT_CATEGORIES.includes(c));
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(custom));
    } catch {}
  }, [newCategory, categories]);

  const handleFeaturedImageUpload = useCallback(async (file: File) => {
    const validation = validateImage(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid image file');
      return;
    }
    
    setFeaturedImageIpfs(prev => ({ ...prev, isUploading: true, uploadProgress: 0, uploadedFile: file }));
    
    // Simulate IPFS upload
    const progressInterval = setInterval(() => {
      setFeaturedImageIpfs((prev) => {
        const newProgress = Math.min(prev.uploadProgress + 10, 100);
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          const mockCid = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
          setFormData(prev => ({ ...prev, featuredImage: mockCid }));
          return { ...prev, cid: mockCid, isUploading: false, uploadProgress: 100 };
        }
        return { ...prev, uploadProgress: newProgress };
      });
    }, 200);

    setTimeout(() => {
      clearInterval(progressInterval);
      const mockCid = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      setFeaturedImageIpfs(prev => ({ ...prev, cid: mockCid, isUploading: false, uploadProgress: 100 }));
      setFormData(prev => ({ ...prev, featuredImage: mockCid }));
    }, 2000);
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    setIpfsData(prev => ({ ...prev, isUploading: true, uploadProgress: 0, uploadedFile: file, uploadedFileName: file.name }));
    
    const progressInterval = setInterval(() => {
      setIpfsData((prev) => {
        const newProgress = Math.min(prev.uploadProgress + 10, 100);
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          const mockCid = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
          return { ...prev, cid: mockCid, isUploading: false, uploadProgress: 100 };
        }
        return { ...prev, uploadProgress: newProgress };
      });
    }, 200);

    setTimeout(() => {
      clearInterval(progressInterval);
      const mockCid = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      setIpfsData(prev => ({ ...prev, cid: mockCid, isUploading: false, uploadProgress: 100 }));
    }, 2000);
  }, []);

  const validateStep = useCallback((step: WizardStep): boolean => {
    setError(null);
    if (step === 'content') {
      if (!formData.title.trim()) {
        setError('Title is required');
        return false;
      }
      const titleValidation = validateTitle(formData.title, pricing.isPremium);
      if (!titleValidation.valid) {
        setError(titleValidation.error ?? 'Title validation failed');
        return false;
      }
      
      if (!formData.description.trim()) {
        setError('Description is required');
        return false;
      }
      const descValidation = validateDescription(formData.description, pricing.isPremium);
      if (!descValidation.valid) {
        setError(descValidation.error ?? 'Description validation failed');
        return false;
      }
      
      if (!formData.content.trim()) {
        setError('Content is required');
        return false;
      }
      const contentValidation = validateContent(formData.content, pricing.isPremium);
      if (!contentValidation.valid) {
        setError(contentValidation.error ?? 'Content validation failed');
        return false;
      }
    }
    if (step === 'metadata') {
      if (!formData.category) {
        setError('Category is required');
        return false;
      }
    }
    if (step === 'ipfs') {
      if (!ipfsData.cid) {
        setError('Please upload content to IPFS first');
        return false;
      }
    }
    return true;
  }, [formData, pricing.isPremium, ipfsData.cid]);

  const handleNext = useCallback(async () => {
    if (!validateStep(currentStep)) return;

    if (currentStep === 'ipfs' && !ipfsData.cid) {
      setError('Please upload content to IPFS first');
      return;
    }

    if (currentStep === 'review') {
      setShowFeeConfirmation(true);
      return;
    }

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  }, [currentStep, currentStepIndex, steps, validateStep, ipfsData.cid]);

  const handleBack = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  }, [currentStepIndex, steps]);

  const handleStepClick = useCallback((stepId: WizardStep, stepIndex: number) => {
    if (stepIndex <= currentStepIndex) {
      setCurrentStep(stepId);
    } else if (stepIndex === currentStepIndex + 1) {
      if (validateStep(currentStep)) {
        setCurrentStep(stepId);
      }
    }
  }, [currentStep, currentStepIndex, validateStep]);

  const handlePublishConfirm = useCallback(async () => {
    setShowFeeConfirmation(false);
    setCurrentStep('publishing');
    await handlePublish();
  }, []);

  const handlePublish = useCallback(async () => {
    let authorAddress: string = walletAddress || '';
    
    if (!isWalletConnected || !walletAddress) {
      authorAddress = 'kaspa:qqq000000000000000000000000000000000000000000000000000000000000000';
      console.warn('Wallet not connected - using mock address for testing');
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      await new Promise(resolve => setTimeout(resolve, 2000));

      await createNewArticle({
        title: formData.title.trim(),
        description: formData.description.trim(),
        content: formData.content.trim(),
        author: authorAddress,
        category: formData.category,
        tags: tagsArray,
        featuredImage: formData.featuredImage.trim() || undefined,
      });

      setCurrentStep('complete');
    } catch (err) {
      console.error('Error publishing article:', err);
      setError(err instanceof Error ? err.message : 'Failed to publish article');
    } finally {
      setIsSubmitting(false);
    }
  }, [walletAddress, isWalletConnected, formData, createNewArticle]);

  const handleClose = useCallback(() => {
    if (currentStep === 'complete' || currentStep === 'publishing') {
      return;
    }
    onClose();
  }, [currentStep, onClose]);

  // NEVER return null - always render the same structure
  // Hide with CSS when closed to maintain hook order
  if (!isOpen) {
    return <div style={{ display: 'none' }} aria-hidden="true" />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Publish Article
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Step {currentStepIndex + 1} of {steps.length}: {steps[currentStepIndex]?.title}
            </p>
          </div>
          {currentStep !== 'publishing' && currentStep !== 'complete' && (
            <button
              onClick={handleClose}
              className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            {steps.map((step, index) => {
              const isClickable = index <= currentStepIndex || (index === currentStepIndex + 1 && validateStep(currentStep));
              const isActive = index === currentStepIndex;
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex items-center gap-2 flex-1">
                    <button
                      type="button"
                      onClick={() => handleStepClick(step.id, index)}
                      disabled={!isClickable && !isActive}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                        index <= currentStepIndex
                          ? 'bg-[#02abb8] text-white hover:bg-[#028a94]'
                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                      } ${
                        isClickable || isActive
                          ? 'cursor-pointer hover:scale-110'
                          : 'cursor-not-allowed opacity-50'
                      }`}
                      title={step.title}
                    >
                      {index < currentStepIndex ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        step.number
                      )}
                    </button>
                    {index < steps.length - 1 && (
                      <div
                        className={`flex-1 h-1 rounded transition-colors ${
                          index < currentStepIndex
                            ? 'bg-[#02abb8]'
                            : 'bg-zinc-200 dark:bg-zinc-800'
                        }`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4">
              <Alert type="error" title="Error" onDismiss={() => setError(null)}>
                {error}
              </Alert>
            </div>
          )}

          {/* Step 1: Content */}
          {currentStep === 'content' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <span className={`text-xs ${
                    getCharacterCount(formData.title) > (pricing.isPremium ? CONTENT_LIMITS.premium.title.max : CONTENT_LIMITS.title.max)
                      ? 'text-red-500'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`}>
                    {getCharacterCount(formData.title)} / {pricing.isPremium ? CONTENT_LIMITS.premium.title.max : CONTENT_LIMITS.title.max}
                  </span>
                </div>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateFormData('title', e.target.value)}
                  placeholder="Enter article title"
                  maxLength={pricing.isPremium ? CONTENT_LIMITS.premium.title.max : CONTENT_LIMITS.title.max}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
                />
                {pricing.isPremium && (
                  <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">Premium limits active (NFT holder)</p>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Short Description <span className="text-red-500">*</span>
                  </label>
                  <span className={`text-xs ${
                    getCharacterCount(formData.description) > (pricing.isPremium ? CONTENT_LIMITS.premium.description.max : CONTENT_LIMITS.description.max)
                      ? 'text-red-500'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`}>
                    {getCharacterCount(formData.description)} / {pricing.isPremium ? CONTENT_LIMITS.premium.description.max : CONTENT_LIMITS.description.max}
                  </span>
                </div>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  placeholder="Enter a brief description"
                  rows={3}
                  maxLength={pricing.isPremium ? CONTENT_LIMITS.premium.description.max : CONTENT_LIMITS.description.max}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8] resize-none"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Main Content <span className="text-red-500">*</span>
                  </label>
                  <span className={`text-xs ${
                    getCharacterCount(formData.content) > (pricing.isPremium ? CONTENT_LIMITS.premium.content.max : CONTENT_LIMITS.content.max)
                      ? 'text-red-500'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`}>
                    {getCharacterCount(formData.content)} / {pricing.isPremium ? CONTENT_LIMITS.premium.content.max : CONTENT_LIMITS.content.max}
                  </span>
                </div>
                <textarea
                  value={formData.content}
                  onChange={(e) => updateFormData('content', e.target.value)}
                  placeholder="Write your article content here..."
                  rows={12}
                  maxLength={pricing.isPremium ? CONTENT_LIMITS.premium.content.max : CONTENT_LIMITS.content.max}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8] resize-none font-mono text-sm"
                />
              </div>
            </div>
          )}

          {/* Step 2: Metadata */}
          {currentStep === 'metadata' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Featured Image URL or CID
                </label>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                  Recommended size: 1200x630px (1.91:1 aspect ratio) for optimal display
                </p>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={formData.featuredImage}
                    onChange={(e) => updateFormData('featuredImage', e.target.value)}
                    placeholder="Enter image URL or CID"
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      ref={featuredImageInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFeaturedImageUpload(file);
                        }
                      }}
                      className="hidden"
                      id="featured-image-upload"
                    />
                    <label
                      htmlFor="featured-image-upload"
                      className="flex-1 px-4 py-2 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg cursor-pointer hover:border-[#02abb8] hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors text-center text-sm"
                    >
                      {featuredImageIpfs.isUploading ? (
                        <span className="text-zinc-600 dark:text-zinc-400">Uploading... {featuredImageIpfs.uploadProgress}%</span>
                      ) : featuredImageIpfs.cid ? (
                        <span className="text-emerald-600 dark:text-emerald-400">✓ Image uploaded to IPFS</span>
                      ) : (
                        <span className="text-zinc-600 dark:text-zinc-400">Upload Image to IPFS (JPG/PNG, max {getFileSizeDisplay(IMAGE_LIMITS.maxSize)})</span>
                      )}
                    </label>
                  </div>
                  {featuredImageIpfs.cid && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono break-all">
                      CID: {featuredImageIpfs.cid}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Category <span className="text-red-500">*</span>
                  </label>
                  {!showNewCategoryInput && (
                    <button
                      type="button"
                      onClick={() => setShowNewCategoryInput(true)}
                      className="text-xs text-[#02abb8] hover:text-[#028a94]"
                    >
                      + Add Custom
                    </button>
                  )}
                </div>
                {showNewCategoryInput ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Enter new category name"
                      className="flex-1 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomCategory();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={addCustomCategory}
                      className="px-3 py-2 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewCategoryInput(false);
                        setNewCategory('');
                      }}
                      className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <select
                    value={formData.category}
                    onChange={(e) => updateFormData('category', e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => updateFormData('tags', e.target.value)}
                  placeholder="tag1, tag2, tag3"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
                />
              </div>
            </div>
          )}

          {/* Step 3: IPFS Storage */}
          {currentStep === 'ipfs' && (
            <div className="space-y-4">
              <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  Upload to IPFS
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  Your article content will be stored on IPFS (InterPlanetary File System) for decentralized storage. This ensures your content is verifiable and censorship-resistant.
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                  Maximum file size: {FILE_LIMITS.maxSize / (1024 * 1024)} MB. Allowed types: {FILE_LIMITS.allowedTypes.join(', ')}
                </p>
                
                {ipfsData.isUploading ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        {ipfsData.uploadedFileName ? `Uploading ${ipfsData.uploadedFileName}...` : 'Uploading to IPFS...'}
                      </span>
                      <span className="text-zinc-900 dark:text-zinc-100 font-medium">{ipfsData.uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                      <div
                        className="bg-[#02abb8] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${ipfsData.uploadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : ipfsData.cid ? (
                  <div className="space-y-3">
                    <Alert type="success" compact>
                      Content uploaded successfully!
                    </Alert>
                    <div className="bg-white dark:bg-zinc-800 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700">
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">IPFS CID:</p>
                      <p className="text-sm font-mono text-zinc-900 dark:text-zinc-100 break-all">{ipfsData.cid}</p>
                      {ipfsData.uploadedFileName && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">File: {ipfsData.uploadedFileName}</p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setIpfsData({ cid: null, isUploading: false, uploadProgress: 0 });
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                    >
                      Upload Different File
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file);
                        }
                      }}
                      accept=".txt,.md,.json,.html"
                      className="hidden"
                      id="ipfs-file-upload"
                    />
                    <label
                      htmlFor="ipfs-file-upload"
                      className="flex flex-col items-center justify-center w-full px-4 py-8 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg cursor-pointer hover:border-[#02abb8] hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                    >
                      <svg className="w-10 h-10 text-zinc-400 dark:text-zinc-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Upload your article content file (TXT, MD, JSON, HTML)
                      </p>
                    </label>
                    <div className="text-center">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">or</span>
                    </div>
                    <button
                      onClick={() => {
                        const contentBlob = new Blob([formData.content], { type: 'text/plain' });
                        const contentFile = new File([contentBlob], `${formData.title.replace(/[^a-z0-9]/gi, '_')}.txt`, { type: 'text/plain' });
                        handleFileUpload(contentFile);
                      }}
                      className="w-full px-4 py-2 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg font-medium transition-colors"
                    >
                      Upload Article Content Automatically
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 'review' && (
            <div className="space-y-4">
              <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Article Preview</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">Title:</span>
                    <p className="text-zinc-900 dark:text-zinc-100 font-medium">{formData.title}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">Description:</span>
                    <p className="text-zinc-900 dark:text-zinc-100">{formData.description}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">Category:</span>
                    <p className="text-zinc-900 dark:text-zinc-100">{formData.category}</p>
                  </div>
                  {formData.tags && (
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400">Tags:</span>
                      <p className="text-zinc-900 dark:text-zinc-100">{formData.tags}</p>
                    </div>
                  )}
                  {ipfsData.cid && (
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400">IPFS CID:</span>
                      <p className="text-zinc-900 dark:text-zinc-100 font-mono text-xs break-all">{ipfsData.cid}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                {!isWalletConnected && (
                  <Alert type="warning" title="Wallet Not Connected">
                    Using test mode for demonstration. In production, you&apos;ll need to connect your wallet (Kaspa or EVM) to publish articles.
                  </Alert>
                )}
                {isWalletConnected && walletType && (
                  <Alert type="info" compact>
                    Connected with {walletType === 'kaspa' ? 'Kaspa' : 'EVM'} wallet: {walletAddress?.substring(0, 20)}...
                  </Alert>
                )}
                <Alert type="info" title="Publishing Fee">
                  Publishing this article will cost {pricing.createFee} KAS{pricing.tier.hasKREXDiscount ? ' (KREX holder discount applied)' : ''}. Make sure you have sufficient balance in your wallet.
                </Alert>
                {pricing.tier.hasNFTPerks && (
                  <Alert type="success" compact>
                    NFT Perks Active: Increased text limits enabled ({pricing.tier.nftCollections.join(', ')})
                  </Alert>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Publishing */}
          {currentStep === 'publishing' && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#02abb8]/10 mb-4">
                <svg className="w-8 h-8 text-[#02abb8] animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Publishing Article...
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Your article is being published to the BlockDAG. This may take a few moments.
              </p>
            </div>
          )}

          {/* Step 6: Complete */}
          {currentStep === 'complete' && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Article Published Successfully!
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
                Your article has been published and is now visible in the article list.
              </p>
              <button
                onClick={() => {
                  onComplete();
                  onClose();
                }}
                className="px-6 py-2 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg font-medium transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {currentStep !== 'publishing' && currentStep !== 'complete' && (
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={currentStepIndex === 0}
              className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={isSubmitting || ipfsData.isUploading || featuredImageIpfs.isUploading}
              className="px-4 py-2 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentStep === 'ipfs' && !ipfsData.cid ? 'Upload to IPFS' : currentStep === 'review' ? 'Publish Article' : 'Next'}
            </button>
          </div>
        )}
      </div>

      {/* Fee Confirmation Modal */}
      <KASFeeConfirmation
        isOpen={showFeeConfirmation}
        onClose={() => setShowFeeConfirmation(false)}
        onConfirm={handlePublishConfirm}
        feeInfo={{
          amount: pricing.createFee,
          action: 'create',
          description: `This action will cost ${pricing.createFee} KAS (article creation fee)${pricing.tier.hasKREXDiscount ? '. KREX holder discount applied.' : '.'}`,
        }}
        isProcessing={isSubmitting}
      />
    </div>
  );
}
