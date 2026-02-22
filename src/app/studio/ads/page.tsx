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
      {/* Halo header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-100 via-[#02abb8]/10 to-zinc-100 dark:from-zinc-950 dark:via-[#02abb8]/10 dark:to-zinc-950 border border-zinc-200 dark:border-zinc-800 p-8 md:p-12 mb-8">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#02abb8]/10 blur-[100px] rounded-full -mr-48 -mt-48" />
        <div className="relative z-10">
          <span className="inline-flex gap-2 px-3 py-1.5 rounded-full bg-[#02abb8]/10 border border-[#02abb8]/25 text-[#02abb8] text-[10px] font-black uppercase tracking-[0.2em] mb-4">
            Kasparex Ads
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter mb-4">
            My Ads
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg max-w-xl mb-6">
            Manage your ad campaigns. Pay in KAS, choose a slot and duration, and your ad goes live across the platform.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/ads"
              className="px-6 py-2.5 bg-[#02abb8] hover:bg-[#029ca8] text-white rounded-xl font-bold text-sm transition-colors"
            >
              View pricing & slots
            </Link>
            <Link
              href="/ads/listing"
              className="px-6 py-2.5 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl font-bold text-sm transition-colors"
            >
              Active campaigns
            </Link>
          </div>
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
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 py-12 text-center">
            <p className="text-zinc-600 dark:text-zinc-400">You have no active ads yet.</p>
            <Link href="/ads" className="mt-2 inline-block text-[#02abb8] font-medium hover:underline">Get started</Link>
          </div>
        )}
      </section>
    </div>
  );
}
