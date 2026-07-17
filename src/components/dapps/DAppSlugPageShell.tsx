'use client';

import type { ReactNode } from 'react';
import type { DApp } from '@/lib/dapps';
import { DAppSidebar } from '@/components/DAppSidebar';
import { DAppDetail } from '@/components/DAppDetail';
import { DAppFooter } from '@/components/dapps/DAppFooter';
import { RelatedDApps } from '@/components/dapps/RelatedDApps';
import { DAppDetailNavProvider } from '@/lib/dapps/DAppDetailNavContext';

export function DAppSlugPageShell({
  dapp,
  contractAddress,
}: {
  dapp: DApp;
  contractAddress?: string;
}) {
  return (
    <DAppDetailNavProvider dappSlug={dapp.slug || dapp.id}>
      <div className="flex-1 flex flex-col lg:flex-row">
        <DAppSidebar dapp={dapp} />
        <div className="flex-1 min-w-0 p-4 sm:p-6 lg:px-16 lg:py-12">
          <DAppDetail dapp={dapp} contractAddress={contractAddress} />
          <DAppFooter contractAddress={contractAddress} />
        </div>
      </div>
      <div className="px-4 sm:px-6 lg:px-8 lg:pl-6 pb-4 sm:pb-6 lg:pb-8">
        <RelatedDApps currentDApp={dapp} />
      </div>
    </DAppDetailNavProvider>
  );
}

export function DirectoryDAppSlugPageShell({
  dapp,
  children,
}: {
  dapp: DApp;
  children: ReactNode;
}) {
  return (
    <DAppDetailNavProvider dappSlug={dapp.slug || dapp.id} initialTab="overview">
      {children}
    </DAppDetailNavProvider>
  );
}
