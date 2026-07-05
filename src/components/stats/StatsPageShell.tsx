'use client';

import type { ReactNode } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StatsSidebar } from '@/components/stats/StatsSidebar';
import { HUB_MAIN_COLUMN, HUB_MAIN_INNER, HUB_PAGE_BG } from '@/lib/hub/hubLayout';

export function StatsPageShell({ children }: { children: ReactNode }) {
  return (
    <div className={`flex flex-col min-h-screen ${HUB_PAGE_BG}`}>
      <Header />

      <div className="flex flex-1 min-h-0">
        <StatsSidebar />

        <main className={HUB_MAIN_COLUMN}>
          <div className={HUB_MAIN_INNER}>{children}</div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
