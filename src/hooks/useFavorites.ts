'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';

const FAVORITES_KEY = 'kasparex-dapp-favorites';

interface FavoritesData {
  [walletAddress: string]: string[]; // Array of dApp IDs
}

/**
 * Hook to manage favorites for dApps
 * Each wallet has its own list of favorite dApps
 */
export function useFavorites() {
  const { address, isConnected } = useAccount();
  const [favorites, setFavorites] = useState<FavoritesData>({});
  const [mounted, setMounted] = useState(false);

  // Load favorites from localStorage on mount
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(FAVORITES_KEY);
        if (stored) {
          setFavorites(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    }
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      } catch (error) {
        console.error('Error saving favorites:', error);
      }
    }
  }, [favorites, mounted]);

  const toggleFavorite = (dappId: string) => {
    if (!address || !isConnected) {
      // User needs to connect wallet to favorite
      return;
    }

    setFavorites((prev) => {
      const newFavorites = { ...prev };
      
      if (!newFavorites[address]) {
        newFavorites[address] = [];
      }

      const dappIndex = newFavorites[address].indexOf(dappId);
      
      if (dappIndex >= 0) {
        // Unfavorite: remove dApp from list
        newFavorites[address].splice(dappIndex, 1);
      } else {
        // Favorite: add dApp to list
        newFavorites[address].push(dappId);
      }

      return newFavorites;
    });
  };

  const isFavorite = (dappId: string): boolean => {
    if (!address || !isConnected) {
      return false;
    }
    return favorites[address]?.includes(dappId) || false;
  };

  const getFavoritesForWallet = (walletAddress: string): string[] => {
    return favorites[walletAddress] || [];
  };

  const getCurrentWalletFavorites = (): string[] => {
    if (!address || !isConnected) {
      return [];
    }
    return favorites[address] || [];
  };

  // Memoize favorites array and set to ensure proper reactivity
  const currentFavorites = useMemo(() => getCurrentWalletFavorites(), [favorites, address, isConnected]);
  const favoritesSet = useMemo(() => new Set(currentFavorites), [currentFavorites]);

  return {
    favorites: currentFavorites,
    favoritesSet,
    toggleFavorite,
    isFavorite,
    getFavoritesForWallet,
    isWalletConnected: isConnected,
  };
}
