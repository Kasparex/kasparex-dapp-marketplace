'use client';

import { useState, useEffect, useCallback } from 'react';

export interface ProfileData {
  displayName: string;
  bio: string;
  hideBalance: boolean;
  preventScreenshots: boolean;
}

const DEFAULT_PROFILE: ProfileData = {
  displayName: '',
  bio: '',
  hideBalance: false,
  preventScreenshots: false,
};

/**
 * Generate a deterministic emoji based on wallet address
 * Uses a simple hash function to map address to emoji
 */
function generateEmojiFromAddress(address: string): string {
  // List of diverse emojis
  const emojis = [
    '🎭', '🎨', '🎪', '🎯', '🎲', '🎮', '🎸', '🎺', '🎻', '🎤',
    '🎧', '🎬', '🎥', '🎞️', '🎟️', '🎫', '🎟️', '🎖️', '🏆', '🏅',
    '🥇', '🥈', '🥉', '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉',
    '🎱', '🏓', '🏸', '🥊', '🥋', '🥅', '⛳', '🏹', '🎣', '🥌',
    '🎽', '🛹', '🛴', '🛵', '🏍️', '🚲', '🚗', '🚕', '🚙', '🚌',
    '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🚝',
    '🚞', '🚟', '🚠', '🚡', '🚢', '⛵', '🚤', '🛥️', '🛳️', '⛴️',
    '🚁', '🛩️', '✈️', '🛫', '🛬', '🚀', '🛸', '🚇', '🚊', '🚉',
  ];

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    const char = address.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Use absolute value and modulo to get index
  const index = Math.abs(hash) % emojis.length;
  return emojis[index];
}

export function useProfile(walletAddress: string | undefined) {
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState(true);

  // Generate emoji from wallet address
  const emoji = walletAddress ? generateEmojiFromAddress(walletAddress) : '👤';

  // Load profile from localStorage
  useEffect(() => {
    if (!walletAddress) {
      setIsLoading(false);
      return;
    }

    try {
      const stored = localStorage.getItem(`profile_${walletAddress.toLowerCase()}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setProfile({ ...DEFAULT_PROFILE, ...parsed });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  // Save profile to localStorage
  const updateProfile = useCallback((updates: Partial<ProfileData>) => {
    if (!walletAddress) return;

    const newProfile = { ...profile, ...updates };
    setProfile(newProfile);

    try {
      localStorage.setItem(
        `profile_${walletAddress.toLowerCase()}`,
        JSON.stringify(newProfile)
      );
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  }, [walletAddress, profile]);

  return {
    profile,
    emoji,
    isLoading,
    updateProfile,
  };
}

