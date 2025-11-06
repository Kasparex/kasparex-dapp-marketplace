'use client';

import { Suspense } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { DAppWidget } from '@/components/DAppWidget';
import { placeholderDApps } from '@/lib/dapps';
import { getDAppBySlug } from '@/lib/utils';

function EmbedContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = (params?.slug as string) || '';
  const hideHeader = searchParams.get('hideHeader') === 'true';
  
  const dapp = getDAppBySlug(placeholderDApps, slug);

  if (!dapp) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-zinc-900">
        <p className="text-zinc-600 dark:text-zinc-400">dApp not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900">
      {!hideHeader && (
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{dapp.name}</h1>
        </div>
      )}
      <div className={hideHeader ? '' : 'p-4'}>
        <DAppWidget dapp={dapp} />
      </div>
    </div>
  );
}

export default function EmbedPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-zinc-900">
        <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
      </div>
    }>
      <EmbedContent />
    </Suspense>
  );
}
