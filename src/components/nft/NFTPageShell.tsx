'use client';

import type { ReactNode } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { NFTSidebar, type NFTSidebarProps } from '@/components/nft/NFTSidebar';
import { HubAccentScope } from '@/components/hub/HubAccentScope';
import { HUB_MAIN_COLUMN, HUB_MAIN_INNER, HUB_PAGE_BG } from '@/lib/hub/hubLayout';

type NFTPageShellProps = {
  children: ReactNode;
  sidebar: NFTSidebarProps;
};

export function NFTPageShell({ children, sidebar }: NFTPageShellProps) {
  return (
    <div className={`flex flex-col min-h-screen ${HUB_PAGE_BG}`}>
      <Header />

      <div className="flex flex-1 min-h-0">
        <NFTSidebar {...sidebar} />

        <HubAccentScope projectId="kasparex-nft-tools" className={HUB_MAIN_COLUMN}>
          <div className={HUB_MAIN_INNER}>{children}</div>
        </HubAccentScope>
      </div>

      <Footer />
    </div>
  );
}
