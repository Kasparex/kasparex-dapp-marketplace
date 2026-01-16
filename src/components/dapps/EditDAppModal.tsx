'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAccount, useChainId } from 'wagmi';
import { DApp } from '@/lib/dapps';
import { isDeployer } from '@/lib/dapps/deployer';
import { isAdminAddress } from '@/lib/admin';
import { getCategoryById } from '@/lib/categories';
import { getErrorMessage } from '@/lib/utils';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { FormCompletionIndicator } from '@/components/ui/FormCompletionIndicator';
import { ImagePreview } from '@/components/ImagePreview';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { loadDAppFeaturedImage, loadDAppLogo } from '@/lib/dapps/contractData';
import { uploadDAppLogo, uploadDAppFeaturedImage } from '@/lib/dapps/ipfs';

interface EditDAppModalProps {
  dapp: DApp;
  contractAddress?: string;
  contractData?: any;
  onClose: () => void;
}

export function EditDAppModal({ dapp, contractAddress, contractData, onClose }: EditDAppModalProps) {
  const { address: connectedAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  // Section states
  const [basicInfoOpen, setBasicInfoOpen] = useState(true);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [linksOpen, setLinksOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);

  // Form state
  const [name, setName] = useState(dapp.name || '');
  const [version, setVersion] = useState(dapp.version || '');
  const [description, setDescription] = useState(dapp.description || '');
  const [utility, setUtility] = useState(dapp.utility || '');
  const [process, setProcess] = useState(dapp.process || '');
  const [benefits, setBenefits] = useState(dapp.benefits || '');
  const [url, setUrl] = useState(dapp.url || '');
  const [website, setWebsite] = useState(dapp.developerLinks?.find(l => l.label.toLowerCase().includes('website'))?.url || '');
  const [twitter, setTwitter] = useState(dapp.developerLinks?.find(l => l.label.toLowerCase().includes('twitter') || l.label.toLowerCase().includes('x'))?.url || '');
  const [telegram, setTelegram] = useState(dapp.developerLinks?.find(l => l.label.toLowerCase().includes('telegram'))?.url || '');
  const [security, setSecurity] = useState(dapp.security || '');
  const [roadmap, setRoadmap] = useState(dapp.roadmap || '');

  // Image states
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [featuredImageError, setFeaturedImageError] = useState(false);
  const [logoError, setLogoError] = useState(false);
  // Store files temporarily for upload after transaction
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null);
  // Preview URLs for local files
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>('');
  const [featuredImagePreviewUrl, setFeaturedImagePreviewUrl] = useState<string>('');

  // Get deployer address from contract data
  // Admin address is the default deployer for all dApps
  const deployerAddress = contractData?.deployerAddress || contractAddress;
  const isAdmin = connectedAddress ? isAdminAddress(connectedAddress) : false;
  const isDeployerUser = isAdmin || (deployerAddress && connectedAddress
    ? isDeployer(connectedAddress, deployerAddress)
    : false);

  const category = getCategoryById(dapp.category);

  // Simple save state (no transaction required)
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);

    try {
      // Upload files to IPFS if they were selected
      let finalLogoUrl = logoUrl.trim();
      let finalFeaturedImageUrl = featuredImageUrl.trim();

      // Upload logo file if one was selected
      if (logoFile) {
        const logoCid = await uploadDAppLogo(dapp.id, logoFile);
        if (logoCid) {
          finalLogoUrl = logoCid;
          // Clean up preview URL
          if (logoPreviewUrl) {
            URL.revokeObjectURL(logoPreviewUrl);
            setLogoPreviewUrl('');
          }
          setLogoFile(null);
        } else {
          throw new Error('Failed to upload logo to IPFS');
        }
      }

      // Upload featured image file if one was selected
      if (featuredImageFile) {
        const featuredCid = await uploadDAppFeaturedImage(dapp.id, featuredImageFile);
        if (featuredCid) {
          finalFeaturedImageUrl = featuredCid;
          // Clean up preview URL
          if (featuredImagePreviewUrl) {
            URL.revokeObjectURL(featuredImagePreviewUrl);
            setFeaturedImagePreviewUrl('');
          }
          setFeaturedImageFile(null);
        } else {
          throw new Error('Failed to upload featured image to IPFS');
        }
      }

      // Save metadata
      const frontendData = {
        name: name.trim() || dapp.name,
        version: version.trim() || dapp.version || '',
        description: description.trim(),
        utility: utility.trim(),
        process: process.trim(),
        benefits: benefits.trim(),
        url: url.trim(),
        security: security.trim(),
        roadmap: roadmap.trim(),
        developerLinks: [
          website.trim() && { label: 'Website', url: website.trim() },
          twitter.trim() && { label: 'Twitter', url: twitter.trim() },
          telegram.trim() && { label: 'Telegram', url: telegram.trim() },
        ].filter(Boolean) as { label: string; url: string }[],
      };

      const metadataKey = `dapp_${dapp.id}_metadata`;
      localStorage.setItem(metadataKey, JSON.stringify(frontendData));

      // Save images (using final URLs after IPFS upload)
      if (finalFeaturedImageUrl) {
        localStorage.setItem(`dapp_${dapp.id}_featuredImage`, finalFeaturedImageUrl);
      } else {
        localStorage.removeItem(`dapp_${dapp.id}_featuredImage`);
      }

      if (finalLogoUrl) {
        localStorage.setItem(`dapp_${dapp.id}_logo`, finalLogoUrl);
      } else {
        localStorage.removeItem(`dapp_${dapp.id}_logo`);
      }

      // Clear draft after successful save
      localStorage.removeItem(`dapp_${dapp.id}_draft`);

      setSuccess(true);
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error('Error saving data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save changes';
      setError(errorMessage);
      // Clean up preview URLs on error
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
        setLogoPreviewUrl('');
      }
      if (featuredImagePreviewUrl) {
        URL.revokeObjectURL(featuredImagePreviewUrl);
        setFeaturedImagePreviewUrl('');
      }
      setIsSaving(false);
    }
  };

  // Load existing images and draft
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedFeatured = loadDAppFeaturedImage(dapp.id);
        const savedLogo = loadDAppLogo(dapp.id);
        
        if (savedFeatured) {
          setFeaturedImageUrl(savedFeatured);
        } else if (dapp.featuredImage) {
          setFeaturedImageUrl(dapp.featuredImage);
        }

        if (savedLogo) {
          setLogoUrl(savedLogo);
        } else if (dapp.image) {
          setLogoUrl(dapp.image);
        }

        // Load draft if exists
        const draftKey = `dapp_${dapp.id}_draft`;
        const draft = localStorage.getItem(draftKey);
        if (draft) {
          try {
            const draftData = JSON.parse(draft);
            if (draftData.name) setName(draftData.name);
            if (draftData.version !== undefined) setVersion(draftData.version);
            if (draftData.description !== undefined) setDescription(draftData.description);
            if (draftData.utility !== undefined) setUtility(draftData.utility);
            if (draftData.process !== undefined) setProcess(draftData.process);
            if (draftData.benefits !== undefined) setBenefits(draftData.benefits);
            if (draftData.url !== undefined) setUrl(draftData.url);
            if (draftData.website !== undefined) setWebsite(draftData.website);
            if (draftData.twitter !== undefined) setTwitter(draftData.twitter);
            if (draftData.telegram !== undefined) setTelegram(draftData.telegram);
            if (draftData.security !== undefined) setSecurity(draftData.security);
            if (draftData.roadmap !== undefined) setRoadmap(draftData.roadmap);
            if (draftData.featuredImageUrl !== undefined) setFeaturedImageUrl(draftData.featuredImageUrl);
            if (draftData.logoUrl !== undefined) setLogoUrl(draftData.logoUrl);
          } catch (err) {
            console.error('Error loading draft:', err);
          }
        }
      } catch (err) {
        console.error('Error loading images:', err);
      }
    }
  }, [dapp.id, dapp.featuredImage, dapp.image]);

  // Validate image URL
  const validateImageUrl = (url: string): boolean => {
    if (!url.trim()) return true; // Empty is valid (for deletion)
    try {
      const parsedUrl = new URL(url);
      return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  };

  // Calculate form completion
  const formCompletion = useMemo(() => {
    const fields = [
      name,
      description,
      utility,
      process,
      benefits,
      url,
      website,
      twitter,
      telegram,
      security,
      roadmap,
      featuredImageUrl,
      logoUrl,
    ];
    const filled = fields.filter(f => f && f.trim() !== '').length;
    return { filled, total: fields.length };
  }, [name, description, utility, process, benefits, url, website, twitter, telegram, security, roadmap, featuredImageUrl, logoUrl]);


  const handleDeleteFeaturedImage = () => {
    setFeaturedImageUrl('');
    setFeaturedImageError(false);
  };

  const handleDeleteLogo = () => {
    setLogoUrl('');
    setLogoError(false);
  };

  // Save draft to localStorage
  const handleSaveDraft = () => {
    try {
      const draftData = {
        name,
        version,
        description,
        utility,
        process,
        benefits,
        url,
        website,
        twitter,
        telegram,
        security,
        roadmap,
        featuredImageUrl,
        logoUrl,
        savedAt: new Date().toISOString(),
      };

      const draftKey = `dapp_${dapp.id}_draft`;
      localStorage.setItem(draftKey, JSON.stringify(draftData));
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 3000);
    } catch (err) {
      console.error('Error saving draft:', err);
      setError('Failed to save draft');
    }
  };

  const isLoading = isSaving;

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
      if (featuredImagePreviewUrl) {
        URL.revokeObjectURL(featuredImagePreviewUrl);
      }
    };
  }, [logoPreviewUrl, featuredImagePreviewUrl]);
  const displayError = error;
  const isSaveButtonDisabled = isLoading || !isDeployerUser;

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose, isLoading]);

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md"
      onClick={!isLoading ? onClose : undefined}
    >
      <div
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg max-w-4xl w-full max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 z-10 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Edit {dapp.name}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Update your dApp information and images
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form Completion Indicator */}
          <FormCompletionIndicator
            filled={formCompletion.filled}
            total={formCompletion.total}
            type="linear"
          />
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4">
          {displayError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {displayError}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Changes saved successfully!
            </div>
          )}

          {draftSaved && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-600 dark:text-blue-400 text-sm flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Draft saved! Your changes will be restored when you reopen this editor.
            </div>
          )}


          {/* Basic Info Section */}
          <CollapsibleSection
            title="Basic Information"
            isOpen={basicInfoOpen}
            onToggle={() => setBasicInfoOpen(!basicInfoOpen)}
            icon={<span className="text-lg">📝</span>}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Version
                </label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="e.g., 1.0.0"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8] resize-none"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Utility
                </label>
                <textarea
                  value={utility}
                  onChange={(e) => setUtility(e.target.value)}
                  rows={4}
                  placeholder="What is the utility of this dApp?"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8] resize-none"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Process (How It Works)
                </label>
                <textarea
                  value={process}
                  onChange={(e) => setProcess(e.target.value)}
                  rows={4}
                  placeholder="How does this dApp work?"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8] resize-none"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Benefits
                </label>
                <textarea
                  value={benefits}
                  onChange={(e) => setBenefits(e.target.value)}
                  rows={4}
                  placeholder="What are the benefits of using this dApp?"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8] resize-none"
                  disabled={isLoading}
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Media & Images Section */}
          <CollapsibleSection
            title="Media & Images"
            isOpen={mediaOpen}
            onToggle={() => setMediaOpen(!mediaOpen)}
            icon={<span className="text-lg">🖼️</span>}
          >
            <div className="space-y-6">
              {/* Featured Image */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Featured Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={featuredImageUrl}
                    onChange={(e) => {
                      setFeaturedImageUrl(e.target.value);
                      setFeaturedImageError(false);
                    }}
                    placeholder="https://example.com/featured-image.jpg"
                    className="flex-1 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
                    disabled={isLoading}
                  />
                  {featuredImageUrl && (
                    <button
                      onClick={handleDeleteFeaturedImage}
                      disabled={isLoading}
                      className="px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Aspect Ratio: 16:9 (recommended) • Formats: PNG, JPG, WebP
                </p>
                {featuredImageUrl && (
                  <div className="mt-3">
                    <ImagePreview
                      imageUrl={featuredImageUrl}
                      alt="Featured image preview"
                      aspectRatio="video"
                      onError={() => setFeaturedImageError(true)}
                    />
                  </div>
                )}
              </div>

              {/* Image Upload Component for Featured Image */}
              <ImageUpload
                label=""
                value={featuredImageUrl}
                onChange={setFeaturedImageUrl}
                onFileSelect={async (file) => {
                  const cid = await uploadDAppFeaturedImage(dapp.id, file);
                  return cid;
                }}
                onDelete={() => {
                  setFeaturedImageUrl('');
                  localStorage.removeItem(`dapp_${dapp.id}_featuredImage`);
                }}
                aspectRatio="video"
                showUrlInput={false}
                showFileUpload={true}
                disabled={isLoading}
                className="mt-3"
              />

              {/* Logo/Avatar */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Logo/Avatar URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => {
                      setLogoUrl(e.target.value);
                      setLogoError(false);
                    }}
                    placeholder="https://example.com/logo.png"
                    className="flex-1 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
                    disabled={isLoading}
                  />
                  {logoUrl && (
                    <button
                      onClick={handleDeleteLogo}
                      disabled={isLoading}
                      className="px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Aspect Ratio: 1:1 (square) • Formats: PNG, SVG
                </p>
                {logoUrl && (
                  <div className="mt-3">
                    <ImagePreview
                      imageUrl={logoUrl}
                      alt="Logo preview"
                      aspectRatio="square"
                      className="max-w-xs"
                      onError={() => setLogoError(true)}
                    />
                  </div>
                )}
              </div>

              {/* Image Upload Component for Logo */}
              <ImageUpload
                label=""
                value={logoPreviewUrl || logoUrl}
                onChange={(url) => {
                  // If it's a URL (not a file), update directly
                  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('ipfs://') || /^(Qm|bafy|bafk)/i.test(url)) {
                    setLogoUrl(url);
                    setLogoFile(null);
                    if (logoPreviewUrl) {
                      URL.revokeObjectURL(logoPreviewUrl);
                      setLogoPreviewUrl('');
                    }
                  }
                }}
                onFileSelect={async (file) => {
                  // Store file for later upload, create preview URL
                  setLogoFile(file);
                  const previewUrl = URL.createObjectURL(file);
                  setLogoPreviewUrl(previewUrl);
                  // Clear the URL input since we're using a file
                  setLogoUrl('');
                  return previewUrl; // Return preview URL for immediate display
                }}
                onDelete={() => {
                  setLogoUrl('');
                  if (logoPreviewUrl) {
                    URL.revokeObjectURL(logoPreviewUrl);
                    setLogoPreviewUrl('');
                  }
                  setLogoFile(null);
                  localStorage.removeItem(`dapp_${dapp.id}_logo`);
                }}
                aspectRatio="square"
                showUrlInput={false}
                showFileUpload={true}
                disabled={isLoading}
                className="mt-3"
              />
            </div>
          </CollapsibleSection>

          {/* Links Section */}
          <CollapsibleSection
            title="Links"
            isOpen={linksOpen}
            onToggle={() => setLinksOpen(!linksOpen)}
            icon={<span className="text-lg">🔗</span>}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  dApp URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
                  disabled={isLoading}
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  The main URL for this dApp (if it has its own website)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Twitter/X
                </label>
                <input
                  type="url"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="https://x.com/username"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Telegram
                </label>
                <input
                  type="url"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  placeholder="https://t.me/username"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
                  disabled={isLoading}
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Advanced Section */}
          <CollapsibleSection
            title="Advanced"
            isOpen={advancedOpen}
            onToggle={() => setAdvancedOpen(!advancedOpen)}
            icon={<span className="text-lg">⚙️</span>}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Security
                </label>
                <textarea
                  value={security}
                  onChange={(e) => setSecurity(e.target.value)}
                  rows={4}
                  placeholder="Security information and measures"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8] resize-none"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Roadmap
                </label>
                <textarea
                  value={roadmap}
                  onChange={(e) => setRoadmap(e.target.value)}
                  rows={4}
                  placeholder="Future plans and roadmap"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8] resize-none"
                  disabled={isLoading}
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Debug Info Section */}
          <CollapsibleSection
            title="Debug & Status Info"
            isOpen={debugOpen}
            onToggle={() => setDebugOpen(!debugOpen)}
            icon={<span className="text-lg">🔍</span>}
          >
            <div className="space-y-4">
              {/* Current Status */}
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                  Current Status
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded">
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">Wallet Connected:</span>
                    <span className={`text-sm font-medium ${isConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {isConnected ? '✓ Yes' : '✗ No'}
                    </span>
                  </div>
                  {isConnected && connectedAddress && (
                    <div className="p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded">
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">Connected Address:</span>
                      <p className="text-xs font-mono text-zinc-900 dark:text-zinc-100 break-all mt-1">
                        {connectedAddress}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded">
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">Deployer Status:</span>
                    <span className={`text-sm font-medium ${isDeployerUser ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {isDeployerUser ? '✓ Authorized' : '✗ Not Authorized'}
                    </span>
                  </div>
                  {deployerAddress && (
                    <div className="p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded">
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">Deployer Address:</span>
                      <p className="text-xs font-mono text-zinc-900 dark:text-zinc-100 break-all mt-1">
                        {deployerAddress}
                      </p>
                    </div>
                  )}
                  <div className="p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">Network Chain ID:</span>
                    <p className="text-xs font-mono text-zinc-900 dark:text-zinc-100 mt-1">
                      {chainId || 'Not detected'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Steps to Success */}
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                  Steps to Save Changes
                </h4>
                <ol className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <li className={`flex items-start gap-2 ${isDeployerUser ? 'text-green-600 dark:text-green-400' : ''}`}>
                    <span className="font-semibold">1.</span>
                    <span>
                      {isDeployerUser ? '✓ ' : ''}Ensure you are the dApp deployer
                      {!isDeployerUser && (
                        <span className="block text-xs text-zinc-500 dark:text-zinc-400 mt-1 ml-4">
                          Your connected wallet address must match the deployer address: {deployerAddress || 'N/A'}
                        </span>
                      )}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold">2.</span>
                    <span>Fill in the form fields (all fields are optional except Name and Description)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold">3.</span>
                    <span>Click &quot;Save Changes&quot; button</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold">4.</span>
                    <span>Page will reload automatically after successful save</span>
                  </li>
                </ol>
              </div>

              {/* Troubleshooting */}
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                  Troubleshooting
                </h4>
                <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <p>
                    <strong className="text-zinc-900 dark:text-zinc-100">Button still disabled?</strong>
                    <br />
                    Only the deployer can edit this dApp. Make sure your connected wallet matches the deployer address.
                  </p>
                  <p>
                    <strong className="text-zinc-900 dark:text-zinc-100">Not the deployer?</strong>
                    <br />
                    Only the wallet address that deployed this dApp can edit it. Check the deployer address above.
                  </p>
                </div>
              </div>
            </div>
          </CollapsibleSection>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 min-h-[44px]"
              title="Save your progress without payment. Draft will be restored when you reopen the editor."
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save Draft
            </button>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaveButtonDisabled}
                className="px-4 py-2 text-sm font-medium text-white bg-[#02abb8] rounded-lg hover:bg-[#0299a3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
                title={isSaveButtonDisabled ? buttonDisabledReasons.join('. ') : 'Save changes and pay 10 KAS'}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {isConfirming ? 'Confirming...' : 'Processing...'}
                  </>
                ) : (
                  'Save & Pay 10 KAS'
                )}
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
