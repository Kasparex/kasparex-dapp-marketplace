'use client';

import type { ReactNode } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DAppDashboardSidebar, type DAppDashboardSidebarProps } from './DAppDashboardSidebar';

type DAppPageShellProps = {
  children: ReactNode;
  sidebar: DAppDashboardSidebarProps;
};

export function DAppPageShell({ children, sidebar }: DAppPageShellProps) {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950">
      <Header />

      <div className="flex flex-1 min-h-0">
        <DAppDashboardSidebar {...sidebar} />

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 lg:pl-6 overflow-y-auto overflow-x-hidden border-l border-zinc-200 dark:border-zinc-800">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
