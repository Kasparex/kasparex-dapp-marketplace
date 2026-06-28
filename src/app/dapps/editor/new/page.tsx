'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BuildDAppWizard } from '@/components/dapps/BuildDAppWizard';
import type { DApp } from '@/lib/dapps';

type Mode = 'build' | 'list';

function DAppsEditorNewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeParam = (searchParams?.get('mode') || '').toLowerCase();
  const returnTo = searchParams?.get('returnTo') || '';

  const initialMode: Mode | null = modeParam === 'build' ? 'build' : modeParam === 'list' ? 'list' : null;
  const [mode, setMode] = useState<Mode | null>(initialMode);
  const [busy, setBusy] = useState(false);

  const title = useMemo(() => {
    if (!mode) return 'New dApp';
    return mode === 'build' ? 'Build a dApp' : 'List an existing dApp';
  }, [mode]);

  const goBack = () => {
    if (returnTo) {
      router.push(returnTo);
      return;
    }
    router.push('/dapps');
  };

  const handleComplete = async (dapp: Partial<DApp>) => {
    setBusy(true);
    try {
      const key = `dapp_${dapp.id}_metadata`;
      localStorage.setItem(key, JSON.stringify(dapp));
      goBack();
    } catch (e) {
      console.error(e);
      alert('Failed to save dApp. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = () => {
    if (!mode) {
      goBack();
      return;
    }
    if (confirm('Are you sure you want to cancel? Your progress will be lost.')) {
      setMode(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <main className="flex-1 min-h-[calc(100vh-4rem)]">
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#02abb8] mb-2">Kasparex dApps</p>
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{title}</h1>
            </div>
            <button type="button" onClick={goBack} className="k-control-btn whitespace-nowrap">
              Back
            </button>
          </div>

          {!mode ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setMode('build')}
                className="kx-listing-card block w-full overflow-hidden rounded-xl border border-zinc-200 bg-white p-5 text-left transition-colors dark:border-zinc-800 dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <div className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">Build a dApp</div>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Create a new listing from scratch with a guided wizard (includes contract step).
                </p>
              </button>
              <button
                type="button"
                onClick={() => setMode('list')}
                className="kx-listing-card block w-full overflow-hidden rounded-xl border border-zinc-200 bg-white p-5 text-left transition-colors dark:border-zinc-800 dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <div className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">List an existing dApp</div>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Add a listing for a dApp you already have. (Uses the same wizard; you can link an existing contract.)
                </p>
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
              {busy ? (
                <div className="py-8 text-center kx-body">Saving listing…</div>
              ) : (
                <BuildDAppWizard onComplete={handleComplete} onCancel={handleCancel} />
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function DAppsEditorNewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
          <Header />
          <main className="flex flex-1 items-center justify-center p-8">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading editor…</p>
          </main>
          <Footer />
        </div>
      }
    >
      <DAppsEditorNewPageContent />
    </Suspense>
  );
}

