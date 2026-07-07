'use client';

import type { ReactNode } from 'react';
import type { DApp } from '@/lib/dapps';
import type { DirectoryListing } from '@/lib/dapps/listingSubmissions';
import { DAppPageHeader } from '@/components/dapps/DAppPageHeader';
import { DAppsWithSidebarLayout } from '@/components/dapps/layout/DAppsWithSidebarLayout';
import { DAppAside } from '@/components/dapps/DAppAside';
import { DAppJsonLd } from '@/components/dapps/DAppJsonLd';
import type { DAppTab } from '@/components/dapps/layout/DAppTabs';

type Props<T extends string> = {
  dapp: DApp;
  contractAddress?: string;
  listing?: DirectoryListing;
  tabs: readonly DAppTab<T>[];
  currentTab: T;
  onTabChange: (id: T) => void;
  children: ReactNode;
};

export function DAppDetailShell<T extends string>({
  dapp,
  contractAddress = '',
  listing,
  tabs,
  currentTab,
  onTabChange,
  children,
}: Props<T>) {
  return (
    <>
      <DAppJsonLd dapp={dapp} listing={listing} />
      <DAppPageHeader dapp={dapp} contractAddress={contractAddress} listing={listing} />
      <DAppsWithSidebarLayout
        tabs={tabs}
        currentTab={currentTab}
        onTabChange={onTabChange}
        main={children}
        sidebar={<DAppAside dapp={dapp} contractAddress={contractAddress} />}
      />
    </>
  );
}
