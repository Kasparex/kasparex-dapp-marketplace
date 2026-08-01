'use client';

import { useState } from 'react';
import type { Token } from '@/lib/tokens/types';
import type { TokenPageConfig } from '@/lib/tokens/listingRecord';
import { getOrderedTabs, getOrderedOverviewSubsections } from '@/lib/tokens/pageConfig';
import { DAppTabs, type DAppTab } from '@/components/dapps/layout/DAppTabs';
import { HubPageRightPanelGrid, HubPageRightPanelToggle } from '@/components/hub/HubPageRightPanel';
import { SidePanelCollapsedContentWrap } from '@/components/layout/SidePanelCollapsedContentWrap';
import { useTokenRightPanelOpen } from '@/hooks/useTokenRightPanelOpen';
import { useDAppCommentsCount } from '@/hooks/useDAppCommentsCount';
import { tokenCommentsArticleId } from '@/lib/tokens/comments';
import { TokenPageHeader } from './TokenPageHeader';
import { TokenAside } from './TokenAside';
import { TokenInfoSection } from './TokenInfoSection';
import { TokenProtocolAvailability } from './TokenProtocolAvailability';
import { ProgrammableAssetPanel } from './ProgrammableAssetPanel';
import { TokenomicsSection } from './TokenomicsSection';
import { RoadmapSection } from './RoadmapSection';
import { TokenMarketsSection } from './TokenMarketsSection';
import { PriceSection } from './PriceSection';
import { TokenBalanceDisplay } from './TokenBalanceDisplay';
import { TokenMintingProgress } from './TokenMintingProgress';
import { TokenTradingSection } from './TokenTradingSection';
import { TokenUtilitySection } from './TokenCommentsSection';
import { TokenWhitepaperSection } from './TokenWhitepaperSection';
import { CommentsSection } from '@/components/vblog/CommentsSection';
import { GameOverviewTitleBlock } from '@/components/games/panels/GameOverviewSections';
import { TOKEN_TAB_SECTION_CLASS, type TokenContentTab } from '@/lib/tokens/sections';
import { canShowUtilityTab } from '@/lib/tokens/utilityEligibility';
import {
  IconTokenAuthor,
  IconTokenComments,
  IconTokenMarkets,
  IconTokenOverview,
  IconTokenRoadmap,
  IconTokenShop,
  IconTokenSwap,
  IconTokenUtility,
} from '@/components/tokens/icons/TokenTabIcons';
import { TokenCreatorShopTab } from '@/components/tokens/TokenCreatorShopTab';
import { TokenCreatorAuthorTab } from '@/components/tokens/TokenCreatorAuthorTab';
import { tokenHasModule } from '@/lib/tokens/modules';

export type { TokenContentTab } from '@/lib/tokens/sections';

function isFullyMinted(token: Token): boolean {
  if (!token.maxSupply || !token.circulatingSupply) return false;
  return token.circulatingSupply >= token.maxSupply;
}

function CommentsTabBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-[color:var(--hub-accent-muted)] px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-[color:var(--hub-accent)]">
      {count}
    </span>
  );
}

interface TokenDetailProps {
  token: Token;
  contentTab?: TokenContentTab;
  onContentTabChange?: (tab: TokenContentTab) => void;
  pageConfig?: TokenPageConfig;
  /** Preview mode: hide aside panel and side-panel toggle. */
  preview?: boolean;
}

