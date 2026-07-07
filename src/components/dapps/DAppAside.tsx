'use client';

import { PanelAdSlider } from '@/components/ads/PanelAdSlider';
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
    <aside id="kasparex-dapp-side-panel" className="w-full min-w-0 max-w-full space-y-4 lg:sticky lg:top-6 self-start">
      <DAppsBenefitsPanel variant="panel" />
      {showCalculationPanel ? <DAppWidgetActionPanel dapp={dapp} /> : null}
      <PanelAdSlider slotId="HALO_DAPPS_RIGHT" id="ad-slot-dapp-detail-aside" />
    </aside>
  );
}
