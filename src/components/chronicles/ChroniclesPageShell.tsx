'use client';

import type { ReactNode } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import {
  ChroniclesDashboardSidebar,
  type ChroniclesDashboardSidebarProps,
} from '@/components/chronicles/ChroniclesDashboardSidebar';
import { HUB_MAIN_COLUMN, HUB_MAIN_INNER, HUB_PAGE_BG } from '@/lib/hub/hubLayout';

type ChroniclesPageShellProps = {
  children: ReactNode;
  sidebar: ChroniclesDashboardSidebarProps;
};

export function ChroniclesPageShell({ children, sidebar }: ChroniclesPageShellProps) {
  return (
    <div className={`flex flex-col min-h-screen overflow-x-hidden ${HUB_PAGE_BG}`}>
      <Header />

      <div className="flex flex-1 min-h-0 overflow-x-hidden">
        <ChroniclesDashboardSidebar {...sidebar} />

        <main className={HUB_MAIN_COLUMN}>
          <div className={`${HUB_MAIN_INNER} min-w-0 w-full`}>{children}</div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
