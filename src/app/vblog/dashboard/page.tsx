'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AuthorDashboard } from '@/components/vblog/AuthorDashboard';
import { useKaspaWallet } from '@/lib/kaspa/context';
import Link from 'next/link';

export default function VBlogDashboardPage() {
  const { state } = useKaspaWallet();

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-12">
            <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-100 mb-2 uppercase tracking-tight">
              Creator <span className="text-orange-500">Center</span>
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-bold text-sm uppercase tracking-widest">
              Manage your decentralized vBlog publications
            </p>
          </div>

          {!state.isConnected ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-12 text-center shadow-2xl shadow-orange-500/5">
              <div className="w-20 h-20 bg-orange-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <svg className="w-10 h-10 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-3">
                Wallet Not Connected
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-md mx-auto font-medium">
                Please connect your Kaspa or EVM wallet to access your personal dashboard and manage your syndicated articles.
              </p>
              <div className="inline-block px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:scale-105">
                Use Connect Button in Header
              </div>
            </div>
          ) : (
            <AuthorDashboard />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

