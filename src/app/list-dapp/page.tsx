'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { BuildDAppWizard } from '@/components/dapps/BuildDAppWizard';
import type { DApp } from '@/lib/dapps';

export default function ListDAppPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async (dapp: Partial<DApp>) => {
    setIsSubmitting(true);
    try {
      const key = `dapp_${dapp.id}_metadata`;
      localStorage.setItem(key, JSON.stringify(dapp));
      router.push('/dapps');
    } catch (error) {
      console.error('Error saving dApp:', error);
      alert('Failed to save dApp. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? Your progress will be lost.')) {
      router.push('/u?tab=dapps');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="flex-1 flex flex-col lg:flex-row">
        <div className="hidden lg:block flex-shrink-0">
          <UnifiedSidebar
            storageKeyPrefix="list-dapp"
            header={(onHide) => <SidebarHeader backHref="/dapps" backLabel="Back to dApps" onHide={onHide} />}
          >
            <div className="mb-8">
              <div className="space-y-2">
                <Link href="/list-dapp" className="k-control-btn w-full">
                  List dApp
                </Link>
                <Link href="/tree/dashboard" className="k-control-btn w-full">
                  Revenue Tree
                </Link>
                <Link href="/dapp-modules" className="k-control-btn w-full">
                  Modules
                </Link>
              </div>
            </div>
          </UnifiedSidebar>
        </div>

        <div className="lg:hidden flex-shrink-0">
          <UnifiedSidebar
            storageKeyPrefix="list-dapp"
            header={(onHide) => <SidebarHeader backHref="/dapps" backLabel="Back to dApps" onHide={onHide} />}
          >
            <div className="mb-8">
              <div className="space-y-2">
                <Link href="/list-dapp" className="k-control-btn w-full">
                  List dApp
                </Link>
                <Link href="/tree/dashboard" className="k-control-btn w-full">
                  Revenue Tree
                </Link>
                <Link href="/dapp-modules" className="k-control-btn w-full">
                  Modules
                </Link>
              </div>
            </div>
          </UnifiedSidebar>
        </div>

        <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-12 overflow-y-auto border-l border-zinc-200 dark:border-zinc-800">
          <div className="max-w-5xl mx-auto space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100">List dApp</h1>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Use the same creator flow as build mode to publish your dApp listing.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
              {isSubmitting ? (
                <div className="text-center py-8 text-sm text-zinc-600 dark:text-zinc-400">Saving listing…</div>
              ) : (
                <BuildDAppWizard onComplete={handleComplete} onCancel={handleCancel} />
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
