'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Token } from '@/lib/tokens/types';
import { HubAsideRail } from '@/components/hub/HubAsideRail';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { TokensBenefitsPanel } from '@/components/tokens/TokensBenefitsPanel';
import { TokenCopyableAddress } from '@/components/tokens/TokenCopyableAddress';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import {
  getNetworkChipLabel,
  getNetworkExplorerUrl,
  getTokenNetworkEntries,
} from '@/lib/tokens/networks';

const PANEL_CLASS =
  'rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900';

export function TokenAside({ token }: { token: Token }) {
  const price = token.price?.current;
  const marketCap = token.price?.marketCap;
  const otherLinks = (token.links ?? []).filter((l) => l.type === 'explorer' || l.type === 'other');
  const networkEntries = getTokenNetworkEntries(token).filter((e) => e.contractAddress);

  const sections: { title: string; hint?: string; body: ReactNode; rawBody?: boolean }[] = [];

  if (price !== undefined) {
    sections.push({
      title: 'Market snapshot',
      body: (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-zinc-500">Price</span>
            <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
              ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
            </span>
          </div>
          {marketCap !== undefined ? (
            <div className="flex justify-between gap-3">
              <span className="text-zinc-500">Market cap</span>
              <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                ${formatLargeNumber(marketCap)}
              </span>
            </div>
          ) : null}
        </div>
      ),
    });
  }

  if (networkEntries.length > 0) {
    sections.push({
      title: 'Contracts',
      body: (
        <ul className="space-y-3">
          {networkEntries.map((entry) => {
            const explorerUrl = getNetworkExplorerUrl(entry.network, entry.contractAddress);
            return (
              <li key={`${entry.network}-${entry.contractAddress}`}>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {getNetworkChipLabel(entry.network)}
                </p>
                <TokenCopyableAddress
                  value={entry.contractAddress!}
                  copyLabel={`Copy ${getNetworkChipLabel(entry.network)} address`}
                  explorerUrl={explorerUrl}
                  truncate
                />
              </li>
            );
          })}
        </ul>
      ),
    });
  }

  if (otherLinks.length > 0) {
    sections.push({
      title: 'Links',
      body: (
        <ul className="space-y-2.5">
          {otherLinks.map((link) => (
            <li key={link.url}>
              <Link
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base font-semibold text-zinc-800 transition-colors hover:text-[color:var(--hub-accent)] dark:text-zinc-200"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      ),
    });
  }

  return (
    <aside id="kasparex-token-side-panel" className="h-full min-h-full w-full min-w-0 max-w-full">
      <HubAsideRail adSlotId="HALO_TOKENS_RIGHT" adId="ad-slot-token-detail-aside">
        <TokensBenefitsPanel variant="panel" />

        {sections.map((sec) => (
          <div key={sec.title} className={PANEL_CLASS}>
            <DAppSectionHeader title={sec.title} hint={sec.hint} />
            {sec.body}
          </div>
        ))}
      </HubAsideRail>
    </aside>
  );
}
