'use client';

import type { Token } from '@/lib/tokens/types';
import { TokenSidebar } from './TokenSidebar';
import { TokenDetail, type TokenContentTab } from './TokenDetail';
import { useState } from 'react';

interface TokenLandingPageProps {
  token: Token;
}

export function TokenLandingPage({ token }: TokenLandingPageProps) {
  const [contentTab, setContentTab] = useState<TokenContentTab>('overview');

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-zinc-50 dark:bg-zinc-950 lg:flex-row">
      <TokenSidebar token={token} />

      <main className="min-h-[calc(100vh-4rem)] flex-1 min-w-0 overflow-y-auto border-l border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:pl-6">
          <TokenDetail
            token={token}
            contentTab={contentTab}
            onContentTabChange={setContentTab}
          />
        </div>
      </main>
    </div>
  );
}
