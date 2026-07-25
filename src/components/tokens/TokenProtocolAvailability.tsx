'use client';

import type { Token } from '@/lib/tokens/types';
import type { TokenListingNetwork } from '@/lib/tokens/listingNetwork';
import {
  getNetworkChipLabel,
  getNetworkExplorerUrl,
  getTokenNetworkEntries,
} from '@/lib/tokens/networks';
import { TokenStatCard } from '@/components/tokens/TokenStatCard';
import { TokenCopyableAddress } from '@/components/tokens/TokenCopyableAddress';
import {
  GameOverviewTitleBlock,
} from '@/components/games/panels/GameOverviewSections';

type ProtocolDef = {
  id: string;
  label: string;
  short: string;
  networks: TokenListingNetwork[];
  tooltip: string;
};

/** Supported listing protocols shown as availability cards on Overview. */
const PROTOCOLS: ProtocolDef[] = [
  {
    id: 'krc20',
    label: 'KRC-20',
    short: 'L1 fungible',
    networks: ['krc20', 'kaspa_l1'],
    tooltip: 'Kaspa L1 KRC-20 ticker / mainnet fungible token.',
  },
  {
    id: 'kcc20',
    label: 'KCC-20',
    short: 'L1 covenants',
    networks: ['kcc20'],
    tooltip: 'Programmable L1 covenant asset (KCC-20) on Kaspa.',
  },
  {
    id: 'l2_kasplex',
    label: 'L2 Kasplex',
    short: 'EVM L2',
    networks: ['l2_kasplex'],
    tooltip: 'ERC-20 style deployment on Kasplex (Kaspa L2 / EVM).',
  },
  {
    id: 'l2_igra',
    label: 'L2 Igra',
    short: 'EVM L2',
    networks: ['l2_igra'],
    tooltip: 'ERC-20 style deployment on Igra Labs (Kaspa L2 / EVM).',
  },
];

export function TokenProtocolAvailability({ token }: { token: Token }) {
  const entries = getTokenNetworkEntries(token);

  return (
    <section id="token-protocols" className="scroll-mt-28 space-y-4">
      <GameOverviewTitleBlock
        kicker="Networks"
        title="Protocol availability"
        subtitle="Where this token is listed on Kasparex. Open an address to view it on the matching explorer."
        as="h3"
        compact
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {PROTOCOLS.map((protocol) => {
          const match = entries.find((e) => protocol.networks.includes(e.network));
          const available = Boolean(match);
          const statusHint = !available
            ? 'Not listed on this network'
            : match?.verified
              ? match.primary
                ? 'Primary · verified'
                : 'Verified'
              : match?.primary
                ? 'Primary'
                : 'Linked';

          return (
            <TokenStatCard
              key={protocol.id}
              label={protocol.label}
              tooltipTitle={protocol.label}
              tooltipDescription={protocol.tooltip}
              value={available ? 'Available' : 'N/A'}
              valueClassName={
                available
                  ? 'text-[color:var(--hub-accent)]'
                  : 'text-zinc-400 dark:text-zinc-500'
              }
              hint={available ? `${protocol.short} · ${statusHint}` : statusHint}
            />
          );
        })}
      </div>

      {entries.some((e) => e.contractAddress) ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {entries
            .filter((e) => e.contractAddress)
            .map((entry) => {
              const explorerUrl = getNetworkExplorerUrl(entry.network, entry.contractAddress);
              return (
                <div
                  key={`${entry.network}-${entry.contractAddress}`}
                  className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      {getNetworkChipLabel(entry.network)}
                    </span>
                    <span
                      className={`rounded-lg px-2 py-0.5 text-xs font-medium ${
                        entry.verified
                          ? 'bg-[color:var(--hub-accent-muted)] text-[color:var(--hub-accent)]'
                          : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      {entry.primary ? (entry.verified ? 'Primary · verified' : 'Primary') : entry.verified ? 'Verified' : 'Linked'}
                    </span>
                  </div>
                  <TokenCopyableAddress
                    value={entry.contractAddress!}
                    copyLabel={`Copy ${getNetworkChipLabel(entry.network)} address`}
                    explorerUrl={explorerUrl}
                  />
                </div>
              );
            })}
        </div>
      ) : null}
    </section>
  );
}
