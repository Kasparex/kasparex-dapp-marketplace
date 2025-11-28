'use client';

import { useEffect, useState } from 'react';
import { DApp } from '@/lib/dapps';
import { DAppCard } from './DAppCard';

interface DAppGridProps {
  dapps: DApp[];
  // Favorites and likes are handled internally by DAppCard using hooks
}

export function DAppGrid({ dapps }: DAppGridProps) {
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);

  // Check sidebar state from localStorage
  useEffect(() => {
    const checkSidebarState = () => {
      const savedHidden = localStorage.getItem('sidebar-hidden');
      setIsSidebarHidden(savedHidden === 'true');
    };
    
    checkSidebarState();
    // Listen for storage changes (when sidebar is toggled)
    window.addEventListener('storage', checkSidebarState);
    // Also check periodically in case localStorage is updated in same window
    const interval = setInterval(checkSidebarState, 100);
    
    return () => {
      window.removeEventListener('storage', checkSidebarState);
      clearInterval(interval);
    };
  }, []);

  if (dapps.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500 dark:text-zinc-400">
          No dApps found in this category.
        </p>
      </div>
    );
  }

  // Show 3 columns when sidebar is hidden on large screens, otherwise 2
  const gridCols = isSidebarHidden 
    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2';

  return (
    <div className={`grid ${gridCols} gap-4 items-stretch`}>
      {dapps.map((dapp) => (
        <DAppCard 
          key={dapp.id} 
          dapp={dapp}
        />
      ))}
    </div>
  );
}

