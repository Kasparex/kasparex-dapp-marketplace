'use client';

import { useState } from 'react';
import { VBlogArticle } from '@/lib/vblog/types';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useVBlog } from '@/hooks/useVBlog';

interface PublishArticleWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

type WizardStep = 'content' | 'metadata' | 'ipfs' | 'review' | 'publishing' | 'complete';

const CATEGORIES = [
  'Introduction',
  'Technical',
  'Tutorial',
  'News',
  'Opinion',
  'Review',
  'Other',
];

export function PublishArticleWizard({ isOpen, onClose, onComplete }: PublishArticleWizardProps) {
  const { state } = useKaspaWallet();
  const { createNewArticle } = useVBlog();
  const [currentStep, setCurrentStep] = useState<WizardStep>('content');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    featuredImage: '',
    category: CATEGORIES[0],
    tags: '',
  });

  const [ipfsData, setIpfsData] = useState<{
    cid: string | null;
    isUploading: boolean;
    uploadProgress: number;
  }>({
    cid: null,
    isUploading: false,
    uploadProgress: 0,
  });

  const steps = [
    { id: 'content' as WizardStep, title: 'Content', number: 1 },
    { id: 'metadata' as WizardStep, title: 'Metadata', number: 2 },
    { id: 'ipfs' as WizardStep, title: 'IPFS Storage', number: 3 },
    { id: 'review' as WizardStep, title: 'Review', number: 4 },
    { id: 'publishing' as WizardStep, title: 'Publishing', number: 5 },
    { id: 'complete' as WizardStep, title: 'Complete', number: 6 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: WizardStep): boolean => {
    setError(null);
    if (step === 'content') {
      if (!formData.title.trim()) {
        setError('Title is required');
        return false;
      }
      if (!formData.description.trim()) {
        setError('Description is required');
        return false;
      }
      if (!formData.content.trim()) {
        setError('Content is required');
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
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    if (currentStep === 'ipfs' && !ipfsData.cid) {
      // Simulate IPFS upload
      setIpfsData({ cid: null, isUploading: true, uploadProgress: 0 });
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setIpfsData((prev) => {
          const newProgress = Math.min(prev.uploadProgress + 10, 100);
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            // Generate a mock CID
            const mockCid = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
            return { cid: mockCid, isUploading: false, uploadProgress: 100 };
          }
          return { ...prev, uploadProgress: newProgress };
        });
      }, 200);

      // Wait for upload to complete
      setTimeout(() => {
        clearInterval(progressInterval);
        const mockCid = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
        setIpfsData({ cid: mockCid, isUploading: false, uploadProgress: 100 });
        setCurrentStep('review');
      }, 2000);
      return;
    }

    if (currentStep === 'review') {
      setCurrentStep('publishing');
      await handlePublish();
      return;
    }

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const handlePublish = async () => {
    if (!state.isConnected || !state.address) {
      setError('Wallet not connected');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Simulate publishing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      await createNewArticle({
        title: formData.title.trim(),
        description: formData.description.trim(),
        content: formData.content.trim(),
        author: state.address,
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
  };

  const handleReset = () => {
    setCurrentStep('content');
    setFormData({
      title: '',
      description: '',
      content: '',
      featuredImage: '',
      category: CATEGORIES[0],
      tags: '',
    });
    setIpfsData({ cid: null, isUploading: false, uploadProgress: 0 });
    setError(null);
  };

  const handleClose = () => {
    if (currentStep === 'complete' || currentStep === 'publishing') {
      return; // Prevent closing during publishing or after completion
    }
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

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
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
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
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Step 1: Content */}
          {currentStep === 'content' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateFormData('title', e.target.value)}
                  placeholder="Enter article title"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Short Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  placeholder="Enter a brief description"
                  rows={3}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8] resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Main Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => updateFormData('content', e.target.value)}
                  placeholder="Write your article content here..."
                  rows={10}
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
                <input
                  type="text"
                  value={formData.featuredImage}
                  onChange={(e) => updateFormData('featuredImage', e.target.value)}
                  placeholder="Enter image URL or CID"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => updateFormData('category', e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
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
                {ipfsData.isUploading ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-600 dark:text-zinc-400">Uploading to IPFS...</span>
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
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Content uploaded successfully!</span>
                    </div>
                    <div className="bg-white dark:bg-zinc-800 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700">
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">IPFS CID:</p>
                      <p className="text-sm font-mono text-zinc-900 dark:text-zinc-100 break-all">{ipfsData.cid}</p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleNext}
                    className="w-full px-4 py-2 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg font-medium transition-colors"
                  >
                    Upload to IPFS
                  </button>
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
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Note:</strong> Publishing this article will cost 5 KAS. Make sure you have sufficient balance in your wallet.
                </p>
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
                  handleReset();
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
              disabled={isSubmitting || ipfsData.isUploading}
              className="px-4 py-2 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentStep === 'ipfs' && !ipfsData.cid ? 'Upload to IPFS' : currentStep === 'review' ? 'Publish Article' : 'Next'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

