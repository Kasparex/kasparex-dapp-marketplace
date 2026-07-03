'use client';

import { useState } from 'react';
import type { Token } from '@/lib/tokens/types';
import { DAppTabs, type DAppTab } from '@/components/dapps/layout/DAppTabs';
import { DAppSidePanelToggle } from '@/components/dapps/layout/DAppSidePanelToggle';
import { SidePanelCollapsedContentWrap } from '@/components/layout/SidePanelCollapsedContentWrap';
import { useTokenRightPanelOpen } from '@/hooks/useTokenRightPanelOpen';
import { TokenPageHeader } from './TokenPageHeader';
import { TokenAside } from './TokenAside';
import { TokenInfoSection } from './TokenInfoSection';
import { TokenomicsSection } from './TokenomicsSection';
import { RoadmapSection } from './RoadmapSection';
import { PriceSection } from './PriceSection';
import { TokenBalanceDisplay } from './TokenBalanceDisplay';
import { TokenMintingProgress } from './TokenMintingProgress';
import { TokenTradingSection } from './TokenTradingSection';
import { DAppRelationSection } from './DAppRelationSection';
import { TokenCommentsSection, TokenUtilitySection } from './TokenCommentsSection';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';

export type TokenContentTab = 'info' | 'tokenomics' | 'roadmap' | 'markets' | 'utility' | 'comments';

function isFullyMinted(token: Token): boolean {
  if (!token.maxSupply || !token.circulatingSupply) return false;
  return token.circulatingSupply >= token.maxSupply;
}

function InfoIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 3v18M6 8v13M16 13v8M21 6v15" />
    </svg>
  );
}

function RoadmapIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function MarketIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function UtilityIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function CommentsIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8m-8 4h6M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4-.8L3 20l1.3-3.9A7.4 7.4 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
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
  const [internalTab, setInternalTab] = useState<TokenContentTab>('info');
  const contentTab = controlledTab ?? internalTab;
  const setContentTab = onContentTabChange ?? setInternalTab;
  const [rightOpen, setRightOpen] = useTokenRightPanelOpen(true);

  const fullyMinted = isFullyMinted(token);
  const showMintingProgress = Boolean(token.maxSupply && token.circulatingSupply !== undefined && !fullyMinted);
  const showTrading = fullyMinted || token.id === 'krex' || token.type === 'global';
  const showUtility = Boolean(token.listing?.instantUtility || token.listing?.verified);

  const tokenTabs: readonly DAppTab<TokenContentTab>[] = [
    { id: 'info', label: 'Token Info', icon: <InfoIcon /> },
    { id: 'tokenomics', label: 'Tokenomics', icon: <ChartIcon /> },
    { id: 'roadmap', label: 'Roadmap', icon: <RoadmapIcon /> },
    { id: 'markets', label: 'Markets', icon: <MarketIcon /> },
    ...(showUtility ? [{ id: 'utility' as const, label: 'Utility', icon: <UtilityIcon /> }] : []),
    { id: 'comments', label: 'Comments', icon: <CommentsIcon /> },
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
                {contentTab === 'info' ? (
                  <div id="token-info" className="scroll-mt-28 space-y-8 animate-in fade-in duration-300">
                    <TokenInfoSection token={token} />
                    <DAppRelationSection token={token} />
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

                {contentTab === 'tokenomics' ? (
                  <div id="token-tokenomics" className="scroll-mt-28 animate-in fade-in duration-300">
                    <TokenomicsSection token={token} />
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
                    {showTrading ? <TokenTradingSection token={token} /> : null}
                    <PriceSection token={token} />
                    <TokenBalanceDisplay token={token} />
                  </div>
                ) : null}

                {contentTab === 'utility' && showUtility ? (
                  <div className="animate-in fade-in duration-300">
                    <TokenUtilitySection token={token} />
                  </div>
                ) : null}

                {contentTab === 'comments' ? (
                  <div className="animate-in fade-in duration-300">
                    <TokenCommentsSection token={token} />
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
