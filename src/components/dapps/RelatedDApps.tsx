'use client';

import { useMemo } from 'react';
import { DApp } from '@/lib/dapps';
import { placeholderDApps } from '@/lib/dapps';
import { DAppCard } from '@/components/DAppCard';

interface RelatedDAppsProps {
  currentDApp: DApp;
}

export function RelatedDApps({ currentDApp }: RelatedDAppsProps) {
  const relatedDApps = useMemo(() => {
    // Filter out the current dApp
    const otherDApps = placeholderDApps.filter(dapp => dapp.id !== currentDApp.id);
    
    // Get dApps from the same category
    const sameCategoryDApps = otherDApps.filter(
      dapp => dapp.category === currentDApp.category
    );
    
    // Shuffle function for random selection
    const shuffle = <T,>(array: T[]): T[] => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };
    
    // If we have 3+ dApps in the same category, pick 3 random ones
    if (sameCategoryDApps.length >= 3) {
      return shuffle(sameCategoryDApps).slice(0, 3);
    }
    
    // If we have some in the same category but less than 3, use them and fill with random
    const result = [...shuffle(sameCategoryDApps)];
    const remaining = otherDApps.filter(
      dapp => !sameCategoryDApps.some(same => same.id === dapp.id)
    );
    const shuffledRemaining = shuffle(remaining);
    const needed = 3 - result.length;
    result.push(...shuffledRemaining.slice(0, needed));
    
    return result;
  }, [currentDApp.id, currentDApp.category]);

  // Don't render if there are no related dApps
  if (relatedDApps.length === 0) {
    return null;
  }

  return (
    <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
        Related dApps
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
        {relatedDApps.map((dapp) => (
          <DAppCard key={dapp.id} dapp={dapp} />
        ))}
      </div>
    </div>
  );
}

