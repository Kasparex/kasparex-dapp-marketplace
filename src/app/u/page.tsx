'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useKaspaWallet } from '@/lib/kaspa/context';

export default function ProfileHubResolverPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state } = useKaspaWallet();

  useEffect(() => {
    if (!state.isConnected || !state.address) return;
    const params = new URLSearchParams(searchParams?.toString() || '');
    const query = params.toString();
    router.replace(`/u/${encodeURIComponent(state.address)}${query ? `?${query}` : ''}`);
  }, [router, searchParams, state.address, state.isConnected]);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-xl w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 text-center">
          <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-100">Profile Hub</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Connect your Kaspa wallet to open your creator workspace.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
