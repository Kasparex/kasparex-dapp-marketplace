'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAccount, useChainId } from 'wagmi';
import type { ProfileData } from '@/hooks/useProfile';
import { useTreasuryPayment } from '@/hooks/useTreasuryPayment';
import { getErrorMessage } from '@/lib/utils';
import { useSafeError } from '@/hooks/useSafeError';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { ProgressBar, type ProgressStage } from '@/components/ui/ProgressBar';
import { FormCompletionIndicator } from '@/components/ui/FormCompletionIndicator';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { ImagePreview } from '@/components/ImagePreview';

interface ProfileEditModalProps {
  profile: ProfileData;
  walletAddress: string;
  onClose: () => void;
  onSave?: (updates: Partial<ProfileData>) => void;
}

export function ProfileEditModal({
  profile,
  walletAddress,
  onClose,
  onSave,
}: ProfileEditModalProps) {
  const { address: connectedAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  // Section states
  const [profileInfoOpen, setProfileInfoOpen] = useState(true);
  const [imagesOpen, setImagesOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [hideBalance, setHideBalance] = useState(profile.hideBalance || false);
  const [preventScreenshots, setPreventScreenshots] = useState(profile.preventScreenshots || false);

  // Image states
  const [profilePictureUrl, setProfilePictureUrl] = useState(profile.profilePicture || '');
  const [featuredImageUrl, setFeaturedImageUrl] = useState(profile.featuredImage || '');
  const [profilePictureError, setProfilePictureError] = useState(false);
  const [featuredImageError, setFeaturedImageError] = useState(false);

  // Load draft on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const draftKey = `profile_${walletAddress.toLowerCase()}_draft`;
        const draft = localStorage.getItem(draftKey);
        if (draft) {
          try {
            const draftData = JSON.parse(draft);
            if (draftData.displayName !== undefined) setDisplayName(draftData.displayName);
            if (draftData.bio !== undefined) setBio(draftData.bio);
            if (draftData.hideBalance !== undefined) setHideBalance(draftData.hideBalance);
            if (draftData.preventScreenshots !== undefined) setPreventScreenshots(draftData.preventScreenshots);
            if (draftData.profilePictureUrl !== undefined) setProfilePictureUrl(draftData.profilePictureUrl);
            if (draftData.featuredImageUrl !== undefined) setFeaturedImageUrl(draftData.featuredImageUrl);
          } catch (err) {
            console.error('Error loading draft:', err);
          }
        }
      } catch (err) {
        console.error('Error loading draft:', err);
      }
    }
  }, [walletAddress]);

  // Treasury payment hook
  const {
    pay,
    isPaying,
    isConfirming,
    isSuccess: paymentSuccess,
    error: paymentError,
    treasuryAddress,
    isTreasuryAvailable,
  } = useTreasuryPayment({
    amount: '10',
    onSuccess: (txHash) => {
      // Save all data to localStorage
      try {
        const updates: Partial<ProfileData> = {
          displayName: displayName.trim(),
          bio: bio.trim(),
          hideBalance,
          preventScreenshots,
          profilePicture: profilePictureUrl.trim() || undefined,
          featuredImage: featuredImageUrl.trim() || undefined,
        };

        const key = `profile_${walletAddress.toLowerCase()}`;
        const currentProfile = JSON.parse(localStorage.getItem(key) || '{}');
        const newProfile = { ...currentProfile, ...updates };
        localStorage.setItem(key, JSON.stringify(newProfile));

        // Clear draft after successful save
        localStorage.removeItem(`profile_${walletAddress.toLowerCase()}_draft`);

        if (onSave) {
          onSave(updates);
        }

        setSuccess(true);
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 1500);
      } catch (err) {
        console.error('Error saving profile:', err);
        setError('Failed to save changes');
      }
    },
    onError: (err) => {
      // Convert error to string immediately to prevent 'in' operator issues
      // err is already an Error object from useTreasuryPayment, but we convert it safely
      try {
        const errorMessage = getErrorMessage(err, 'Payment failed');
        setError(errorMessage);
      } catch {
        // Fallback if error conversion fails
        setError('Payment failed');
      }
    },
  });

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
    const fields = [displayName, bio, profilePictureUrl, featuredImageUrl];
    const filled = fields.filter(f => f && f.trim() !== '').length;
    return { filled, total: fields.length };
  }, [displayName, bio, profilePictureUrl, featuredImageUrl]);

  // Get payment progress stage
  const getPaymentStage = (): ProgressStage => {
    if (paymentSuccess) return 'complete';
    if (isConfirming) return 'confirming';
    if (isPaying) return 'processing';
    return 'ready';
  };

  const handleSave = async () => {
    setError(null);

    if (!isConnected || !connectedAddress) {
      setError('Please connect your wallet');
      return;
    }

    if (connectedAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      setError('You can only edit your own profile');
      return;
    }

    // Validate image URLs
    if (profilePictureUrl.trim() && !validateImageUrl(profilePictureUrl)) {
      setError('Profile picture URL is invalid. Must be http:// or https://');
      return;
    }

    if (featuredImageUrl.trim() && !validateImageUrl(featuredImageUrl)) {
      setError('Featured image URL is invalid. Must be http:// or https://');
      return;
    }

    if (!isTreasuryAvailable) {
      setError('Treasury address not available for this network');
      return;
    }

    // Make payment
    await pay();
  };

  const handleDeleteProfilePicture = () => {
    setProfilePictureUrl('');
    setProfilePictureError(false);
  };

  const handleDeleteFeaturedImage = () => {
    setFeaturedImageUrl('');
    setFeaturedImageError(false);
  };

  // Save draft to localStorage
  const handleSaveDraft = () => {
    try {
      const draftData = {
        displayName,
        bio,
        hideBalance,
        preventScreenshots,
        profilePictureUrl,
        featuredImageUrl,
        savedAt: new Date().toISOString(),
      };

      const draftKey = `profile_${walletAddress.toLowerCase()}_draft`;
      localStorage.setItem(draftKey, JSON.stringify(draftData));
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 3000);
    } catch (err) {
      console.error('Error saving draft:', err);
      setError('Failed to save draft');
    }
  };

  // Get button disabled reasons
  const getButtonDisabledReasons = () => {
    const reasons: string[] = [];
    if (!isConnected) reasons.push('Connect your wallet');
    if (connectedAddress && connectedAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      reasons.push('You can only edit your own profile');
    }
    if (!isTreasuryAvailable) reasons.push('Treasury not available on this network');
    return reasons;
  };

  const isLoading = isPaying || isConfirming;
  // Safely convert errors to strings immediately
  const safePaymentError = useSafeError(paymentError);
  const displayError = error || safePaymentError;

  const buttonDisabledReasons = getButtonDisabledReasons();
  const isSaveButtonDisabled = isLoading || !isConnected || !isTreasuryAvailable || 
    (connectedAddress && connectedAddress.toLowerCase() !== walletAddress.toLowerCase());

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

  const progressStages = [
    { id: 'ready' as ProgressStage, label: 'Ready', progress: 0 },
    { id: 'processing' as ProgressStage, label: 'Processing', progress: 33 },
    { id: 'confirming' as ProgressStage, label: 'Confirming', progress: 66 },
    { id: 'complete' as ProgressStage, label: 'Complete', progress: 100 },
  ];

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm"
      onClick={!isLoading ? onClose : undefined}
    >
      <div
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 z-10 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Edit Profile
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Update your profile information and images
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
              Profile updated successfully!
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

          {/* Button disabled reasons */}
          {isSaveButtonDisabled && buttonDisabledReasons.length > 0 && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                To save & pay, you need:
              </p>
              <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1 list-disc list-inside">
                {buttonDisabledReasons.map((reason, index) => (
                  <li key={index}>{reason}</li>
                ))}
              </ul>
              <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2">
                💡 Tip: You can save a draft without payment to continue later.
              </p>
            </div>
          )}

          {/* Progress Bar (shown during payment) */}
          {(isPaying || isConfirming || paymentSuccess) && (
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <ProgressBar
                stages={progressStages}
                currentStage={getPaymentStage()}
              />
            </div>
          )}

          {/* Profile Info Section */}
          <CollapsibleSection
            title="Profile Information"
            isOpen={profileInfoOpen}
            onToggle={() => setProfileInfoOpen(!profileInfoOpen)}
            icon={<span className="text-lg">👤</span>}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Display Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter display name"
                    maxLength={50}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
                    disabled={isLoading}
                  />
                  <div className="absolute right-3 top-2 text-xs text-zinc-500 dark:text-zinc-400">
                    {displayName.length}/50
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself"
                  rows={4}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8] resize-none"
                  disabled={isLoading}
                />
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 text-right">
                  {bio.length}/500
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Images Section */}
          <CollapsibleSection
            title="Images"
            isOpen={imagesOpen}
            onToggle={() => setImagesOpen(!imagesOpen)}
            icon={<span className="text-lg">🖼️</span>}
          >
            <div className="space-y-6">
              {/* Profile Picture */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Profile Picture URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={profilePictureUrl}
                    onChange={(e) => {
                      setProfilePictureUrl(e.target.value);
                      setProfilePictureError(false);
                    }}
                    placeholder="https://example.com/profile-picture.jpg"
                    className="flex-1 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
                    disabled={isLoading}
                  />
                  {profilePictureUrl && (
                    <button
                      onClick={handleDeleteProfilePicture}
                      disabled={isLoading}
                      className="px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Aspect Ratio: 1:1 (square) • Formats: PNG, JPG, WebP
                </p>
                {profilePictureUrl && (
                  <div className="mt-3">
                    <ImagePreview
                      imageUrl={profilePictureUrl}
                      alt="Profile picture preview"
                      aspectRatio="square"
                      className="max-w-xs"
                      onError={() => setProfilePictureError(true)}
                    />
                  </div>
                )}
              </div>

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

              {/* Future file upload placeholder */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                  File upload functionality coming soon. For now, please use image URLs.
                </p>
              </div>
            </div>
          </CollapsibleSection>

          {/* Privacy Settings Section */}
          <CollapsibleSection
            title="Privacy Settings"
            isOpen={privacyOpen}
            onToggle={() => setPrivacyOpen(!privacyOpen)}
            icon={<span className="text-lg">🔒</span>}
          >
            <div className="space-y-4">
              <ToggleSwitch
                checked={hideBalance}
                onChange={setHideBalance}
                label="Hide Balance"
                description="Prevent others from seeing your token balances"
                disabled={isLoading}
              />

              <ToggleSwitch
                checked={preventScreenshots}
                onChange={setPreventScreenshots}
                label="Prevent Screenshots"
                description="Discourage screenshots of your profile (client-side only)"
                disabled={isLoading}
              />
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
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">Profile Owner Match:</span>
                    <span className={`text-sm font-medium ${
                      connectedAddress && connectedAddress.toLowerCase() === walletAddress.toLowerCase()
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {connectedAddress && connectedAddress.toLowerCase() === walletAddress.toLowerCase()
                        ? '✓ Match'
                        : '✗ No Match'}
                    </span>
                  </div>
                  <div className="p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">Profile Wallet Address:</span>
                    <p className="text-xs font-mono text-zinc-900 dark:text-zinc-100 break-all mt-1">
                      {walletAddress}
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded">
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">Treasury Available:</span>
                    <span className={`text-sm font-medium ${isTreasuryAvailable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {isTreasuryAvailable ? '✓ Available' : '✗ Not Available'}
                    </span>
                  </div>
                  {treasuryAddress && (
                    <div className="p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded">
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">Treasury Address:</span>
                      <p className="text-xs font-mono text-zinc-900 dark:text-zinc-100 break-all mt-1">
                        {treasuryAddress}
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
                  Steps to Complete Transaction
                </h4>
                <ol className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <li className={`flex items-start gap-2 ${isConnected ? 'text-green-600 dark:text-green-400' : ''}`}>
                    <span className="font-semibold">1.</span>
                    <span>
                      {isConnected ? '✓ ' : ''}Connect your EVM wallet (MetaMask, RainbowKit, etc.)
                      {!isConnected && (
                        <span className="block text-xs text-zinc-500 dark:text-zinc-400 mt-1 ml-4">
                          Click the wallet connect button in the header
                        </span>
                      )}
                    </span>
                  </li>
                  <li className={`flex items-start gap-2 ${
                    connectedAddress && connectedAddress.toLowerCase() === walletAddress.toLowerCase()
                      ? 'text-green-600 dark:text-green-400'
                      : ''
                  }`}>
                    <span className="font-semibold">2.</span>
                    <span>
                      {connectedAddress && connectedAddress.toLowerCase() === walletAddress.toLowerCase() ? '✓ ' : ''}
                      Ensure you are editing your own profile
                      {connectedAddress && connectedAddress.toLowerCase() !== walletAddress.toLowerCase() && (
                        <span className="block text-xs text-zinc-500 dark:text-zinc-400 mt-1 ml-4">
                          Your connected wallet address must match the profile address: {walletAddress}
                        </span>
                      )}
                    </span>
                  </li>
                  <li className={`flex items-start gap-2 ${isTreasuryAvailable ? 'text-green-600 dark:text-green-400' : ''}`}>
                    <span className="font-semibold">3.</span>
                    <span>
                      {isTreasuryAvailable ? '✓ ' : ''}Ensure Treasury is available on your network
                      {!isTreasuryAvailable && (
                        <span className="block text-xs text-zinc-500 dark:text-zinc-400 mt-1 ml-4">
                          Switch to Kasplex L2 Testnet (167012) or Mainnet (202555)
                        </span>
                      )}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold">4.</span>
                    <span>Fill in the form fields (all fields are optional)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold">5.</span>
                    <span>Click &quot;Save &amp; Pay 10 KAS&quot; button</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold">6.</span>
                    <span>Approve the transaction in your wallet</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold">7.</span>
                    <span>Wait for transaction confirmation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold">8.</span>
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
                    Check the yellow info box above for specific requirements. All conditions (wallet connected, profile owner match, treasury available) must be met.
                  </p>
                  <p>
                    <strong className="text-zinc-900 dark:text-zinc-100">Wrong wallet address?</strong>
                    <br />
                    You can only edit your own profile. Make sure the connected wallet address matches the profile address shown above.
                  </p>
                  <p>
                    <strong className="text-zinc-900 dark:text-zinc-100">Treasury not available?</strong>
                    <br />
                    Make sure you&apos;re connected to Kasplex L2 Testnet or Mainnet. Treasury contract must be deployed on your current network.
                  </p>
                  <p>
                    <strong className="text-zinc-900 dark:text-zinc-100">Transaction failed?</strong>
                    <br />
                    Ensure you have at least 10 KAS in your wallet for the payment. Check your wallet balance and network connection.
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

