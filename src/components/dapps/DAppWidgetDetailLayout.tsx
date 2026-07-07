'use client';

import type { ReactNode } from 'react';
import type { DApp } from '@/lib/dapps';
import { DAppWidgetActionPanel } from '@/components/dapps/panels/DAppWidgetActionPanel';
import { KX_FORM_GRID, KX_STICKY_RAIL } from '@/lib/hub/shellTokens';

export function DAppWidgetDetailLayout({ dapp, children }: { dapp: DApp; children: ReactNode }) {
  return (
    <div className={KX_FORM_GRID}>
      <div className="min-w-0 flex flex-col gap-4">{children}</div>
      <div className={KX_STICKY_RAIL}>
        <DAppWidgetActionPanel dapp={dapp} />
      </div>
    </div>
  );
}
