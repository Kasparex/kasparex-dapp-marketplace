'use client';

import type { ReactNode } from 'react';
import type { DApp } from '@/lib/dapps';
import { DAppWidgetActionPanel } from '@/components/dapps/panels/DAppWidgetActionPanel';
import { KX_WIDGET_DETAIL_STACK } from '@/lib/hub/shellTokens';

export function DAppWidgetDetailLayout({ dapp, children }: { dapp: DApp; children: ReactNode }) {
  return (
    <div className={KX_WIDGET_DETAIL_STACK}>
      <div className="min-w-0">{children}</div>
      <DAppWidgetActionPanel dapp={dapp} />
    </div>
  );
}
