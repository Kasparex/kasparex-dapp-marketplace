'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CreateTokenForm } from '@/components/tokens/CreateTokenForm';
import { TokenAuthorPricing } from '@/components/tokens/TokenAuthorPricing';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';

function TokenArchivePlaceholder() {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 p-10 text-center">
      <DAppSectionHeader title="Your token listings" className="mb-3 justify-center" />
      <p className="kx-body-sm max-w-md mx-auto mb-6">
        Published token pages will appear here. Claim and verify flows arrive in the next release.
      </p>
      <Link href="/tokens" className="k-cta-secondary text-sm">
        Browse ecosystem tokens
      </Link>
    </div>
  );
}

export function TokenDeveloperDashboard() {
  const [activeTab, setActiveTab] = useState<'create' | 'archive'>('create');

  return (
    <div className="space-y-8">
      <div id="tokens-dashboard-create" className="scroll-mt-24" />

      <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl w-fit border border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setActiveTab('create')}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'create'
              ? 'bg-white dark:bg-zinc-800 text-[#02abb8] dark:text-[#66dfe8] shadow-lg shadow-black/5 border border-zinc-200 dark:border-zinc-700'
              : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          Create listing
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('archive')}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'archive'
              ? 'bg-white dark:bg-zinc-800 text-[#02abb8] dark:text-[#66dfe8] shadow-lg shadow-black/5 border border-zinc-200 dark:border-zinc-700'
              : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          My tokens (0)
        </button>
      </div>

      {activeTab === 'create' ? (
        <div id="tokens-dashboard-pricing" className="scroll-mt-24">
          <TokenAuthorPricing />
        </div>
      ) : null}

      <div className="min-h-[400px]">
        {activeTab === 'create' ? (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <CreateTokenForm />
          </div>
        ) : (
          <div id="tokens-dashboard-archive" className="scroll-mt-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <TokenArchivePlaceholder />
          </div>
        )}
      </div>
    </div>
  );
}
