'use client';

import { useState } from 'react';
import { CreateListingFormData, ListingCategory } from '@/lib/listings/types';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { uploadToStoracha, uploadJSONToStoracha } from '@/lib/storage/decentralized';
import { Alert } from '@/components/Alert';

interface CreateListingFormProps {
  onSubmit: (formData: CreateListingFormData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<CreateListingFormData>;
}

type FormStep = 'basic' | 'links' | 'images' | 'review';

const LISTING_FEE = 5; // KAS

export function CreateListingForm({ onSubmit, onCancel, initialData }: CreateListingFormProps) {
  const { state: kaspaState } = useKaspaWallet();
  const isWalletConnected = kaspaState.isConnected;

  const [currentStep, setCurrentStep] = useState<FormStep>('basic');
  const [formData, setFormData] = useState<CreateListingFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    category: initialData?.category || ListingCategory.DAPPS,
    tags: initialData?.tags || [],
    links: initialData?.links || {},
    logoFile: initialData?.logoFile,
    bannerFile: initialData?.bannerFile,
  });

  const [tagInput, setTagInput] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [logoCid, setLogoCid] = useState<string | null>(null);
  const [bannerCid, setBannerCid] = useState<string | null>(null);
  const [metadataCid, setMetadataCid] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof CreateListingFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      handleInputChange('tags', [...formData.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    handleInputChange('tags', formData.tags.filter(t => t !== tag));
  };

  const handleImageChange = (field: 'logoFile' | 'bannerFile', file: File | null) => {
    if (file) {
      handleInputChange(field, file);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (field === 'logoFile') {
          setLogoPreview(reader.result as string);
        } else {
          setBannerPreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    } else {
      handleInputChange(field, undefined);
      if (field === 'logoFile') {
        setLogoPreview(null);
        setLogoCid(null);
      } else {
        setBannerPreview(null);
        setBannerCid(null);
      }
    }
  };

  const handleUploadImages = async () => {
    setIsUploading(true);
    setError(null);

    try {
      if (formData.logoFile) {
        const logoResult = await uploadToStoracha(formData.logoFile, { pin: true });
        setLogoCid(logoResult.cid);
      }
      if (formData.bannerFile) {
        const bannerResult = await uploadToStoracha(formData.bannerFile, { pin: true });
        setBannerCid(bannerResult.cid);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload images');
      setIsUploading(false);
      return;
    }

    setIsUploading(false);
  };

  const handleUploadMetadata = async () => {
    setIsUploading(true);
    setError(null);

    try {
      const metadata = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        tags: formData.tags,
        links: formData.links,
        images: {
          logoCid: logoCid || undefined,
          bannerCid: bannerCid || undefined,
        },
        version: '1.0',
      };

      const result = await uploadJSONToStoracha(metadata, { pin: true });
      setMetadataCid(result.cid);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload metadata');
      setIsUploading(false);
      return;
    }

    setIsUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }
    if (!isWalletConnected) {
      setError('Please connect your wallet');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 'basic') setCurrentStep('links');
    else if (currentStep === 'links') setCurrentStep('images');
    else if (currentStep === 'images') setCurrentStep('review');
  };

  const prevStep = () => {
    if (currentStep === 'links') setCurrentStep('basic');
    else if (currentStep === 'images') setCurrentStep('links');
    else if (currentStep === 'review') setCurrentStep('images');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert type="error" title="Error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-6">
        {(['basic', 'links', 'images', 'review'] as FormStep[]).map((step, index) => (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === step
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                    : index < (['basic', 'links', 'images', 'review'] as FormStep[]).indexOf(currentStep)
                    ? 'bg-green-500 text-white'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {index + 1}
              </div>
              <span className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 capitalize">{step}</span>
            </div>
            {index < 3 && (
              <div
                className={`h-0.5 flex-1 mx-2 ${
                  index < (['basic', 'links', 'images', 'review'] as FormStep[]).indexOf(currentStep)
                    ? 'bg-green-500'
                    : 'bg-zinc-200 dark:bg-zinc-800'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {currentStep === 'basic' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Basic Information</h3>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Kaspa Wallet"
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your listing..."
              rows={4}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value as ListingCategory)}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
            >
              {Object.values(ListingCategory).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Step 2: Tags & Links */}
      {currentStep === 'links' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Tags & Links</h3>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add a tag"
                className="flex-1 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg flex items-center gap-2"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Website</label>
              <input
                type="url"
                value={formData.links.website || ''}
                onChange={(e) => handleInputChange('links', { ...formData.links, website: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Twitter</label>
              <input
                type="url"
                value={formData.links.twitter || ''}
                onChange={(e) => handleInputChange('links', { ...formData.links, twitter: e.target.value })}
                placeholder="https://twitter.com/..."
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">GitHub</label>
              <input
                type="url"
                value={formData.links.github || ''}
                onChange={(e) => handleInputChange('links', { ...formData.links, github: e.target.value })}
                placeholder="https://github.com/..."
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Discord</label>
              <input
                type="url"
                value={formData.links.discord || ''}
                onChange={(e) => handleInputChange('links', { ...formData.links, discord: e.target.value })}
                placeholder="https://discord.gg/..."
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Images */}
      {currentStep === 'images' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Images</h3>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Logo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageChange('logoFile', e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
            />
            {logoPreview && (
              <div className="mt-2">
                <img src={logoPreview} alt="Logo preview" className="w-24 h-24 object-cover rounded-lg" />
                {logoCid && <p className="text-xs text-zinc-500 mt-1">CID: {logoCid}</p>}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Banner</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageChange('bannerFile', e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
            />
            {bannerPreview && (
              <div className="mt-2">
                <img src={bannerPreview} alt="Banner preview" className="w-full h-32 object-cover rounded-lg" />
                {bannerCid && <p className="text-xs text-zinc-500 mt-1">CID: {bannerCid}</p>}
              </div>
            )}
          </div>
          {(formData.logoFile || formData.bannerFile) && !logoCid && !bannerCid && (
            <button
              type="button"
              onClick={handleUploadImages}
              disabled={isUploading}
              className="w-full px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : 'Upload Images to IPFS'}
            </button>
          )}
        </div>
      )}

      {/* Step 4: Review */}
      {currentStep === 'review' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Review & Submit</h3>
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 space-y-2">
            <div>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">Name:</span>{' '}
              <span className="text-zinc-900 dark:text-zinc-100">{formData.name}</span>
            </div>
            <div>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">Category:</span>{' '}
              <span className="text-zinc-900 dark:text-zinc-100">{formData.category}</span>
            </div>
            <div>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">Tags:</span>{' '}
              <span className="text-zinc-900 dark:text-zinc-100">{formData.tags.join(', ') || 'None'}</span>
            </div>
            {metadataCid && (
              <div>
                <span className="font-medium text-zinc-700 dark:text-zinc-300">IPFS CID:</span>{' '}
                <span className="text-zinc-900 dark:text-zinc-100 font-mono text-xs">{metadataCid}</span>
              </div>
            )}
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              <strong>Listing Fee:</strong> {LISTING_FEE} KAS
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
              This fee will be charged when you submit the transaction.
            </p>
          </div>
          {!metadataCid && (
            <button
              type="button"
              onClick={handleUploadMetadata}
              disabled={isUploading}
              className="w-full px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50"
            >
              {isUploading ? 'Uploading Metadata...' : 'Upload Metadata to IPFS'}
            </button>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div>
          {currentStep !== 'basic' && (
            <button
              type="button"
              onClick={prevStep}
              className="px-4 py-2 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Previous
            </button>
          )}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Cancel
            </button>
          )}
        </div>
        <div>
          {currentStep !== 'review' ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={!isWalletConnected || isSubmitting || !metadataCid}
              className="px-6 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Listing'}
            </button>
          )}
        </div>
      </div>

      {!isWalletConnected && (
        <Alert type="warning" title="Wallet Not Connected">
          Please connect your wallet to submit a listing.
        </Alert>
      )}
    </form>
  );
}

