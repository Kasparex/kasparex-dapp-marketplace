/**
 * User Profile Dashboard Widget
 * Icon-based profile management
 */

'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { UserIcon } from '@/components/users/UserIcon';
import { PROFILE_REGISTRY_ABI } from '@/lib/contracts/abis';
import { generateUserIcon } from '@/lib/icons/generator';

export interface UserProfileDashboardProps {
  userProfileDashboardAddress?: string;
  profileRegistryAddress?: string;
  className?: string;
}

export function UserProfileDashboard({
  userProfileDashboardAddress,
  profileRegistryAddress,
  className = '',
}: UserProfileDashboardProps) {
  const { address, isConnected } = useAccount();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [iconColor, setIconColor] = useState('');
  // Edit functionality removed - profiles are now read-only

  // Edit functionality removed - profiles are now read-only

  // Get profile CID
  const { data: profileCID } = useReadContract({
    address: profileRegistryAddress as `0x${string}`,
    abi: PROFILE_REGISTRY_ABI,
    functionName: 'getProfileCID',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address && !!profileRegistryAddress,
    },
  }) as { data: string | undefined };

  // Get profile data
  const { data: profileData } = useReadContract({
    address: profileRegistryAddress as `0x${string}`,
    abi: PROFILE_REGISTRY_ABI,
    functionName: 'getProfile',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address && !!profileRegistryAddress,
    },
  }) as { data: [string, string] | undefined };

  // Edit functionality removed - profiles are now read-only

  // Load profile data
  useEffect(() => {
    if (profileData && Array.isArray(profileData)) {
      setDisplayName(profileData[1] || '');
      // Load IPFS metadata if CID exists
      if (profileData[0] && typeof profileData[0] === 'string') {
        // Fetch from IPFS would go here
      }
    }
  }, [profileData]);

  // Edit functionality removed - profiles are now read-only

  if (!isConnected || !address) {
    return (
      <div className={`p-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 ${className}`}>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Connect wallet to manage your profile
        </p>
      </div>
    );
  }

  const userIcon = generateUserIcon(address, { size: 64 });

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Your Profile
        </h2>
        {/* Edit functionality removed - profiles are now read-only */}
      </div>

      {/* Read-only profile display */}
      <div className="space-y-4">
          <div className="flex items-center gap-4">
            <UserIcon address={address} size={64} />
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {displayName || 'Unnamed User'}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 font-mono">
                {address.substring(0, 6)}...{address.substring(address.length - 4)}
              </p>
            </div>
          </div>

          {bio && (
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{bio}</p>
            </div>
          )}
        </div>
    </div>
  );
}

