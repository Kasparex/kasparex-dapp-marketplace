'use client';

import { useState, useEffect, useCallback } from 'react';
import { CommentCredits } from '@/lib/vblog/types';

const STORAGE_KEY = 'vblog_comment_credits';
const DEFAULT_CREDITS = 10; // Default credits for testing

/**
 * Hook for managing comment credits per wallet address
 */
export function useCommentCredits(walletAddress: string | null) {
  const [credits, setCredits] = useState<CommentCredits | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load credits from storage
  useEffect(() => {
    if (!walletAddress) {
      setCredits(null);
      setIsLoading(false);
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const allCredits: CommentCredits[] = JSON.parse(stored);
        const userCredits = allCredits.find(
          c => c.walletAddress.toLowerCase() === walletAddress.toLowerCase()
        );

        if (userCredits) {
          setCredits(userCredits);
        } else {
          // Initialize with default credits
          const newCredits: CommentCredits = {
            walletAddress,
            creditsRemaining: DEFAULT_CREDITS,
            totalPurchased: DEFAULT_CREDITS,
          };
          setCredits(newCredits);
          saveCredits([...allCredits, newCredits]);
        }
      } else {
        // First time user - initialize with default credits
        const newCredits: CommentCredits = {
          walletAddress,
          creditsRemaining: DEFAULT_CREDITS,
          totalPurchased: DEFAULT_CREDITS,
        };
        setCredits(newCredits);
        saveCredits([newCredits]);
      }
    } catch (error) {
      console.error('Error loading comment credits:', error);
      // Initialize with default credits on error
      const newCredits: CommentCredits = {
        walletAddress,
        creditsRemaining: DEFAULT_CREDITS,
        totalPurchased: DEFAULT_CREDITS,
      };
      setCredits(newCredits);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  /**
   * Use a credit (decrease remaining credits)
   */
  const useCredit = useCallback((): boolean => {
    if (!credits || credits.creditsRemaining <= 0) {
      return false;
    }

    const updatedCredits: CommentCredits = {
      ...credits,
      creditsRemaining: credits.creditsRemaining - 1,
    };

    setCredits(updatedCredits);
    updateCreditsInStorage(updatedCredits);
    return true;
  }, [credits]);

  /**
   * Purchase credits (mocked for now)
   * TODO: Replace with actual smart contract call
   */
  const purchaseCredits = useCallback(async (amount: number, kasAmount: number): Promise<boolean> => {
    if (!walletAddress) return false;

    // Mock purchase - in real implementation, this would call a smart contract
    // TODO: Replace with actual smart contract call
    const updatedCredits: CommentCredits = {
      walletAddress,
      creditsRemaining: (credits?.creditsRemaining || 0) + amount,
      totalPurchased: (credits?.totalPurchased || 0) + amount,
      lastPurchaseDate: new Date().toISOString(),
    };

    setCredits(updatedCredits);
    updateCreditsInStorage(updatedCredits);
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  }, [walletAddress, credits]);

  /**
   * Get current credits count
   */
  const getCredits = useCallback((): number => {
    return credits?.creditsRemaining || 0;
  }, [credits]);

  /**
   * Check if user has credits available
   */
  const hasCredits = useCallback((): boolean => {
    return (credits?.creditsRemaining || 0) > 0;
  }, [credits]);

  /**
   * Refresh credits from storage
   */
  const refreshCredits = useCallback(() => {
    if (!walletAddress) return;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const allCredits: CommentCredits[] = JSON.parse(stored);
        const userCredits = allCredits.find(
          c => c.walletAddress.toLowerCase() === walletAddress.toLowerCase()
        );
        if (userCredits) {
          setCredits(userCredits);
        }
      }
    } catch (error) {
      console.error('Error refreshing comment credits:', error);
    }
  }, [walletAddress]);

  return {
    credits,
    isLoading,
    useCredit,
    purchaseCredits,
    getCredits,
    hasCredits,
    refreshCredits,
  };
}

/**
 * Save credits to storage
 */
function saveCredits(allCredits: CommentCredits[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allCredits));
  } catch (error) {
    console.error('Error saving comment credits:', error);
  }
}

/**
 * Update credits in storage
 */
function updateCreditsInStorage(updatedCredits: CommentCredits): void {
  if (typeof window === 'undefined') return;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const allCredits: CommentCredits[] = stored ? JSON.parse(stored) : [];
    const index = allCredits.findIndex(
      c => c.walletAddress.toLowerCase() === updatedCredits.walletAddress.toLowerCase()
    );

    if (index >= 0) {
      allCredits[index] = updatedCredits;
    } else {
      allCredits.push(updatedCredits);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(allCredits));
  } catch (error) {
    console.error('Error updating comment credits:', error);
  }
}

