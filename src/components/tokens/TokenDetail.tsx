'use client';

import { useState } from 'react';
import type { Token } from '@/lib/tokens/types';
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
import { CommentsSection } from '@/components/vblog/CommentsSection';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import {
  IconTokenComments,
  IconTokenMarkets,
  IconTokenOverview,
  IconTokenRoadmap,
  IconTokenSwap,
  IconTokenUtility,
} from '@/components/tokens/icons/TokenTabIcons';

export type TokenContentTab = 'overview' | 'roadmap' | 'markets' | 'swap' | 'utility' | 'comments';

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
}

export function TokenDetail({
  token,
  contentTab: controlledTab,
  onContentTabChange,
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

  const tokenTabs: DAppTab<TokenContentTab>[] = [
    { id: 'overview', label: 'Overview', icon: <IconTokenOverview /> },
    ...(token.roadmap?.length
      ? [{ id: 'roadmap' as const, label: 'Roadmap', icon: <IconTokenRoadmap /> }]
      : []),
    { id: 'markets', label: 'Markets', icon: <IconTokenMarkets /> },
    ...(showSwap ? [{ id: 'swap' as const, label: 'Swap', icon: <IconTokenSwap /> }] : []),
    ...(showUtility ? [{ id: 'utility' as const, label: 'Utility', icon: <IconTokenUtility /> }] : []),
    {
      id: 'comments',
      label: 'Comments',
      icon: <IconTokenComments />,
      rightAdornment: <CommentsTabBadge count={commentsCount} />,
    },
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

        <div className={`grid grid-cols-1 gap-8 xl:gap-12 ${rightOpen ? 'lg:grid-cols-12' : ''}`}>
          <div className={`min-w-0 ${rightOpen ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
            <SidePanelCollapsedContentWrap panelOpen={rightOpen}>
              <div className="flex min-w-0 flex-col space-y-6">
                {contentTab === 'overview' ? (
                  <div id="token-overview" className="scroll-mt-28 space-y-8 animate-in fade-in duration-300">
                    <TokenInfoSection token={token} />
                    <div id="token-tokenomics" className="scroll-mt-28">
                      <TokenomicsSection token={token} />
                    </div>
                    {token.links && token.links.length > 0 ? (
                      <section id="token-links" className="scroll-mt-28 space-y-6">
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
                  <div id="token-roadmap" className="scroll-mt-28 animate-in fade-in duration-300">
                    <RoadmapSection token={token} />
                  </div>
                ) : null}

                {contentTab === 'markets' ? (
                  <div id="token-markets" className="scroll-mt-28 space-y-8 animate-in fade-in duration-300">
                    {showMintingProgress ? <TokenMintingProgress token={token} /> : null}
                    <PriceSection token={token} />
                    <TokenBalanceDisplay token={token} />
                  </div>
                ) : null}

                {contentTab === 'swap' && showSwap ? (
                  <div id="token-swap" className="scroll-mt-28 animate-in fade-in duration-300">
                    <TokenTradingSection token={token} />
                  </div>
                ) : null}

                {contentTab === 'utility' && showUtility ? (
                  <div id="token-utility" className="scroll-mt-28 animate-in fade-in duration-300">
                    <TokenUtilitySection token={token} />
                  </div>
                ) : null}

                {contentTab === 'comments' ? (
                  <div id="token-comments" className="scroll-mt-28 animate-in fade-in duration-300">
                    <CommentsSection articleId={tokenCommentsArticleId(token.slug)} dappSectionHeader />
                  </div>
                ) : null}
              </div>
            </SidePanelCollapsedContentWrap>
          </div>

          {rightOpen ? (
            <div className="min-w-0 lg:col-span-5">
              <TokenAside token={token} />
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
