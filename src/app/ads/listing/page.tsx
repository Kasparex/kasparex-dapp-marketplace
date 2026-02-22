'use client';

import { useMemo } from 'react';
import { getAllActiveAds } from '@/lib/ads/mockAds';
import { AdCard } from '@/components/ads/AdCard';

export default function AdsListingPage() {
  const activeAds = useMemo(() => getAllActiveAds(), []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-2">
          Active campaigns
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          {activeAds.length} campaign{activeAds.length !== 1 ? 's' : ''} currently running
        </p>
      </div>

      {activeAds.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeAds.map((ad) => (
            <AdCard key={ad.id} ad={ad} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <p className="text-zinc-600 dark:text-zinc-400">No active campaigns right now.</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">Be the first to advertise.</p>
        </div>
      )}
    </div>
  );
}
