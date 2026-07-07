'use client';

import { Suspense } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { DAppWidget } from '@/components/DAppWidget';
import { placeholderDApps } from '@/lib/dapps';
import { getDAppBySlug } from '@/lib/utils';

function EmbedContentInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = (params?.slug as string) || '';
  const hideHeader = searchParams.get('hideHeader') === 'true';
  const hideFooter = searchParams.get('hideFooter') === 'true';
  const hideIcons = searchParams.get('hideIcons') === 'true';
  const hideStar = searchParams.get('hideStar') === 'true';
  const hideHeart = searchParams.get('hideHeart') === 'true';
  const hideInfo = searchParams.get('hideInfo') === 'true';
  const hideEmbed = searchParams.get('hideEmbed') === 'true';
  const accentColor = searchParams.get('accentColor') || '#02abb8';
  
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
        <DAppWidget 
          dapp={dapp}
          variant="embed"
          hideHeader={hideHeader}
          hideFooter={hideFooter}
          hideIcons={hideIcons}
          hideStar={hideStar}
          hideHeart={hideHeart}
          hideInfo={hideInfo}
          hideEmbed={hideEmbed}
          accentColor={accentColor}
        />
      </div>
    </div>
  );
}

export function EmbedContent() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-zinc-900">
        <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
      </div>
    }>
      <EmbedContentInner />
    </Suspense>
  );
}

