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
import { useFavorites } from '@/hooks/useFavorites';
import { isAddress } from 'viem';
import { Avatar } from '@/components/Avatar';
import { placeholderDApps } from '@/lib/dapps';
import { DAppGrid } from '@/components/DAppGrid';
import { Activity } from '@/components/Activity';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { formatKaspaAddress } from '@/lib/kaspa/wallet';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { address: connectedAddress, isConnected } = useAccount();
  const { state: kaspaState } = useKaspaWallet();
  const walletAddress = params?.['wallet-address'] as string | undefined;
  const [showEditModal, setShowEditModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'dapps' | 'favorites' | 'settings'>('overview');
  const { getFavoritesForWallet } = useFavorites();

  // Validate wallet address
  const isValidAddress = walletAddress && isAddress(walletAddress);

  const { profile, emoji, isLoading: profileLoading, updateProfile } = useProfile(
    isValidAddress ? walletAddress : undefined
  );

  // Check if viewing own profile
  const isOwnProfile = isConnected && 
    connectedAddress?.toLowerCase() === walletAddress?.toLowerCase();

  // Get last 5 digits of wallet address for default username
  const getDefaultUsername = (address: string) => {
    return address.slice(-5);
  };

  const displayName = profile.displayName || getDefaultUsername(walletAddress || '');

  // Redirect to edit mode if URL has ?edit=true
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('edit') === 'true') {
      setShowEditModal(true);
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
      } as React.CSSProperties}
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
            onToggleEdit={() => setShowEditModal(true)}
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
            onToggleEdit={() => setShowEditModal(true)}
            onProfileUpdate={updateProfile}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 lg:pl-6">
          <div className="max-w-6xl">
            {/* Profile Header with Title and Count */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <Avatar address={walletAddress} size={64} />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                    {displayName}
                  </h1>
                  <p className="text-base text-zinc-500 dark:text-zinc-400">
                    1 profile found
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isOwnProfile && (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="px-4 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-medium"
                  >
                    Edit Profile
                  </button>
                )}
                <button className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
                <button className="px-4 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-medium">
                  Newly Created
                  <svg className="w-4 h-4 inline-block ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex items-center gap-1 mb-6 border-b border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'text-zinc-900 dark:text-zinc-100 border-b-2 border-zinc-900 dark:border-zinc-100'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'activity'
                    ? 'text-zinc-900 dark:text-zinc-100 border-b-2 border-zinc-900 dark:border-zinc-100'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                Activity
              </button>
              <button
                onClick={() => setActiveTab('dapps')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'dapps'
                    ? 'text-zinc-900 dark:text-zinc-100 border-b-2 border-zinc-900 dark:border-zinc-100'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                dApps
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'favorites'
                    ? 'text-zinc-900 dark:text-zinc-100 border-b-2 border-zinc-900 dark:border-zinc-100'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                Favorites
              </button>
              {isOwnProfile && (
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'settings'
                      ? 'text-zinc-900 dark:text-zinc-100 border-b-2 border-zinc-900 dark:border-zinc-100'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  Settings
                </button>
              )}
            </div>

            {/* Tab Content */}
            {activeTab === 'activity' && (
              <Activity walletAddress={walletAddress} />
            )}

            {activeTab === 'favorites' && (() => {
              const favoriteIds = getFavoritesForWallet(walletAddress);
              const favoriteDApps = placeholderDApps.filter(dapp => favoriteIds.includes(dapp.id));
              
              return (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                    Favorite dApps
                  </h2>
                  {favoriteDApps.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                      <p className="text-zinc-500 dark:text-zinc-400">
                        No favorite dApps yet. Start favoriting dApps to see them here!
                      </p>
                    </div>
                  ) : (
                    <DAppGrid dapps={favoriteDApps} />
                  )}
                </div>
              );
            })()}

            {/* Edit Profile Modal */}
            {showEditModal && isOwnProfile && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowEditModal(false)}>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                      Edit Profile
                    </h2>
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      aria-label="Close modal"
                    >
                      <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <ProfileEdit
                    profile={profile}
                    onSave={(updates) => {
                      updateProfile(updates);
                      setShowEditModal(false);
                    }}
                    onCancel={() => setShowEditModal(false)}
                  />
                </div>
              </div>
            )}

            {/* Cards Grid - Profile Information */}
            {activeTab === 'overview' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-6">
              {/* Balance Card */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    Balance
                  </h3>
                  {isOwnProfile && (
                    <button
                      onClick={() => updateProfile({ hideBalance: !profile.hideBalance })}
                      className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title={profile.hideBalance ? 'Show balance' : 'Hide balance'}
                      aria-label={profile.hideBalance ? 'Show balance' : 'Hide balance'}
                    >
                      {profile.hideBalance ? (
                        <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0L9.88 9.88m-3.59-3.59L9.88 9.88" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
                <div 
                  className="text-2xl font-bold"
                  style={profile.hideBalance ? {
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none',
                    pointerEvents: 'none',
                  } as React.CSSProperties : {}}
                >
                  <TokenBalance 
                    address={walletAddress as `0x${string}`}
                    hideBalance={profile.hideBalance}
                  />
                </div>
                {isOwnProfile && (
                  <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">Privacy:</span>
                      <span className={`text-xs px-2 py-1 rounded ${profile.hideBalance ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'}`}>
                        {profile.hideBalance ? 'Balance Hidden' : 'Balance Visible'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Wallet Information Card */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    Wallet
                  </h3>
                </div>
                <div className="space-y-2 text-base">
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400 text-sm mb-2 block">Address:</span>
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(walletAddress);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        } catch (err) {
                          console.error('Failed to copy address:', err);
                        }
                      }}
                      className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-mono text-zinc-900 dark:text-zinc-100 break-all text-left hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors relative"
                      title="Click to copy address"
                    >
                      {walletAddress}
                      {copied && (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-green-600 dark:text-green-400 font-sans">
                          Copied!
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Cards - Profile Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                  Profile Status
                </h3>
                <div className="space-y-3 text-base">
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">Display Name:</span>
                    <div className="text-zinc-900 dark:text-zinc-100 mt-1 font-medium">
                      {profile.displayName || 'Not set'}
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">Bio:</span>
                    <div className="text-zinc-900 dark:text-zinc-100 mt-1">
                      {profile.bio || 'Not set'}
                    </div>
                  </div>
                  {profile.preventScreenshots && (
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400">Privacy:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                          Screenshot Protection
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  {isOwnProfile && (
                    <>
                      <button
                        onClick={() => setShowEditModal(true)}
                        className="w-full text-left px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
                      >
                        Edit Profile
                      </button>
                      <button className="w-full text-left px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium">
                        View Activity
                      </button>
                    </>
                  )}
                  <button className="w-full text-left px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium">
                    Share Profile
                  </button>
                </div>
              </div>
            </div>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

