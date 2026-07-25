'use client';

import { useChainId } from 'wagmi';
import { TreasuryBox } from '@/components/treasury/TreasuryBox';
import { StatsCard } from '@/components/stats/StatsCard';
import { STATS_PANEL } from '@/lib/stats/statsUi';
import { HubListingTitleRow } from '@/components/hub/HubListingTitleRow';
import { HubBenefitsPanel } from '@/components/hub/HubBenefitsPanel';
import { GameSectionHeader } from '@/components/games/layout/GameSectionHeader';
import {
  CONTRACT_KEYS,
  getContractsWithAddress,
} from '@/lib/contracts/contractsMetadata';

const SUPPORTED_CHAIN_IDS = [202555, 167012, 38836, 38833];

export function StatsPageContent() {
  const chainId = useChainId();
  const contractsWithAddress =
    typeof chainId === 'number' && chainId > 0
      ? getContractsWithAddress(chainId).length
      : CONTRACT_KEYS.length;

  return (
    <section className="space-y-8">
      <HubListingTitleRow
        projectId="kasparex-stats"
        title="Available metrics"
        count={5}
        countLabel="overview panel"
        benefits={<HubBenefitsPanel variant="compact" scope="stats" className="w-full" />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className={`${STATS_PANEL} flex min-h-[100px] items-center justify-center p-4`}>
          <TreasuryBox compact />
        </div>
        <StatsCard
          title="Smart contracts"
          value={CONTRACT_KEYS.length}
          subtitle={`${contractsWithAddress} deployed on current network`}
          href="/stats/contracts"
        />
        <StatsCard title="Networks" value={SUPPORTED_CHAIN_IDS.length} subtitle="Supported chains" />
        <StatsCard title="dApps" value="Explore" subtitle="Discover ecosystem dApps" href="/dapps" />
        <StatsCard title="KREX Nodes" value="View nodes" subtitle="Node status and rewards" href="/nodes" />
      </div>

      <div>
        <GameSectionHeader title="Treasury details" />
        <div className={`${STATS_PANEL} p-4 sm:p-5`}>
          <TreasuryBox showPerDApp />
        </div>
      </div>

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        More stats and real-time data will be added in a future update.
      </p>
    </section>
  );
}
