'use client';

import type { Token } from '@/lib/tokens/types';
import { HubMetadataStatGrid, type HubMetadataStat } from '@/components/hub/HubMetadataStatGrid';
import { GameOverviewTitleBlock } from '@/components/games/panels/GameOverviewSections';
import { getNetworkChipLabel } from '@/lib/tokens/networks';
import { resolveTokenCreatorWallet } from '@/lib/tokens/creatorWallet';
import { isProgrammableToken, resolveProgrammableCovenantId } from '@/lib/programmable/eligibility';

export function buildTokenOnChainStats(token: Token): HubMetadataStat[] {
  const creatorWallet = resolveTokenCreatorWallet(token);
  const covenantId = resolveProgrammableCovenantId(token);
  const onChainStats: HubMetadataStat[] = [];

  if (token.id) {
    onChainStats.push({ label: 'Token ID', value: token.id, copyable: true, dense: true });
  }
  if (token.slug) {
    onChainStats.push({ label: 'Slug', value: token.slug, copyable: true, dense: true });
  }
  if (token.symbol) {
    onChainStats.push({
      label: 'Ticker',
      value: token.symbol,
      copyable: true,
      accent: true,
    });
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
      tooltipTitle: 'Decimals',
      tooltipDescription:
        'Number of decimal places used by this token standard on its primary network.',
    });
  }

  return onChainStats;
}

/** On-chain metadata for Token Overview (moved out of the right rail). */
export function TokenOnChainMetadataPanel({ token }: { token: Token }) {
  const stats = buildTokenOnChainStats(token);
  if (stats.length === 0) return null;

  return (
    <section className="space-y-4">
      <GameOverviewTitleBlock
        as="h3"
        compact
        kicker="On-chain"
        title="On-chain metadata"
        subtitle="Listing identifiers, deployer, and network anchors."
      />
      <HubMetadataStatGrid smartPack stats={stats} />
    </section>
  );
}
