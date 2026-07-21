'use client';

import type { ReactNode } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import {
  ChroniclesDashboardSidebar,
  type ChroniclesDashboardSidebarProps,
} from '@/components/chronicles/ChroniclesDashboardSidebar';
import { HUB_MAIN_COLUMN, HUB_MAIN_INNER, HUB_PAGE_BG } from '@/lib/hub/hubLayout';
import { HubAccentScope } from '@/components/hub/HubAccentScope';

type ChroniclesPageShellProps = {
  children: ReactNode;
  sidebar: ChroniclesDashboardSidebarProps;
};

export function ChroniclesPageShell({ children, sidebar }: ChroniclesPageShellProps) {
  return (
    <div className={`flex min-h-screen flex-col overflow-x-hidden ${HUB_PAGE_BG}`}>
      <Header />

      <HubAccentScope projectId="krex-chronicles" className="flex min-h-0 flex-1 overflow-x-hidden">
        <ChroniclesDashboardSidebar {...sidebar} />

        <main className={HUB_MAIN_COLUMN}>
          <div className={`${HUB_MAIN_INNER} w-full min-w-0`}>{children}</div>
        </main>
      </HubAccentScope>

      <Footer />
    </div>
  );
}
