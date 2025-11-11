/**
 * User Profile Dashboard Widget
 * Icon-based profile management
 */

'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { UserIcon } from '@/components/users/UserIcon';
import { useIPFSUpload } from '@/lib/ipfs/hooks';
import { USER_PROFILE_DASHBOARD_ABI, PROFILE_REGISTRY_ABI } from '@/lib/contracts/abis';
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
  const [isEditing, setIsEditing] = useState(false);

  const { uploadJSON, isUploading } = useIPFSUpload();

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

  const { writeContract, data: updateHash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: updateHash,
  });

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

  const handleSave = async () => {
    if (!address || !userProfileDashboardAddress) return;

    try {
      // Upload profile metadata to IPFS
      const metadata = {
        displayName,
        bio,
        iconColor,
        updatedAt: new Date().toISOString(),
      };

      const cid = await uploadJSON(metadata, { pin: true });
      if (!cid) {
        throw new Error('Failed to upload to IPFS');
      }

      // Update profile on-chain
      await writeContract({
        address: userProfileDashboardAddress as `0x${string}`,
        abi: USER_PROFILE_DASHBOARD_ABI,
        functionName: 'updateProfile',
        args: [cid],
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  };

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
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-[#02abb8] hover:bg-[#0199a3] text-white text-sm rounded-lg transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <UserIcon address={address} size={64} />
            <div className="flex-1">
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
                placeholder="Your name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
              rows={4}
              placeholder="Tell us about yourself..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
              Icon Color (Hex)
            </label>
            <input
              type="text"
              value={iconColor}
              onChange={(e) => setIconColor(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 font-mono text-sm"
              placeholder="#02abb8"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={isUploading || isPending || isConfirming}
              className="flex-1 px-4 py-2 bg-[#02abb8] hover:bg-[#0199a3] text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isUploading || isPending || isConfirming ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
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
      )}
    </div>
  );
}

