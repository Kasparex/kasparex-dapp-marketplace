'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProfileSidebar } from '@/components/ProfileSidebar';
import { TokenBalance } from '@/components/TokenBalance';
import { ProfileEdit } from '@/components/ProfileEdit';
import { useProfile } from '@/hooks/useProfile';
import { isAddress } from 'viem';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { address: connectedAddress, isConnected } = useAccount();
  const walletAddress = params?.['wallet-address'] as string | undefined;
  const [isEditMode, setIsEditMode] = useState(false);

  // Validate wallet address
  const isValidAddress = walletAddress && isAddress(walletAddress);

  const { profile, emoji, isLoading: profileLoading, updateProfile } = useProfile(
    isValidAddress ? walletAddress : undefined
  );

  // Check if viewing own profile
  const isOwnProfile = isConnected && 
    connectedAddress?.toLowerCase() === walletAddress?.toLowerCase();

  // Redirect to edit mode if URL has ?edit=true
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('edit') === 'true') {
      setIsEditMode(true);
    }
  }, []);

  if (!walletAddress || !isValidAddress) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Invalid Wallet Address
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              The provided wallet address is not valid.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col min-h-screen" 
      style={{ 
        userSelect: profile.hideBalance ? 'none' : 'auto',
        WebkitUserSelect: profile.hideBalance ? 'none' : 'auto',
        MozUserSelect: profile.hideBalance ? 'none' : 'auto',
        msUserSelect: profile.hideBalance ? 'none' : 'auto',
      }}
    >
      <Header />
      
      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Profile Sidebar */}
        <div className="hidden lg:block w-full lg:w-1/4 lg:max-w-xs flex-shrink-0">
          <ProfileSidebar
            walletAddress={walletAddress}
            emoji={emoji}
            profile={profile}
            isOwnProfile={isOwnProfile}
            isEditMode={isEditMode}
            onToggleEdit={() => setIsEditMode(!isEditMode)}
            onProfileUpdate={updateProfile}
          />
        </div>
        {/* Mobile sidebar */}
        <div className="lg:hidden">
          <ProfileSidebar
            walletAddress={walletAddress}
            emoji={emoji}
            profile={profile}
            isOwnProfile={isOwnProfile}
            isEditMode={isEditMode}
            onToggleEdit={() => setIsEditMode(!isEditMode)}
            onProfileUpdate={updateProfile}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 lg:pl-6">
          <div className="max-w-4xl">
            {/* Profile Header */}
            <div className="mb-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="text-6xl select-none" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
                  {emoji}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                      {profile.displayName || 'Unnamed User'}
                    </h1>
                    {isOwnProfile && (
                      <button
                        onClick={() => setIsEditMode(!isEditMode)}
                        className="px-3 py-1 text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                      >
                        {isEditMode ? 'Cancel Edit' : 'Edit Profile'}
                      </button>
                    )}
                  </div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400 font-mono mb-4">
                    {walletAddress}
                  </div>
                  {profile.bio && (
                    <p className="text-zinc-700 dark:text-zinc-300 mb-4">
                      {profile.bio}
                    </p>
                  )}
                  <div className="flex items-center gap-6">
                    <div 
                      style={profile.hideBalance ? {
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        MozUserSelect: 'none',
                        msUserSelect: 'none',
                        pointerEvents: 'none',
                      } : {}}
                    >
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                        Balance
                      </div>
                      <TokenBalance 
                        address={walletAddress as `0x${string}`}
                        hideBalance={profile.hideBalance}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Mode Content */}
            {isEditMode && isOwnProfile && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                  Edit Profile
                </h2>
                <ProfileEdit
                  profile={profile}
                  onSave={(updates) => {
                    updateProfile(updates);
                    setIsEditMode(false);
                  }}
                  onCancel={() => setIsEditMode(false)}
                />
              </div>
            )}

            {/* Profile Stats or Additional Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  Wallet Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">Address:</span>
                    <div className="text-zinc-900 dark:text-zinc-100 font-mono text-xs break-all mt-1">
                      {walletAddress}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  Profile Status
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">Display Name:</span>
                    <div className="text-zinc-900 dark:text-zinc-100 mt-1">
                      {profile.displayName || 'Not set'}
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">Bio:</span>
                    <div className="text-zinc-900 dark:text-zinc-100 mt-1">
                      {profile.bio || 'Not set'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

