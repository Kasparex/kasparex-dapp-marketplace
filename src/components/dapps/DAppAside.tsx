'use client';

import { HubAsideRail } from '@/components/hub/HubAsideRail';
import { DAppsBenefitsPanel } from '@/components/dapps/DAppsBenefitsPanel';
import { DAppWidgetActionPanel } from '@/components/dapps/panels/DAppWidgetActionPanel';
import type { DApp } from '@/lib/dapps';

export function DAppAside({
  dapp,
  showCalculationPanel = false,
}: {
  dapp: DApp;
  contractAddress?: string;
  showCalculationPanel?: boolean;
}) {
  return (
    <aside id="kasparex-dapp-side-panel" className="h-full min-h-full w-full min-w-0 max-w-full">
      <HubAsideRail adSlotId="HALO_DAPPS_RIGHT" adId="ad-slot-dapp-detail-aside">
        <DAppsBenefitsPanel variant="panel" />
        {showCalculationPanel ? <DAppWidgetActionPanel dapp={dapp} /> : null}
      </HubAsideRail>
    </aside>
  );
}
