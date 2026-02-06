'use client';

import dynamicImport from 'next/dynamic';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAdmin } from '@/hooks/useAdmin';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

// Dynamically import AdminDashboard with no SSR to prevent build-time evaluation
const AdminDashboard = dynamicImport(
  () => import('@/components/admin/AdminDashboard').then(mod => ({ default: mod.AdminDashboard })),
  { ssr: false }
);

// Force dynamic rendering to avoid SSR issues with wagmi hooks
export const dynamic = 'force-dynamic';

export default function AdminPage() {
  const { isAdmin, isConnected } = useAdmin();
  const { address } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (isConnected && !isAdmin) {
      // Redirect non-admins away
      router.push('/');
    }
  }, [isAdmin, isConnected, router]);

  if (!isConnected) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Admin Access Required
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Please connect your wallet to access the admin dashboard.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Access Denied
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              You do not have admin privileges. Connected wallet: {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Manage developer assignments, fees, and revenue settings.
            </p>
          </div>

          {/* Admin Tools Navigation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Link href="/admin/magazines" className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 2v4a2 2 0 002 2h4" />
                  </svg>
                </div>
                <div className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">Magazines Center</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Manage publications, revenue splits, and platform treasury settings.</p>
            </Link>

            <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 opacity-60">
              <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-zinc-400 mb-1">Ecosystem Tools</h3>
              <p className="text-sm text-zinc-500">More management modules coming soon.</p>
            </div>
          </div>

          {/* Legacy section notice */}
          <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              The legacy Admin Dashboard is being rebuilt as a decentralized dApp. Use specific centers above for active modules.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

