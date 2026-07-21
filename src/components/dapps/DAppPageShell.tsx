'use client';

import type { ReactNode } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DAppDashboardSidebar, type DAppDashboardSidebarProps } from './DAppDashboardSidebar';
import { HubAccentScope } from '@/components/hub/HubAccentScope';

type DAppPageShellProps = {
  children: ReactNode;
  sidebar: DAppDashboardSidebarProps;
};

export function DAppPageShell({ children, sidebar }: DAppPageShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-zinc-950">
      <Header />

      <HubAccentScope projectId="kasparex-dapps" className="flex min-h-0 flex-1">
        <DAppDashboardSidebar {...sidebar} />

        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto border-l border-zinc-200 p-4 sm:p-6 lg:p-8 lg:pl-6 dark:border-zinc-800">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </HubAccentScope>

      <Footer />
    </div>
  );
}
