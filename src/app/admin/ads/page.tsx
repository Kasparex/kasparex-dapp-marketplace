'use client';

import { useMemo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAdmin } from '@/hooks/useAdmin';
import Link from 'next/link';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { getAllActiveAds } from '@/lib/ads/mockAds';
import { AdCard } from '@/components/ads/AdCard';

export default function AdminAdsPage() {
  const { isAdmin, isConnected } = useAdmin();
  const activeAds = useMemo(() => getAllActiveAds(), []);

  if (!isConnected || !isAdmin) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <h1 className="text-3xl font-black mb-4 text-zinc-900 dark:text-zinc-100">Ads Admin</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8">Admin access required to manage ad slots and campaigns.</p>
          <Link href="/admin" className="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold">Back to Admin</Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <main className="flex-1">
        <div className="flex flex-col lg:flex-row">
          <AdminSidebar />
          <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 lg:pl-6">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-100 mb-2">
                  Ads <span className="text-[#02abb8]">Admin</span>
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">View and manage ad campaigns. Emergency remove and overrides coming later.</p>
              </div>

              <section className="mb-8">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">Active campaigns (mock)</h2>
                {activeAds.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeAds.map((ad) => (
                      <AdCard key={ad.id} ad={ad} />
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-500 dark:text-zinc-400">No active campaigns.</p>
                )}
              </section>

              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Revenue view, emergency remove, and pause system will be available in a future update.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
