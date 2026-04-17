'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CreateAdWizard } from '@/components/ads/CreateAdWizard';

export default function AdsEditorNewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(true);

  const returnTo = searchParams?.get('returnTo') || '';

  useEffect(() => {
    if (!open) {
      if (returnTo) {
        router.push(returnTo);
      } else {
        router.push('/ads');
      }
    }
  }, [open, returnTo, router]);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <main className="flex-1 min-h-[calc(100vh-4rem)]">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-10">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Ads editor opens as a wizard. Closing it returns you to Creator Hub.
            </div>
          </div>
        </div>
        <CreateAdWizard isOpen={open} onClose={() => setOpen(false)} />
      </main>
      <Footer />
    </div>
  );
}

