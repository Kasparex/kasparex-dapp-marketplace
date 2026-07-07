'use client';

import { PanelAdSlider } from '@/components/ads/PanelAdSlider';
import { DAppsBenefitsPanel } from '@/components/dapps/DAppsBenefitsPanel';
import { DAppBalancesPanel } from '@/components/dapps/panels/DAppBalancesPanel';
import type { DApp } from '@/lib/dapps';

export function DAppAside({ dapp }: { dapp: DApp; contractAddress?: string }) {
  return (
    <aside id="kasparex-dapp-side-panel" className="w-full min-w-0 max-w-full space-y-4 lg:sticky lg:top-6 self-start">
      <DAppsBenefitsPanel variant="panel" />
      <DAppBalancesPanel dapp={dapp} />
      <PanelAdSlider slotId="HALO_DAPPS_RIGHT" id="ad-slot-dapp-detail-aside" />
    </aside>
  );
}
