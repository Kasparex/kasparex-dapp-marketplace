'use client';

import { useMemo, useRef, useState } from 'react';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { KREXBuyWizard } from '@/components/rewards/KREXBuyWizard';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { computeEarnedHubPoints, formatHubPointsTierLabel } from '@/lib/rewards/hub-points';
import { KREX_TIERS } from '@/lib/rewards/types';
import { balanceToKrexVisualTier, KREX_TIER_UI } from '@/lib/rewards/tierUi';
import { krexTierDiscountPercent } from '@/lib/chronicles/vault/pricing';
import { Tooltip } from '@/components/ui/Tooltip';
import { KrexTierPerksTooltipTable } from '@/components/rewards/KrexTierPerksTooltipTable';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';

function formatKrexMillions(balance: number): string {
  if (balance >= 1_000_000) {
    return `${(balance / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 })}M`;
  }
  return balance.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

const TIER_TOOLTIP = <KrexTierPerksTooltipTable title="KREX tier perks" />;

/** Project scope for Benefits copy (fees / earn lines must match the surface). */
export type HubBenefitsScope =
  | 'hub'
  | 'vblog'
  | 'games'
  | 'gamesListing'
  | 'magazines'
  | 'chronicles'
  | 'dapps'
  | 'ads'
  | 'donations'
  | 'protocols'
  | 'nft'
  | 'defi'
  | 'ai'
  | 'rewards'
  | 'stats'
  | 'store'
  | 'tokens';

type ScopeCopy = {
  panelTitle: string;
  headline: string;
  feeNoun: string;
  earnVerb: string;
  earnBase: number;
  compactFeeNoun: string;
  extraBullets?: string[];
  /** Drop "at your tier (Nx multiplier)" suffix on the earn bullet. */
  earnLineShort?: boolean;
};

const SCOPE_COPY: Record<HubBenefitsScope, ScopeCopy> = {
  hub: {
    panelTitle: 'Creator perks',
    headline: 'Hold KREX. Pay less. Earn more.',
    feeNoun: 'Hub fees',
    earnVerb: 'Actions earn',
    earnBase: HUB_EARN_POINTS.vblogArticleCreate,
    compactFeeNoun: 'Hub fees',
  },
  vblog: {
    panelTitle: 'Creator perks',
    headline: 'Hold KREX. Pay Less. Earn More.',
    feeNoun: 'vBlog fees',
    earnVerb: 'Publish earns',
    earnBase: HUB_EARN_POINTS.vblogArticleCreate,
    compactFeeNoun: 'vBlog fees',
  },
  games: {
    panelTitle: 'Benefits',
    headline: 'Hold KREX. Pay less in Games.',
    feeNoun: 'Games fees',
    earnVerb: 'Earn',
    earnBase: HUB_EARN_POINTS.gamesPromoList,
    compactFeeNoun: 'Games fees',
    earnLineShort: true,
    extraBullets: ['Deck balances scale with your KREX tier'],
  },
  gamesListing: {
    panelTitle: 'Benefits',
    headline: 'Hold KREX. Pay less on Games listings.',
    feeNoun: 'Games listing fees',
    earnVerb: 'Listing earns',
    earnBase: HUB_EARN_POINTS.gamesPromoList,
    compactFeeNoun: 'Games listing fees',
    earnLineShort: true,
    extraBullets: ['Featured modules get your KREX tier discount'],
  },
  magazines: {
    panelTitle: 'Benefits',
    headline: 'Hold KREX. Publish Magazines for less.',
    feeNoun: 'Magazine issue fees',
    earnVerb: 'Publishing earns',
    earnBase: HUB_EARN_POINTS.magazineIssuePublish,
    compactFeeNoun: 'Magazine fees',
  },
  chronicles: {
    panelTitle: 'Benefits',
    headline: 'Hold KREX. Submit Chronicles lore for less.',
    feeNoun: 'Chronicles submission fees',
    earnVerb: 'Submission earns',
    earnBase: HUB_EARN_POINTS.chroniclesArticleCreate,
    compactFeeNoun: 'Chronicles fees',
  },
  dapps: {
    panelTitle: 'Benefits',
    headline: 'Hold KREX. List dApps for less.',
    feeNoun: 'dApp directory listing fees',
    earnVerb: 'Listing earns',
    earnBase: HUB_EARN_POINTS.dappDirectoryList,
    compactFeeNoun: 'dApp listing fees',
  },
  ads: {
    panelTitle: 'Benefits',
    headline: 'Hold KREX. Place ads for less.',
    feeNoun: 'Hub ad placement fees',
    earnVerb: 'Placement earns',
    earnBase: HUB_EARN_POINTS.hubAdPlacement,
    compactFeeNoun: 'Ad fees',
  },
  donations: {
    panelTitle: 'Benefits',
    headline: 'Hold KREX. Unlock modules. Earn more.',
    feeNoun: 'CrowdKAS module fees',
    earnVerb: 'Campaign create earns',
    earnBase: HUB_EARN_POINTS.crowdkasCampaignCreate,
    compactFeeNoun: 'CrowdKAS fees',
  },
  protocols: {
    panelTitle: 'Benefits',
    headline: 'Hold KREX. Pay less across Protocols.',
    feeNoun: 'Protocol Hub fees',
    earnVerb: 'Actions earn',
    earnBase: HUB_EARN_POINTS.dappL1Interaction,
    compactFeeNoun: 'Protocol fees',
  },
  nft: {
    panelTitle: 'Benefits',
    headline: 'Hold KREX. Unlock NFT tool perks.',
    feeNoun: 'NFT Tools fees',
    earnVerb: 'Actions earn',
    earnBase: HUB_EARN_POINTS.dappL1Interaction,
    compactFeeNoun: 'NFT Tools fees',
  },
  defi: {
    panelTitle: 'Benefits',
    headline: 'Hold KREX. Save on DeFi Hub actions.',
    feeNoun: 'DeFi Hub fees',
    earnVerb: 'Actions earn',
    earnBase: HUB_EARN_POINTS.dappL1Interaction,
    compactFeeNoun: 'DeFi fees',
  },
  ai: {
    panelTitle: 'Benefits',
    headline: 'Hold KREX. Pay less on AI Hub tools.',
    feeNoun: 'AI Hub fees',
    earnVerb: 'Actions earn',
    earnBase: HUB_EARN_POINTS.dappL1Interaction,
    compactFeeNoun: 'AI fees',
  },
  rewards: {
    panelTitle: 'Benefits',
    headline: 'Hold KREX. Multiply Hub Points.',
    feeNoun: 'Rewards Hub fees',
    earnVerb: 'Eligible actions earn',
    earnBase: HUB_EARN_POINTS.dappL1Interaction,
    compactFeeNoun: 'Rewards fees',
  },
  stats: {
    panelTitle: 'Benefits',
    headline: 'Hold KREX. Unlock Stats Hub perks.',
    feeNoun: 'Stats Hub fees',
    earnVerb: 'Actions earn',
    earnBase: HUB_EARN_POINTS.dappL1Interaction,
    compactFeeNoun: 'Stats fees',
  },
  store: {
    panelTitle: 'Seller perks',
    headline: 'Hold KREX. List products for less.',
    feeNoun: 'Store listing fees',
    earnVerb: 'Listing earns',
    earnBase: HUB_EARN_POINTS.storeProductList,
    compactFeeNoun: 'Store fees',
  },
  tokens: {
    panelTitle: 'Benefits',
    headline: 'Hold KREX. Unlock modules. Ship utility faster.',
    feeNoun: 'premium token modules',
    earnVerb: 'Listing earns',
    earnBase: HUB_EARN_POINTS.tokenListingCreate,
    compactFeeNoun: 'token modules',
    extraBullets: [
      'Verified badge via on-chain KAS listing payment',
      'Connect Hub payments, dApps, and tools to your token page',
    ],
  },
};

export function HubBenefitsPanel({
  className = '',
  variant = 'panel',
  hideBuyButton = false,
  scope = 'hub',
}: {
  className?: string;
  variant?: 'panel' | 'compact';
  hideBuyButton?: boolean;
  scope?: HubBenefitsScope;
}) {
  const copy = SCOPE_COPY[scope] ?? SCOPE_COPY.hub;
  const { balance: krexBalance, tier, isLoading } = useKREXBalance();
  const [isKrexWizardOpen, setIsKrexWizardOpen] = useState(false);
  const stableBalanceRef = useRef(0);
  if (!isLoading) stableBalanceRef.current = krexBalance;
  const displayBalance = isLoading ? stableBalanceRef.current : krexBalance;
  const discountPercent = krexTierDiscountPercent(tier);
  const publishPts = computeEarnedHubPoints(copy.earnBase, tier);
  const visualTier = balanceToKrexVisualTier(displayBalance);
  const ui = KREX_TIER_UI[visualTier];
  const tierLabel = KREX_TIERS[tier].label;
  const tooltipContent = useMemo(() => TIER_TOOLTIP, []);
  const buyKrexButtonClass = 'hub-cta-btn shrink-0 k-control-btn !h-auto';
  const accentDot = 'text-[color:var(--hub-accent,#10b981)]';
  const scopedStatusText =
    discountPercent > 0
      ? `${discountPercent}% off ${copy.feeNoun} at ${tierLabel}.`
      : ui.statusText;

  if (variant === 'compact') {
    const feePerk =
      discountPercent > 0
        ? `${discountPercent}% off ${copy.compactFeeNoun}`
        : `Hold 1M+ KREX for ${copy.compactFeeNoun} discount`;
    const pointsPerk =
      tier !== 'Tier0' ? `Multiplier (${formatHubPointsTierLabel(tier)})` : 'No multiplier';

    return (
      <>
        <aside
          className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2 shadow-md max-w-full ${ui.panel} ${className}`.trim()}
          aria-label="Benefits. Hover for KREX tier details."
        >
          <Tooltip content={tooltipContent}>
            <div className="flex items-center gap-2 min-w-0 cursor-help">
              <span className="hub-benefits-kicker text-xs font-black uppercase tracking-[0.12em] whitespace-nowrap">
                Benefits
              </span>
              <span
                className={`rounded-md px-1.5 py-0.5 text-[11px] font-black uppercase tracking-wide whitespace-nowrap ${ui.badge}`}
              >
                {ui.label}
              </span>
              <span className="hidden md:inline text-[13px] leading-none text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                {feePerk}
              </span>
              <span className="hidden lg:inline text-[13px] leading-none text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                {pointsPerk}
              </span>
              <span className={`hidden sm:inline text-[13px] leading-none font-semibold whitespace-nowrap ${ui.accent}`}>
                {formatKrexMillions(displayBalance)} KREX
              </span>
            </div>
          </Tooltip>
          <button
            type="button"
            onClick={() => setIsKrexWizardOpen(true)}
            className={`${buyKrexButtonClass} !h-auto !py-1 !px-3 !text-xs !font-bold`}
          >
            Buy KREX
          </button>
        </aside>
        <KREXBuyWizard isOpen={isKrexWizardOpen} onClose={() => setIsKrexWizardOpen(false)} />
      </>
    );
  }

  return (
    <>
      <Tooltip content={tooltipContent}>
        <aside
          className={`w-full min-w-0 max-w-full overflow-hidden rounded-xl border p-3.5 shadow-lg cursor-help ${ui.panel} ${className}`.trim()}
          aria-label="Benefits. Hover for KREX tier details."
        >
          <DAppSectionHeader
            title={copy.panelTitle}
            className="mb-2"
            right={
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${ui.badge}`}>
                {ui.label}
              </span>
            }
          />
          <h2 className="mb-2.5 text-sm font-bold leading-snug text-zinc-900 dark:text-zinc-100">{copy.headline}</h2>
          <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
            <li>
              <span className={accentDot}>•</span>{' '}
              {discountPercent > 0
                ? `${discountPercent}% off ${copy.feeNoun} (${tierLabel})`
                : `Stack 1M+ KREX for ${KREX_TIERS.Tier1.feeDiscountPercent}% off ${copy.feeNoun}`}
            </li>
            <li>
              <span className={accentDot}>•</span> {copy.earnVerb} +{publishPts} Hub Points
              {copy.earnLineShort
                ? ' at your tier'
                : tier !== 'Tier0'
                  ? ` at your tier (${formatHubPointsTierLabel(tier)} multiplier)`
                  : ' at your tier (base amount)'}
            </li>
            {(copy.extraBullets ?? []).map((line) => (
              <li key={line}>
                <span className={accentDot}>•</span> {line}
              </li>
            ))}
          </ul>
          <div className={`mt-2 rounded-lg border px-2.5 py-2 text-xs leading-snug ${ui.status}`}>
            <span className="font-semibold">{formatKrexMillions(displayBalance)} KREX held.</span>{' '}
            {scopedStatusText}
          </div>
          {!hideBuyButton ? (
            <button
              type="button"
              onClick={() => setIsKrexWizardOpen(true)}
              className={`mt-2.5 w-full ${buyKrexButtonClass} !py-2 !text-sm`}
            >
              Buy KREX
            </button>
          ) : null}
        </aside>
      </Tooltip>
      <KREXBuyWizard isOpen={isKrexWizardOpen} onClose={() => setIsKrexWizardOpen(false)} />
    </>
  );
}
