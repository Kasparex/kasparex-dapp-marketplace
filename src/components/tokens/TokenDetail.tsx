'use client';

import { useState } from 'react';
import type { Token } from '@/lib/tokens/types';
import type { TokenPageConfig } from '@/lib/tokens/listingRecord';
import { getEnabledTabs, isSectionEnabled } from '@/lib/tokens/pageConfig';
import { DAppTabs, type DAppTab } from '@/components/dapps/layout/DAppTabs';
import { DAppSidePanelToggle } from '@/components/dapps/layout/DAppSidePanelToggle';
import { SidePanelCollapsedContentWrap } from '@/components/layout/SidePanelCollapsedContentWrap';
import { useTokenRightPanelOpen } from '@/hooks/useTokenRightPanelOpen';
import { useDAppCommentsCount } from '@/hooks/useDAppCommentsCount';
import { tokenCommentsArticleId } from '@/lib/tokens/comments';
import { TokenPageHeader } from './TokenPageHeader';
import { TokenAside } from './TokenAside';
import { TokenInfoSection } from './TokenInfoSection';
import { TokenomicsSection } from './TokenomicsSection';
import { RoadmapSection } from './RoadmapSection';
import { PriceSection } from './PriceSection';
import { TokenBalanceDisplay } from './TokenBalanceDisplay';
import { TokenMintingProgress } from './TokenMintingProgress';
import { TokenTradingSection } from './TokenTradingSection';
import { TokenUtilitySection } from './TokenCommentsSection';
import { TokenWhitepaperSection } from './TokenWhitepaperSection';
import { CommentsSection } from '@/components/vblog/CommentsSection';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { TOKEN_TAB_SECTION_CLASS, type TokenContentTab } from '@/lib/tokens/sections';
import {
  IconTokenComments,
  IconTokenMarkets,
  IconTokenOverview,
  IconTokenRoadmap,
  IconTokenSwap,
  IconTokenUtility,
} from '@/components/tokens/icons/TokenTabIcons';

export type { TokenContentTab } from '@/lib/tokens/sections';

function isFullyMinted(token: Token): boolean {
  if (!token.maxSupply || !token.circulatingSupply) return false;
  return token.circulatingSupply >= token.maxSupply;
}

function CommentsTabBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-cyan-500/15 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-cyan-800 dark:text-cyan-300">
      {count}
    </span>
  );
}

interface TokenDetailProps {
  token: Token;
  contentTab?: TokenContentTab;
  onContentTabChange?: (tab: TokenContentTab) => void;
  pageConfig?: TokenPageConfig;
}

