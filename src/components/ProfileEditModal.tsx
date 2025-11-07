'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAccount } from 'wagmi';
import type { ProfileData } from '@/hooks/useProfile';
import { useTreasuryPayment } from '@/hooks/useTreasuryPayment';
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Section states
  const [profileInfoOpen, setProfileInfoOpen] = useState(true);
  const [imagesOpen, setImagesOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

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
      setError(err.message || 'Payment failed');
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
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || !isConnected || !isTreasuryAvailable}
              className="px-4 py-2 text-sm font-medium text-white bg-[#02abb8] rounded-lg hover:bg-[#0299a3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
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
  );

  if (typeof window === 'undefined') {
    return null;
  }

  return createPortal(modalContent, document.body);
}

