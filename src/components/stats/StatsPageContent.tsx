'use client';

import { useChainId } from 'wagmi';
import { TreasuryBox } from '@/components/treasury/TreasuryBox';
import { StatsCard } from '@/components/stats/StatsCard';
import { STATS_PANEL } from '@/lib/stats/statsUi';
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
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">Overview</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Treasury and ecosystem metrics at a glance.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className={`${STATS_PANEL} p-5 flex items-center justify-center min-h-[100px]`}>
          <TreasuryBox compact />
        </div>
        <StatsCard
          title="Smart contracts"
          value={CONTRACT_KEYS.length}
          subtitle={`${contractsWithAddress} deployed on current network`}
          href="/stats/contracts"
        />
        <StatsCard
          title="Networks"
          value={SUPPORTED_CHAIN_IDS.length}
          subtitle="Supported chains"
        />
        <StatsCard
          title="dApps"
          value="Explore"
          subtitle="Discover ecosystem dApps"
          href="/dapps"
        />
        <StatsCard
          title="KREX Nodes"
          value="View nodes"
          subtitle="Node status and rewards"
          href="/nodes"
        />
      </div>

      <div className={`${STATS_PANEL} p-6 sm:p-8`}>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">Treasury details</h2>
        <TreasuryBox showPerDApp />
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
        More stats and real-time data will be added in a future update.
      </p>
    </section>
  );
}
