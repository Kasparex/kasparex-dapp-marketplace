'use client';

import { useState, useEffect } from 'react';
import type { ProfileData } from '@/hooks/useProfile';

interface ProfileEditProps {
  profile: ProfileData;
  onSave: (updates: Partial<ProfileData>) => void;
  onCancel: () => void;
}

export function ProfileEdit({ profile, onSave, onCancel }: ProfileEditProps) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio);

  useEffect(() => {
    setDisplayName(profile.displayName);
    setBio(profile.bio);
  }, [profile]);

  const handleSave = () => {
    onSave({
      displayName: displayName.trim(),
      bio: bio.trim(),
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Display Name
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Enter display name"
          className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          maxLength={50}
        />
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
          className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 resize-none"
          maxLength={500}
        />
        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 text-right">
          {bio.length}/500
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSave}
          className="flex-1 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

