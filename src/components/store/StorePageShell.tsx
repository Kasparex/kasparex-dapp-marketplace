'use client';

import type { ReactNode } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StoreSidebar, type StoreSidebarProps } from '@/components/store/StoreSidebar';
import { HUB_MAIN_COLUMN, HUB_MAIN_INNER, HUB_PAGE_BG } from '@/lib/hub/hubLayout';

type StorePageShellProps = {
  children: ReactNode;
  sidebar: Omit<StoreSidebarProps, never>;
};

export function StorePageShell({ children, sidebar }: StorePageShellProps) {
  return (
    <div className={`flex flex-col min-h-screen ${HUB_PAGE_BG}`}>
      <Header />

      <div className="flex flex-1 min-h-0">
        <StoreSidebar {...sidebar} />

        <main className={HUB_MAIN_COLUMN}>
          <div className={HUB_MAIN_INNER}>{children}</div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
