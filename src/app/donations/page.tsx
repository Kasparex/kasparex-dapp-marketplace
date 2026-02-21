'use client';

import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useDonationCampaigns } from '@/hooks/useDonationCampaigns';
import { formatEther } from 'viem';

export default function DonationsListingPage() {
  const { campaigns, isLoading, error } = useDonationCampaigns();

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Kasparex vDonations</h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">
              Verifiable donation campaigns. Support creators with KAS or iKAS (L2 escrow).
            </p>
          </div>
          <Link
            href="/donations/studio"
            className="px-4 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
          >
            Studio
          </Link>
        </div>

        {error && (
          <div className="rounded-lg bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-4 mb-6">
            {error.message}
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 animate-pulse">
                <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4 mb-4" />
                <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-full mb-2" />
                <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && !error && campaigns.length === 0 && (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center text-zinc-500 dark:text-zinc-400">
            <p className="font-medium">No donation campaigns yet</p>
            <p className="text-sm mt-1">Create one from the studio after verifying your wallet.</p>
            <Link
              href="/donations/studio"
              className="inline-block mt-4 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Create campaign
            </Link>
          </div>
        )}

        {!isLoading && campaigns.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((c) => {
              const progress = c.targetWei > 0n ? Number((c.raisedWei * 10000n) / c.targetWei) / 100 : 0;
              const deadline = new Date(Number(c.deadline) * 1000);
              return (
                <Link
                  key={c.creatorAddress}
                  href={`/donations/${c.creatorAddress}`}
                  className="block rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors bg-white dark:bg-zinc-900"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 truncate max-w-[180px]">
                      {c.creatorAddress.slice(0, 6)}…{c.creatorAddress.slice(-4)}
                    </span>
                    {c.active && (
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                    {formatEther(c.raisedWei)} / {formatEther(c.targetWei)} iKAS
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden mb-2">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {c.donorCount.toString()} donors · Ends {deadline.toLocaleDateString()}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
