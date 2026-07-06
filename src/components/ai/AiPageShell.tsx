'use client';

import type { ReactNode } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AiSidebar, type AiSidebarProps } from './AiSidebar';
import { HubAccentScope } from '@/components/hub/HubAccentScope';
import { HUB_MAIN_COLUMN, HUB_MAIN_INNER, HUB_PAGE_BG } from '@/lib/hub/hubLayout';

export interface AiPageShellProps {
  children: ReactNode;
  sidebar: AiSidebarProps;
}

export function AiPageShell({ children, sidebar }: AiPageShellProps) {
  return (
    <div className={`flex flex-col min-h-screen ${HUB_PAGE_BG}`}>
      <Header />

      <div className="flex flex-1 min-h-0">
        <AiSidebar {...sidebar} />

        <HubAccentScope projectId="kasparex-ai" className={HUB_MAIN_COLUMN}>
          <div className={HUB_MAIN_INNER}>{children}</div>
        </HubAccentScope>
      </div>

      <Footer />
    </div>
  );
}
