/**
 * Token Info Section
 * About copy + supply metadata (protocol boxes live below via TokenProtocolAvailability).
 */

'use client';

import type { Token } from '@/lib/tokens/types';
import { KxRichTextContent } from '@/components/ui/KxRichTextContent';
import { GameOverviewTitleBlock } from '@/components/games/panels/GameOverviewSections';
import { TokenStatCard } from '@/components/tokens/TokenStatCard';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import { KX_PROSE } from '@/lib/ui/kxTypography';

interface TokenInfoSectionProps {
  token: Token;
}

export function TokenInfoSection({ token }: TokenInfoSectionProps) {
  const hasSupplyMeta =
    token.totalSupply != null || token.circulatingSupply != null || token.decimals !== undefined;

  return (
    <section id="info" className="scroll-mt-28 space-y-6">
      <GameOverviewTitleBlock
        kicker="Overview"
        title="About"
        subtitle={`Learn what ${token.symbol} is and how it fits the Kasparex Hub.`}
        as="h2"
      />

      <div className={`${KX_PROSE} px-1`}>
        <KxRichTextContent html={token.description} className="kx-prose" />
      </div>

      {hasSupplyMeta ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {token.totalSupply != null ? (
            <TokenStatCard
              label="Total supply"
              value={`${formatLargeNumber(token.totalSupply)}`}
              hint={token.symbol}
              tooltipTitle="Total supply"
              tooltipDescription="Total token units defined for this listing (minted or capped)."
              valueClassName="text-[color:var(--hub-accent)]"
            />
          ) : null}
          {token.circulatingSupply != null ? (
            <TokenStatCard
              label="Circulating"
              value={`${formatLargeNumber(token.circulatingSupply)}`}
              hint={token.symbol}
              tooltipTitle="Circulating supply"
              tooltipDescription="Tokens currently in circulation according to listing metadata."
              valueClassName="text-[color:var(--hub-accent)]"
            />
          ) : null}
          {token.decimals !== undefined ? (
            <TokenStatCard
              label="Decimals"
              value={token.decimals}
              hint="On-chain precision"
              tooltipTitle="Decimals"
              tooltipDescription="Number of decimal places used by this token standard on its primary network."
            />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
