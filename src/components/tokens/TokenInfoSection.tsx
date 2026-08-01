/**
 * Token Info Section
 * About copy + supply metadata (locked Hub metadata boxes).
 */

'use client';

import type { Token } from '@/lib/tokens/types';
import { KxRichTextContent } from '@/components/ui/KxRichTextContent';
import { GameOverviewTitleBlock } from '@/components/games/panels/GameOverviewSections';
import { HubMetadataStatGrid, type HubMetadataStat } from '@/components/hub/HubMetadataStatGrid';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import { KX_PROSE } from '@/lib/ui/kxTypography';

interface TokenInfoSectionProps {
  token: Token;
}

export function TokenInfoSection({ token }: TokenInfoSectionProps) {
  const stats: HubMetadataStat[] = [];
  if (token.totalSupply != null) {
    stats.push({
      label: 'Total supply',
      value: formatLargeNumber(token.totalSupply),
      hint: token.symbol,
      accent: true,
      copyable: false,
      tooltipTitle: 'Total supply',
      tooltipDescription: 'Total token units defined for this listing (minted or capped).',
    });
  }
  if (token.circulatingSupply != null) {
    stats.push({
      label: 'Circulating',
      value: formatLargeNumber(token.circulatingSupply),
      hint: token.symbol,
      accent: true,
      copyable: false,
      tooltipTitle: 'Circulating supply',
      tooltipDescription: 'Tokens currently in circulation according to listing metadata.',
    });
  }
  if (token.decimals !== undefined) {
    stats.push({
      label: 'Decimals',
      value: String(token.decimals),
      hint: 'On-chain precision',
      copyable: false,
      tooltipTitle: 'Decimals',
      tooltipDescription: 'Number of decimal places used by this token standard on its primary network.',
    });
  }

  return (
    <section id="info" className="scroll-mt-28 space-y-6">
      <GameOverviewTitleBlock
        kicker="Overview"
        title="About"
        subtitle={`Learn what ${token.symbol} is and how it fits the Kasparex Hub.`}
        as="h3"
        compact
      />

      <div className={`${KX_PROSE} px-1`}>
        <KxRichTextContent html={token.description} className="kx-prose" />
      </div>

      {stats.length > 0 ? <HubMetadataStatGrid stats={stats} /> : null}
    </section>
  );
}
