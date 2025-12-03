'use client';

import dynamicImport from 'next/dynamic';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProfileSidebar } from '@/components/ProfileSidebar';
import { TokenBalance } from '@/components/TokenBalance';
import { useProfile } from '@/hooks/useProfile';
import { useFavorites } from '@/hooks/useFavorites';
import { isAddress } from 'viem';
import { Avatar } from '@/components/Avatar';
import { placeholderDApps } from '@/lib/dapps';
import { DAppGrid } from '@/components/DAppGrid';
import { Activity } from '@/components/Activity';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { formatKaspaAddress } from '@/lib/kaspa/wallet';
import { getDAppsByDeployer, canEditDApp, getAssignedDApps } from '@/lib/dapps/management';
import { useMyAssignedDApps } from '@/hooks/useDAppAuthorization';
import { generateDAppSlug } from '@/lib/utils';
import Link from 'next/link';

export function UserProfileContent() {
  const params = useParams();
  const router = useRouter();
  const { address: connectedAddress, isConnected } = useAccount();
  const { state: kaspaState } = useKaspaWallet();
  const walletAddress = params?.['wallet-address'] as string | undefined;
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'dapps' | 'assigned' | 'favorites' | 'settings'>('overview');
  const { getFavoritesForWallet } = useFavorites();
  
  // Get assigned dApps (only if viewing own profile)
  const isOwnProfileForHooks = isConnected && connectedAddress?.toLowerCase() === walletAddress?.toLowerCase();
  const { dAppIds: assignedDAppIds, isLoading: isLoadingAssigned } = useMyAssignedDApps();

  // Validate wallet address
  const isValidAddress = walletAddress && isAddress(walletAddress);

  const { profile, emoji, isLoading: profileLoading, updateProfile } = useProfile(
    isValidAddress ? walletAddress : undefined
  );

  // Check if viewing own profile
  const isOwnProfile = Boolean(
    isConnected && (
      (connectedAddress?.toLowerCase() === walletAddress?.toLowerCase()) ||
      (kaspaState.address && kaspaState.address.toLowerCase() === walletAddress?.toLowerCase())
    )
  );

  // Get favorites for this wallet (convert IDs to DApp objects)
  const favoriteIds = walletAddress ? getFavoritesForWallet(walletAddress) : [];
  const favorites = favoriteIds
    .map(id => placeholderDApps.find(dapp => dapp.id === id))
    .filter((dapp): dapp is typeof placeholderDApps[0] => dapp !== undefined);

  // Get dApps deployed by this wallet
  const deployedDApps = walletAddress 
    ? getDAppsByDeployer(placeholderDApps, walletAddress)
    : [];

  // Get assigned dApps (only if viewing own profile)
  const assignedDApps = isOwnProfileForHooks && assignedDAppIds
    ? getAssignedDApps(placeholderDApps, assignedDAppIds)
    : [];

  // Copy address to clipboard
  const handleCopyAddress = async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  // Redirect if invalid address
  useEffect(() => {
    if (walletAddress && !isValidAddress && !kaspaState.address) {
      router.replace('/');
    }
  }, [walletAddress, isValidAddress, kaspaState.address, router]);

  if (!walletAddress) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-zinc-600 dark:text-zinc-400">Invalid wallet address</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Determine display address (EVM or Kaspa)
  const displayAddress = isValidAddress 
    ? walletAddress 
    : (kaspaState.address && kaspaState.address.toLowerCase() === walletAddress.toLowerCase())
      ? kaspaState.address
      : walletAddress;

  const displayAddressFormatted = isValidAddress
    ? `${displayAddress.slice(0, 6)}...${displayAddress.slice(-4)}`
    : formatKaspaAddress(displayAddress).display;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        <div className="flex flex-col lg:flex-row">
          {/* Sidebar */}
          <ProfileSidebar
            walletAddress={displayAddress}
            profile={profile}
            emoji={emoji}
            isOwnProfile={isOwnProfile}
            onProfileUpdate={updateProfile}
          />

          {/* Main Content */}
          <div className="flex-1 min-w-0 p-4 sm:p-6 lg:px-16 lg:py-12">
            <div className="max-w-7xl mx-auto">
              {/* Profile Header */}
              <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar address={displayAddress.replace(/^(evm:|kaspa:)/, '')} size={64} />
                  <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                      {profile?.displayName || displayAddressFormatted}
                    </h1>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-mono text-zinc-600 dark:text-zinc-400">
                        {displayAddress}
                      </p>
                      <button
                        onClick={handleCopyAddress}
                        className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                        aria-label="Copy address"
                      >
                        {copied ? (
                          <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-4 border-b border-zinc-200 dark:border-zinc-800">
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
                    dApps ({deployedDApps.length})
                  </button>
                  {isOwnProfile && (
                    <button
                      onClick={() => setActiveTab('assigned')}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'assigned'
                          ? 'text-zinc-900 dark:text-zinc-100 border-b-2 border-zinc-900 dark:border-zinc-100'
                          : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                      }`}
                    >
                      Assigned ({assignedDApps.length})
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab('favorites')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === 'favorites'
                        ? 'text-zinc-900 dark:text-zinc-100 border-b-2 border-zinc-900 dark:border-zinc-100'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                  >
                    Favorites ({favorites.length})
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
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                      Token Balances
                    </h2>
                    {isValidAddress ? (
                      <TokenBalance address={displayAddress as `0x${string}`} />
                    ) : (
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        Token balance display is only available for EVM addresses
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'activity' && (
                <div>
                  <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                    Activity
                  </h2>
                  <Activity walletAddress={displayAddress} />
                </div>
              )}

              {activeTab === 'dapps' && (
                <div>
                  <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                    Deployed dApps
                  </h2>
                  {deployedDApps.length > 0 ? (
                    <DAppGrid dapps={deployedDApps} />
                  ) : (
                    <p className="text-zinc-600 dark:text-zinc-400">
                      This wallet hasn&apos;t deployed any dApps yet.
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'assigned' && isOwnProfile && (
                <div>
                  <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                    Assigned dApps
                  </h2>
                  {isLoadingAssigned ? (
                    <p className="text-zinc-600 dark:text-zinc-400">Loading assigned dApps...</p>
                  ) : assignedDApps.length > 0 ? (
                    <DAppGrid dapps={assignedDApps} />
                  ) : (
                    <p className="text-zinc-600 dark:text-zinc-400">
                      You don&apos;t have any assigned dApps.
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'favorites' && (
                <div>
                  <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                    Favorite dApps
                  </h2>
                  {favorites.length > 0 ? (
                    <DAppGrid dapps={favorites} />
                  ) : (
                    <p className="text-zinc-600 dark:text-zinc-400">
                      This wallet hasn&apos;t favorited any dApps yet.
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'settings' && isOwnProfile && (
                <div>
                  <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                    Profile Settings
                  </h2>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Profile settings are managed in the sidebar.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

