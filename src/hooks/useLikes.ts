'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

const LIKES_KEY = 'kasparex-dapp-likes';

interface LikesData {
  [dappId: string]: {
    count: number;
    wallets: string[]; // Array of wallet addresses that liked this dApp
  };
}

/**
 * Hook to manage likes for dApps
 * Each wallet can only like a dApp once
 */
export function useLikes() {
  const { address } = useAccount();
  const [likes, setLikes] = useState<LikesData>({});
  const [mounted, setMounted] = useState(false);

  // Load likes from localStorage on mount
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(LIKES_KEY);
        if (stored) {
          setLikes(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Error loading likes:', error);
      }
    }
  }, []);

  // Save likes to localStorage whenever they change
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      try {
        localStorage.setItem(LIKES_KEY, JSON.stringify(likes));
      } catch (error) {
        console.error('Error saving likes:', error);
      }
    }
  }, [likes, mounted]);

  const toggleLike = (dappId: string) => {
    if (!address) {
      // User needs to connect wallet to like
      return;
    }

    setLikes((prev) => {
      const newLikes = { ...prev };
      
      if (!newLikes[dappId]) {
        newLikes[dappId] = { count: 0, wallets: [] };
      }

      const walletIndex = newLikes[dappId].wallets.indexOf(address);
      
      if (walletIndex >= 0) {
        // Unlike: remove wallet and decrease count
        newLikes[dappId].wallets.splice(walletIndex, 1);
        newLikes[dappId].count = Math.max(0, newLikes[dappId].count - 1);
      } else {
        // Like: add wallet and increase count
        newLikes[dappId].wallets.push(address);
        newLikes[dappId].count = (newLikes[dappId].count || 0) + 1;
      }

      return newLikes;
    });
  };

  const getLikeCount = (dappId: string): number => {
    return likes[dappId]?.count || 0;
  };

  const hasLiked = (dappId: string): boolean => {
    if (!address) return false;
    return likes[dappId]?.wallets.includes(address) || false;
  };

  return {
    likes,
    toggleLike,
    getLikeCount,
    hasLiked,
    isWalletConnected: !!address,
  };
}

