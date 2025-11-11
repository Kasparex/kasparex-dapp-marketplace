'use client';

import dynamicImport from 'next/dynamic';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAdmin } from '@/hooks/useAdmin';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

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
          
          {/* AdminDashboard temporarily disabled - will rebuild as smart contract-based dApp */}
          <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Admin Dashboard is being rebuilt as a smart contract-based dApp. Coming soon!
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

