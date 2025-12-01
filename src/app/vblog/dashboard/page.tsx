'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AuthorDashboard } from '@/components/vblog/AuthorDashboard';
import { useKaspaWallet } from '@/lib/kaspa/context';
import Link from 'next/link';

export default function VBlogDashboardPage() {
  const { state } = useKaspaWallet();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        <div className="p-4 sm:p-6 lg:p-8 lg:pl-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Author Dashboard
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mb-8">
              Create and manage your vBlog articles. Connect your wallet to get started.
            </p>

            {!state.isConnected ? (
              <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-8 text-center">
                <svg className="w-16 h-16 text-zinc-400 dark:text-zinc-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  Connect Your Wallet
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                  Please connect your wallet to create and manage articles.
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-500">
                  Use the wallet button in the header to connect.
                </p>
              </div>
            ) : (
              <AuthorDashboard />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

