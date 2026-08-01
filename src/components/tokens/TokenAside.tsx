'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Token } from '@/lib/tokens/types';
import { HubAsideRail } from '@/components/hub/HubAsideRail';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { TokensBenefitsPanel } from '@/components/tokens/TokensBenefitsPanel';
import { TokenCopyableAddress } from '@/components/tokens/TokenCopyableAddress';
import { HubMetadataStatGrid, type HubMetadataStat } from '@/components/hub/HubMetadataStatGrid';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import {
  getNetworkChipLabel,
  getNetworkExplorerUrl,
  getTokenNetworkEntries,
} from '@/lib/tokens/networks';
import { resolveTokenCreatorWallet } from '@/lib/tokens/creatorWallet';
import { isProgrammableToken, resolveProgrammableCovenantId } from '@/lib/programmable/eligibility';
import { KX_METADATA_STAT_GRID_STACK } from '@/lib/hub/shellTokens';

const PANEL_CLASS =
  'rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900';

export function TokenAside({ token }: { token: Token }) {
  const price = token.price?.current;
  const marketCap = token.price?.marketCap;
  const otherLinks = (token.links ?? []).filter((l) => l.type === 'explorer' || l.type === 'other');
  const networkEntries = getTokenNetworkEntries(token).filter((e) => e.contractAddress);
  const creatorWallet = resolveTokenCreatorWallet(token);
  const covenantId = resolveProgrammableCovenantId(token);

  const onChainStats: HubMetadataStat[] = [];
  if (token.id) {
    onChainStats.push({ label: 'Token ID', value: token.id, copyable: true });
  }
  if (token.slug) {
    onChainStats.push({ label: 'Slug', value: token.slug, copyable: true });
  }
  if (token.symbol) {
    onChainStats.push({ label: 'Ticker', value: token.symbol, copyable: true, accent: true });
  }
  if (token.listingNetwork) {
    onChainStats.push({
      label: 'Listing network',
      value: getNetworkChipLabel(token.listingNetwork),
      copyable: false,
    });
  }
  if (creatorWallet) {
    onChainStats.push({
      label: 'Creator / deployer',
      value: creatorWallet,
      dense: true,
      accent: true,
      copyable: true,
    });
  }
  if (token.metadataCid) {
    onChainStats.push({
      label: 'Metadata CID',
      value: token.metadataCid,
      dense: true,
      accent: true,
      copyable: true,
    });
  }
  if (isProgrammableToken(token) && covenantId) {
    onChainStats.push({
      label: 'Covenant ID',
      value: covenantId,
      dense: true,
      accent: true,
      copyable: true,
    });
  }
  if (token.onChainSnapshot?.genesisTxid) {
    onChainStats.push({
      label: 'Genesis tx',
      value: token.onChainSnapshot.genesisTxid,
      dense: true,
      accent: true,
      copyable: true,
    });
  }
  if (token.decimals !== undefined) {
    onChainStats.push({
      label: 'Decimals',
      value: String(token.decimals),
      copyable: false,
    });
  }

  const sections: { title: string; hint?: string; body: ReactNode; rawBody?: boolean }[] = [];

  if (onChainStats.length > 0) {
    sections.push({
      title: 'On-chain metadata',
      rawBody: true,
      body: <HubMetadataStatGrid gridClassName={KX_METADATA_STAT_GRID_STACK} stats={onChainStats} />,
    });
  }

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
            <DAppSectionHeader title={sec.title} hint={sec.hint} className="mb-3" />
            {sec.body}
          </div>
        ))}
      </HubAsideRail>
    </aside>
  );
}
