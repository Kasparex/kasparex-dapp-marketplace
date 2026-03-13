'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { AD_SLOTS } from '@/lib/ads/slots';
import { getAllActiveAds } from '@/lib/ads/mockAds';
import { AdCard } from '@/components/ads/AdCard';

export default function StudioAdsPage() {
  const activeAds = useMemo(() => getAllActiveAds(), []);
  const mockMyAds = activeAds.slice(0, 3);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
          <div>
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 mb-2">
                  My Ads
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base max-w-2xl">
                  Manage your ad campaigns. Pay in KAS, choose a slot and duration, and your ad goes live across the platform.
              </p>
          </div>

          <div className="flex flex-wrap gap-3">
              <Link
                href="/ads?create=1"
                className="px-4 py-2 bg-[#02abb8] hover:bg-[#029ca8] text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-colors"
              >
                Create ad
              </Link>
              <Link
                href="/ads/overview"
                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors"
              >
                Pricing
              </Link>
          </div>
      </div>

      {/* Pricing reminder */}
      <section>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3">Pricing (per slot)</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
          From {AD_SLOTS[0]?.pricePerDay ?? 100} KAS/day or {AD_SLOTS[0]?.pricePer30Days ?? 1000} KAS for 30 days. See <Link href="/ads" className="text-[#02abb8] hover:underline">Kasparex Ads</Link> for full pricing.
        </p>
      </section>

      {/* My ads (mock) */}
      <section>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">Your active campaigns</h2>
        {mockMyAds.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockMyAds.map((ad) => (
              <AdCard
                key={ad.id}
                ad={ad}
                onEdit={() => window.open(`/ads?create=1`, '_self')}
                onDelete={() => {}}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 py-12 text-center">
            <p className="text-zinc-600 dark:text-zinc-400">You have no active ads yet.</p>
            <Link href="/ads?create=1" className="mt-2 inline-block text-[#02abb8] font-medium hover:underline">Create your first ad</Link>
          </div>
        )}
      </section>
    </div>
  );
}