export function TokenDetail({
  token,
  contentTab: controlledTab,
  onContentTabChange,
  pageConfig,
  preview = false,
}: TokenDetailProps) {
  const [internalTab, setInternalTab] = useState<TokenContentTab>('overview');
  const contentTab = controlledTab ?? internalTab;
  const setContentTab = onContentTabChange ?? setInternalTab;
  const [rightOpen, setRightOpen] = useTokenRightPanelOpen(!preview);

  const fullyMinted = isFullyMinted(token);
  const showMintingProgress = Boolean(token.maxSupply && token.circulatingSupply !== undefined && !fullyMinted);
  const showSwap = fullyMinted || token.id === 'krex' || token.type === 'global';
  const showUtility = canShowUtilityTab(token);
  const showShop =
    Boolean(pageConfig?.sections.some((s) => s.type === 'shop' && s.enabled)) ||
    tokenHasModule(token.paidModuleIds, 'creator_showcase');
  const showAuthor =
    Boolean(pageConfig?.sections.some((s) => s.type === 'author' && s.enabled)) ||
    tokenHasModule(token.paidModuleIds, 'creator_showcase');
  const commentsCount = useDAppCommentsCount(tokenCommentsArticleId(token.slug));
  const orderedOverviewSubsections = getOrderedOverviewSubsections(pageConfig);
  const orderedTabs = (() => {
    const base = getOrderedTabs(pageConfig);
    const next = [...base];
    const insertBeforeComments = (tab: TokenContentTab) => {
      if (next.includes(tab)) return;
      const idx = next.indexOf('comments');
      next.splice(idx >= 0 ? idx : next.length, 0, tab);
    };
    if (showShop || preview) insertBeforeComments('shop');
    if (showAuthor || preview) insertBeforeComments('author');
    return next;
  })();

  const TAB_META: Record<TokenContentTab, DAppTab<TokenContentTab> | null> = {
    overview: { id: 'overview', label: 'Overview', icon: <IconTokenOverview /> },
    roadmap: { id: 'roadmap', label: 'Roadmap', icon: <IconTokenRoadmap /> },
    markets: { id: 'markets', label: 'Markets', icon: <IconTokenMarkets /> },
    swap: showSwap || preview ? { id: 'swap', label: 'Swap', icon: <IconTokenSwap /> } : null,
    utility: showUtility ? { id: 'utility', label: 'Utility', icon: <IconTokenUtility /> } : null,
    shop: showShop || preview ? { id: 'shop', label: 'Shop', icon: <IconTokenShop /> } : null,
    author:
      showAuthor || preview
        ? { id: 'author', label: 'vBlog Author', icon: <IconTokenAuthor /> }
        : null,
    comments: {
      id: 'comments',
      label: 'Comments',
      icon: <IconTokenComments />,
      rightAdornment: <CommentsTabBadge count={commentsCount} />,
    },
  };

  const tokenTabs: DAppTab<TokenContentTab>[] = orderedTabs
    .map((tab) => TAB_META[tab])
    .filter((tab): tab is DAppTab<TokenContentTab> => tab !== null);

  const renderOverviewSubsection = (type: (typeof orderedOverviewSubsections)[number]) => {
    if (type === 'tokenomics') {
      return (
        <div key="tokenomics" id="token-tokenomics" className="scroll-mt-28">
          <TokenomicsSection token={token} />
        </div>
      );
    }
    if (type === 'whitepaper') {
      return <TokenWhitepaperSection key="whitepaper" token={token} />;
    }
    if (type === 'links' && token.links && token.links.length > 0) {
      return (
        <section key="links" id="token-links" className="space-y-6">
          <GameOverviewTitleBlock kicker="Resources" title="Links" as="h3" compact />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {token.links.map((link, index) => (
              <a
                key={`${link.url}-${index}`}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-[color:var(--hub-accent-border)] hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{link.label}</div>
                  <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {link.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      );
    }
    return null;
  };

  return (
    <article className="w-full min-w-0 mx-auto max-w-6xl font-sans">
      <TokenPageHeader token={token} onNavigateTab={setContentTab} />

      <div className="flex w-full min-w-0 flex-col gap-6">
        <div className="mb-2 flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
          <div className="min-w-0 flex-1">
            <DAppTabs tabs={tokenTabs} value={contentTab} onChange={setContentTab} />
          </div>
          {!preview ? (
            <HubPageRightPanelToggle
              panelId="kasparex-token-side-panel"
              rightOpen={rightOpen}
              onToggle={() => setRightOpen(!rightOpen)}
            />
          ) : null}
        </div>

        <HubPageRightPanelGrid
          panelId="kasparex-token-side-panel"
          panelTitle="Token panel"
          rightOpen={!preview && rightOpen}
          onToggle={() => setRightOpen(!rightOpen)}
          sidebar={<TokenAside token={token} />}
          mainColClass="lg:col-span-8"
          asideColClass="lg:col-span-4"
          gridClassName="grid grid-cols-1 gap-8 xl:gap-10"
          hideToggle
        >
          <SidePanelCollapsedContentWrap panelOpen={preview ? false : rightOpen}>
            <div className="flex min-w-0 flex-col">
                {contentTab === 'overview' ? (
                  <div id="token-overview" className={`${TOKEN_TAB_SECTION_CLASS} space-y-8 animate-in fade-in duration-300`}>
                    <TokenInfoSection token={token} />
                    <TokenProtocolAvailability token={token} />
                    <ProgrammableAssetPanel token={token} />
                    {orderedOverviewSubsections.map((type) => renderOverviewSubsection(type))}
                  </div>
                ) : null}

                {contentTab === 'roadmap' ? (
                  <div id="token-roadmap" className={`${TOKEN_TAB_SECTION_CLASS} animate-in fade-in duration-300`}>
                    <RoadmapSection token={token} />
                  </div>
                ) : null}

                {contentTab === 'markets' ? (
                  <div id="token-markets" className={`${TOKEN_TAB_SECTION_CLASS} space-y-8 animate-in fade-in duration-300`}>
                    <TokenMarketsSection token={token} />
                    {showMintingProgress ? <TokenMintingProgress token={token} /> : null}
                    <PriceSection token={token} />
                    <TokenBalanceDisplay token={token} />
                  </div>
                ) : null}

                {contentTab === 'swap' && (showSwap || preview) ? (
                  <div id="token-swap" className={`${TOKEN_TAB_SECTION_CLASS} animate-in fade-in duration-300`}>
                    <TokenTradingSection token={token} />
                  </div>
                ) : null}

                {contentTab === 'utility' && showUtility ? (
                  <div id="token-utility" className={`${TOKEN_TAB_SECTION_CLASS} animate-in fade-in duration-300`}>
                    <TokenUtilitySection token={token} />
                  </div>
                ) : null}

                {contentTab === 'shop' && (showShop || preview) ? (
                  <div id="token-shop" className={`${TOKEN_TAB_SECTION_CLASS} animate-in fade-in duration-300`}>
                    <TokenCreatorShopTab token={token} />
                  </div>
                ) : null}

                {contentTab === 'author' && (showAuthor || preview) ? (
                  <div id="token-author" className={`${TOKEN_TAB_SECTION_CLASS} animate-in fade-in duration-300`}>
                    <TokenCreatorAuthorTab token={token} />
                  </div>
                ) : null}

                {contentTab === 'comments' ? (
                  <div id="token-comments" className={`${TOKEN_TAB_SECTION_CLASS} animate-in fade-in duration-300`}>
                    <CommentsSection articleId={tokenCommentsArticleId(token.slug)} dappSectionHeader />
                  </div>
                ) : null}
              </div>
          </SidePanelCollapsedContentWrap>
        </HubPageRightPanelGrid>
      </div>
    </article>
  );
}
