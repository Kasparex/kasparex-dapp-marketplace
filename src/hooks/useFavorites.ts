'use client';

import { useState, useEffect } from 'react';

const FAVORITES_KEY = 'kasparex-dapp-favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Load favorites from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(FAVORITES_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setFavorites(new Set(parsed));
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    }
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favorites)));
      } catch (error) {
        console.error('Error saving favorites:', error);
      }
    }
  }, [favorites]);

  const toggleFavorite = (dappId: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(dappId)) {
        newFavorites.delete(dappId);
      } else {
        newFavorites.add(dappId);
      }
      return newFavorites;
    });
  };

  const isFavorite = (dappId: string) => {
    return favorites.has(dappId);
  };

  return {
    favorites,
    toggleFavorite,
    isFavorite,
  };
}

