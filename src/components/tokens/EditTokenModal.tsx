'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAccount, useChainId } from 'wagmi';
import type { Token, TokenAllocation, RoadmapEvent, TokenLink } from '@/lib/tokens/types';
import { isAdminAddress } from '@/lib/admin';
import { getErrorMessage } from '@/lib/utils';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { FormCompletionIndicator } from '@/components/ui/FormCompletionIndicator';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { 
  uploadTokenLogo, 
  uploadTokenFeaturedImage, 
  saveTokenLogo, 
  saveTokenFeaturedImage,
  deleteTokenLogo,
  deleteTokenFeaturedImage,
  loadTokenLogo,
  loadTokenFeaturedImage,
} from '@/lib/tokens/ipfs';
import { syncDAppLogoOnTokenUpdate } from '@/lib/tokens/sync';
import { getTokensByDAppId } from '@/lib/tokens/registry';
import { isDeployer } from '@/lib/dapps/deployer';

interface EditTokenModalProps {
  token: Token;
  onClose: () => void;
}

export function EditTokenModal({ token, onClose }: EditTokenModalProps) {
  const { address: connectedAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  // Section states
  const [basicInfoOpen, setBasicInfoOpen] = useState(true);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [tokenomicsOpen, setTokenomicsOpen] = useState(false);
  const [linksOpen, setLinksOpen] = useState(false);
  const [roadmapOpen, setRoadmapOpen] = useState(false);

  // Form state
  const [name, setName] = useState(token.name || '');
  const [symbol, setSymbol] = useState(token.symbol || '');
  const [description, setDescription] = useState(token.description || '');
  const [network, setNetwork] = useState<'L1' | 'L2'>(token.network || 'L2');
  const [contractAddress, setContractAddress] = useState(token.contractAddress || '');
  const [tokenType, setTokenType] = useState<'global' | 'local' | 'collab'>(token.type || 'global');
  const [decimals, setDecimals] = useState(token.decimals?.toString() || '18');
  
  // Tokenomics
  const [totalSupply, setTotalSupply] = useState(token.totalSupply?.toString() || '');
  const [maxSupply, setMaxSupply] = useState(token.maxSupply?.toString() || '');
  const [circulatingSupply, setCirculatingSupply] = useState(token.circulatingSupply?.toString() || '');
  
  // Images
  const [logoUrl, setLogoUrl] = useState('');
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  // Store files temporarily for upload after transaction
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null);
  // Preview URLs for local files
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>('');
  const [featuredImagePreviewUrl, setFeaturedImagePreviewUrl] = useState<string>('');

  // Links
  const [links, setLinks] = useState<TokenLink[]>(token.links || []);

  // Roadmap
  const [roadmap, setRoadmap] = useState<RoadmapEvent[]>(token.roadmap || []);

  // Check if user is admin or token creator
  const isAdmin = connectedAddress ? isAdminAddress(connectedAddress) : false;
  
  // For local tokens, check if user is dApp deployer
  const relatedTokens = token.parentDAppId ? getTokensByDAppId(token.parentDAppId) : [];
  const isTokenCreator = useMemo(() => {
    if (!connectedAddress || !isAdmin) return false;
    // Admin can edit all tokens
    // For local tokens, could also check dApp deployer status
    return true;
  }, [connectedAddress, isAdmin]);

  const canEdit = isAdmin || isTokenCreator;

  // Simple save state (no transaction required)
  const [isSaving, setIsSaving] = useState(false);

  // Load existing data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedLogo = loadTokenLogo(token.id);
        const savedFeatured = loadTokenFeaturedImage(token.id);
        
        if (savedLogo) {
          setLogoUrl(savedLogo);
        } else if (token.logoCid) {
          setLogoUrl(token.logoCid);
        } else if (token.logo) {
          setLogoUrl(token.logo);
        }

        if (savedFeatured) {
          setFeaturedImageUrl(savedFeatured);
        } else if (token.featuredImageCid) {
          setFeaturedImageUrl(token.featuredImageCid);
        } else if (token.featuredImage) {
          setFeaturedImageUrl(token.featuredImage);
        }

        // Load draft if exists
        const draftKey = `token_${token.id}_draft`;
        const draft = localStorage.getItem(draftKey);
        if (draft) {
          try {
            const draftData = JSON.parse(draft);
            if (draftData.name) setName(draftData.name);
            if (draftData.symbol) setSymbol(draftData.symbol);
            if (draftData.description) setDescription(draftData.description);
            if (draftData.logoUrl) setLogoUrl(draftData.logoUrl);
            if (draftData.featuredImageUrl) setFeaturedImageUrl(draftData.featuredImageUrl);
          } catch (err) {
            console.error('Error loading draft:', err);
          }
        }
      } catch (err) {
        console.error('Error loading token data:', err);
      }
    }
  }, [token]);

  // Auto-save draft
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const draftKey = `token_${token.id}_draft`;
    const draft = {
      name,
      symbol,
      description,
      logoUrl,
      featuredImageUrl,
    };

    const timer = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(draft));
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 2000);
      } catch (err) {
        console.error('Error saving draft:', err);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [name, symbol, description, logoUrl, featuredImageUrl, token.id]);

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);

    // Validate required fields
    if (!name.trim()) {
      setError('Token name is required');
      setIsSaving(false);
      return;
    }
    if (!symbol.trim()) {
      setError('Token symbol is required');
      setIsSaving(false);
      return;
    }

    try {
      // Upload files to IPFS if they were selected
      let finalLogoUrl = logoUrl.trim();
      let finalFeaturedImageUrl = featuredImageUrl.trim();

      // Upload logo file if one was selected
      if (logoFile) {
        const logoCid = await uploadTokenLogo(token.id, logoFile);
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
        const featuredCid = await uploadTokenFeaturedImage(token.id, featuredImageFile);
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

      // Save metadata (convert BigInt to strings for JSON serialization)
      const metadata = {
        name: name.trim() || token.name,
        symbol: symbol.trim().toUpperCase() || token.symbol,
        description: description.trim(),
        network,
        contractAddress: contractAddress.trim(),
        type: tokenType,
        decimals: parseInt(decimals) || 18,
        totalSupply: totalSupply || undefined, // Keep as string for localStorage
        maxSupply: maxSupply || undefined, // Keep as string for localStorage
        circulatingSupply: circulatingSupply || undefined, // Keep as string for localStorage
        links,
        roadmap,
      };

      const metadataKey = `token_${token.id}_metadata`;
      localStorage.setItem(metadataKey, JSON.stringify(metadata));

      // Save images (using final URLs after IPFS upload)
      if (finalLogoUrl) {
        saveTokenLogo(token.id, finalLogoUrl);
      } else {
        deleteTokenLogo(token.id);
      }

      if (finalFeaturedImageUrl) {
        saveTokenFeaturedImage(token.id, finalFeaturedImageUrl);
      } else {
        deleteTokenFeaturedImage(token.id);
      }

      // Sync dApp logo if this is a local token
      if (token.parentDAppId || token.relatedDAppIds) {
        syncDAppLogoOnTokenUpdate({ ...token, logoCid: finalLogoUrl });
      }

      // Clear draft
      localStorage.removeItem(`token_${token.id}_draft`);

      setSuccess(true);
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error('Error saving token data:', err);
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

  const isLoading = isSaving;
  const canSave = canEdit && !isLoading;

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

  // Form completion calculation
  const formCompletion = useMemo(() => {
    const fields = [
      name.trim(),
      symbol.trim(),
      description.trim(),
      logoPreviewUrl || logoUrl.trim(),
    ];
    const filled = fields.filter(Boolean).length;
    return { filled, total: fields.length };
  }, [name, symbol, description, logoUrl, logoPreviewUrl]);


  if (!canEdit) {
    return null; // Don't render if user can't edit
  }

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
                Edit {token.name}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Update token information and images
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

          <FormCompletionIndicator
            filled={formCompletion.filled}
            total={formCompletion.total}
            type="linear"
          />
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Basic Info Section */}
          <CollapsibleSection
            title="Basic Information"
            isOpen={basicInfoOpen}
            onToggle={() => setBasicInfoOpen(!basicInfoOpen)}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                  Token Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8] disabled:opacity-50"
                  placeholder="e.g., Kasparex Token"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                  Token Symbol *
                </label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  disabled={isLoading || !!token.contractAddress}
                  readOnly={!!token.contractAddress}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8] disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="e.g., KREX"
                  maxLength={10}
                  title={token.contractAddress ? 'Token symbol cannot be changed after deployment' : ''}
                />
                {token.contractAddress && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Token symbol cannot be changed after deployment
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isLoading}
                  rows={4}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8] disabled:opacity-50"
                  placeholder="Describe your token..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                    Network
                  </label>
                  <select
                    value={network}
                    onChange={(e) => setNetwork(e.target.value as 'L1' | 'L2')}
                    disabled={isLoading || !!token.contractAddress}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8] disabled:opacity-50 disabled:cursor-not-allowed"
                    title={token.contractAddress ? 'Network cannot be changed after deployment' : ''}
                  >
                    <option value="L1">L1 (Kaspa)</option>
                    <option value="L2">L2 (Kasplex)</option>
                  </select>
                  {token.contractAddress && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Network cannot be changed after deployment
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                    Token Type
                  </label>
                  <select
                    value={tokenType}
                    onChange={(e) => setTokenType(e.target.value as 'global' | 'local' | 'collab')}
                    disabled={isLoading || !!token.contractAddress}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8] disabled:opacity-50 disabled:cursor-not-allowed"
                    title={token.contractAddress ? 'Token type cannot be changed after deployment' : ''}
                  >
                    <option value="global">Global</option>
                    <option value="local">Local</option>
                    <option value="collab">Collab</option>
                  </select>
                  {token.contractAddress && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Token type cannot be changed after deployment
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                    Contract Address
                  </label>
                  <input
                    type="text"
                    value={contractAddress}
                    onChange={(e) => setContractAddress(e.target.value)}
                    disabled={isLoading || !!token.contractAddress}
                    readOnly={!!token.contractAddress}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8] disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm"
                    placeholder="0x..."
                    title={token.contractAddress ? 'Contract address cannot be changed after deployment' : ''}
                  />
                  {token.contractAddress && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Contract address cannot be changed after deployment
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                    Decimals
                  </label>
                  <input
                    type="number"
                    value={decimals}
                    onChange={(e) => setDecimals(e.target.value)}
                    disabled={isLoading || !!token.contractAddress}
                    readOnly={!!token.contractAddress}
                    min="0"
                    max="18"
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8] disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="18"
                    title={token.contractAddress ? 'Decimals cannot be changed after deployment' : ''}
                  />
                  {token.contractAddress && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Decimals cannot be changed after deployment
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Media Section */}
          <CollapsibleSection
            title="Media"
            isOpen={mediaOpen}
            onToggle={() => setMediaOpen(!mediaOpen)}
          >
            <div className="space-y-6">
              <ImageUpload
                label="Logo"
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
                  deleteTokenLogo(token.id);
                }}
                aspectRatio="square"
                showUrlInput={true}
                showFileUpload={true}
                disabled={isLoading}
              />

              <ImageUpload
                label="Featured Image"
                value={featuredImagePreviewUrl || featuredImageUrl}
                onChange={(url) => {
                  // If it's a URL (not a file), update directly
                  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('ipfs://') || /^(Qm|bafy|bafk)/i.test(url)) {
                    setFeaturedImageUrl(url);
                    setFeaturedImageFile(null);
                    if (featuredImagePreviewUrl) {
                      URL.revokeObjectURL(featuredImagePreviewUrl);
                      setFeaturedImagePreviewUrl('');
                    }
                  }
                }}
                onFileSelect={async (file) => {
                  // Store file for later upload, create preview URL
                  setFeaturedImageFile(file);
                  const previewUrl = URL.createObjectURL(file);
                  setFeaturedImagePreviewUrl(previewUrl);
                  // Clear the URL input since we're using a file
                  setFeaturedImageUrl('');
                  return previewUrl; // Return preview URL for immediate display
                }}
                onDelete={() => {
                  setFeaturedImageUrl('');
                  if (featuredImagePreviewUrl) {
                    URL.revokeObjectURL(featuredImagePreviewUrl);
                    setFeaturedImagePreviewUrl('');
                  }
                  setFeaturedImageFile(null);
                  deleteTokenFeaturedImage(token.id);
                }}
                aspectRatio="video"
                showUrlInput={true}
                showFileUpload={true}
                disabled={isLoading}
              />
            </div>
          </CollapsibleSection>

          {/* Tokenomics Section */}
          <CollapsibleSection
            title="Tokenomics"
            isOpen={tokenomicsOpen}
            onToggle={() => setTokenomicsOpen(!tokenomicsOpen)}
          >
            <div className="space-y-4">
              {token.contractAddress && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ Tokenomics cannot be changed after deployment. These fields are read-only.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                    Total Supply
                  </label>
                  <input
                    type="text"
                    value={totalSupply}
                    onChange={(e) => setTotalSupply(e.target.value)}
                    disabled={isLoading || !!token.contractAddress}
                    readOnly={!!token.contractAddress}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8] disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="0"
                    title={token.contractAddress ? 'Tokenomics cannot be changed after deployment' : ''}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                    Max Supply
                  </label>
                  <input
                    type="text"
                    value={maxSupply}
                    onChange={(e) => setMaxSupply(e.target.value)}
                    disabled={isLoading || !!token.contractAddress}
                    readOnly={!!token.contractAddress}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8] disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="0"
                    title={token.contractAddress ? 'Tokenomics cannot be changed after deployment' : ''}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                    Circulating Supply
                  </label>
                  <input
                    type="text"
                    value={circulatingSupply}
                    onChange={(e) => setCirculatingSupply(e.target.value)}
                    disabled={isLoading || !!token.contractAddress}
                    readOnly={!!token.contractAddress}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8] disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="0"
                    title={token.contractAddress ? 'Tokenomics cannot be changed after deployment' : ''}
                  />
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">
                Token updated successfully! Reloading...
              </p>
            </div>
          )}

          {/* Draft Saved Indicator */}
          {draftSaved && (
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-600 dark:text-blue-400">Draft saved</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave || isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-[#02abb8] rounded-lg hover:bg-[#0299a6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
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