export function TokenDetail({
  token,
  contentTab: controlledTab,
  onContentTabChange,
  pageConfig,
}: TokenDetailProps) {
  const [internalTab, setInternalTab] = useState<TokenContentTab>('overview');
  const contentTab = controlledTab ?? internalTab;
  const setContentTab = onContentTabChange ?? setInternalTab;
  const [rightOpen, setRightOpen] = useTokenRightPanelOpen(true);

  const fullyMinted = isFullyMinted(token);
  const showMintingProgress = Boolean(token.maxSupply && token.circulatingSupply !== undefined && !fullyMinted);
  const showSwap = fullyMinted || token.id === 'krex' || token.type === 'global';
  const showUtility = Boolean(token.listing?.instantUtility || token.listing?.verified);
  const commentsCount = useDAppCommentsCount(tokenCommentsArticleId(token.slug));
  const enabledTabs = getEnabledTabs(pageConfig);

  const tokenTabs: DAppTab<TokenContentTab>[] = [
    { id: 'overview', label: 'Overview', icon: <IconTokenOverview /> },
    ...(enabledTabs.has('roadmap') ? [{ id: 'roadmap' as const, label: 'Roadmap', icon: <IconTokenRoadmap /> }] : []),
    ...(enabledTabs.has('markets') ? [{ id: 'markets' as const, label: 'Markets', icon: <IconTokenMarkets /> }] : []),
    ...(showSwap && enabledTabs.has('swap') ? [{ id: 'swap' as const, label: 'Swap', icon: <IconTokenSwap /> }] : []),
    ...(showUtility && enabledTabs.has('utility') ? [{ id: 'utility' as const, label: 'Utility', icon: <IconTokenUtility /> }] : []),
    ...(enabledTabs.has('comments')
      ? [
          {
            id: 'comments' as const,
            label: 'Comments',
            icon: <IconTokenComments />,
            rightAdornment: <CommentsTabBadge count={commentsCount} />,
          },
        ]
      : []),
  ];

  return (
    <article className="mx-auto max-w-6xl font-sans">
      <TokenPageHeader token={token} />

      <div className="flex w-full min-w-0 flex-col gap-6">
        <div className="mb-2 flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
          <div className="min-w-0 flex-1">
            <DAppTabs tabs={tokenTabs} value={contentTab} onChange={setContentTab} />
          </div>
          <div className="flex shrink-0 justify-end sm:items-center">
            <DAppSidePanelToggle
              open={rightOpen}
              onToggle={() => setRightOpen(!rightOpen)}
              panelId="kasparex-token-side-panel"
            />
          </div>
        </div>

        <div className={`grid grid-cols-1 gap-8 xl:gap-10 ${rightOpen ? 'lg:grid-cols-12' : ''}`}>
          <div className={`min-w-0 ${rightOpen ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
            <SidePanelCollapsedContentWrap panelOpen={rightOpen}>
              <div className="flex min-w-0 flex-col">
                {contentTab === 'overview' ? (
                  <div id="token-overview" className={`${TOKEN_TAB_SECTION_CLASS} space-y-8 animate-in fade-in duration-300`}>
                    <TokenInfoSection token={token} />
                    {isSectionEnabled(pageConfig, 'tokenomics') ? (
                      <div id="token-tokenomics" className="scroll-mt-28">
                        <TokenomicsSection token={token} />
                      </div>
                    ) : null}
                    {isSectionEnabled(pageConfig, 'whitepaper') ? <TokenWhitepaperSection token={token} /> : null}
                    {isSectionEnabled(pageConfig, 'links') && token.links && token.links.length > 0 ? (
                      <section id="token-links" className="space-y-6">
                        <DAppSectionHeader title="Links" />
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {token.links.map((link, index) => (
                            <a
                              key={`${link.url}-${index}`}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-cyan-500/30 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80"
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
                    ) : null}
                  </div>
                ) : null}

                {contentTab === 'roadmap' ? (
                  <div id="token-roadmap" className={`${TOKEN_TAB_SECTION_CLASS} animate-in fade-in duration-300`}>
                    <RoadmapSection token={token} />
                  </div>
                ) : null}

                {contentTab === 'markets' ? (
                  <div id="token-markets" className={`${TOKEN_TAB_SECTION_CLASS} space-y-8 animate-in fade-in duration-300`}>
                    {showMintingProgress ? <TokenMintingProgress token={token} /> : null}
                    <PriceSection token={token} />
                    <TokenBalanceDisplay token={token} />
                  </div>
                ) : null}

                {contentTab === 'swap' && showSwap ? (
                  <div id="token-swap" className={`${TOKEN_TAB_SECTION_CLASS} animate-in fade-in duration-300`}>
                    <TokenTradingSection token={token} />
                  </div>
                ) : null}

                {contentTab === 'utility' && showUtility ? (
                  <div id="token-utility" className={`${TOKEN_TAB_SECTION_CLASS} animate-in fade-in duration-300`}>
                    <TokenUtilitySection token={token} />
                  </div>
                ) : null}

                {contentTab === 'comments' ? (
                  <div id="token-comments" className={`${TOKEN_TAB_SECTION_CLASS} animate-in fade-in duration-300`}>
                    <CommentsSection articleId={tokenCommentsArticleId(token.slug)} dappSectionHeader />
                  </div>
                ) : null}
              </div>
            </SidePanelCollapsedContentWrap>
          </div>

          {rightOpen ? (
            <div className="min-w-0 lg:col-span-4">
              <TokenAside token={token} />
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
