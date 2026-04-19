/**
 * Token landing: protocols hub layout (bg shell, border-l main, max-width column).
 */

'use client';

import Link from 'next/link';
import type { Token } from '@/lib/tokens/types';
import { TokenSidebar } from './TokenSidebar';
import { TokenHeroSection } from './TokenHeroSection';
import { TokenInfoSection } from './TokenInfoSection';
import { TokenomicsSection } from './TokenomicsSection';
import { RoadmapSection } from './RoadmapSection';
import { DAppRelationSection } from './DAppRelationSection';
import { PriceSection } from './PriceSection';
import { TokenBalanceDisplay } from './TokenBalanceDisplay';
import { TokenMintingProgress } from './TokenMintingProgress';
import { TokenTradingSection } from './TokenTradingSection';
import { TokenLedgerDashboard } from './TokenLedgerDashboard';
import { getTokenLedger } from '@/lib/tokens/ledger';

interface TokenLandingPageProps {
  token: Token;
}

function isFullyMinted(token: Token): boolean {
  if (!token.maxSupply || !token.circulatingSupply) return false;
  return token.circulatingSupply >= token.maxSupply;
}

export function TokenLandingPage({ token }: TokenLandingPageProps) {
  const fullyMinted = isFullyMinted(token);
  const showMintingProgress = token.maxSupply && token.circulatingSupply !== undefined && !fullyMinted;
  const showTrading = fullyMinted || token.id === 'krex' || token.type === 'global';
  const showGridLedger = token.id === 'grid';

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-zinc-50 dark:bg-zinc-950 lg:flex-row">
      <TokenSidebar token={token} />

      <main className="min-h-[calc(100vh-4rem)] flex-1 min-w-0 overflow-y-auto border-l border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:pl-6">
          <nav className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
            <Link href="/tokens" className="font-bold text-[#02abb8] hover:underline">
              Tokens
            </Link>
            <span className="mx-2 text-zinc-400">/</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-100">{token.name}</span>
          </nav>

          <div className="space-y-10">
            <TokenHeroSection token={token} />

            {showGridLedger && <TokenLedgerDashboard snapshot={getTokenLedger('grid')} />}

            {showMintingProgress && <TokenMintingProgress token={token} />}
            {showTrading && <TokenTradingSection token={token} />}

            <TokenInfoSection token={token} />
            <PriceSection token={token} />
            <TokenomicsSection token={token} />
            <RoadmapSection token={token} />
            <DAppRelationSection token={token} />
            <TokenBalanceDisplay token={token} />

            {token.links && token.links.length > 0 && (
              <section id="links" className="scroll-mt-28 space-y-6 py-10">
                <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">Links</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {token.links.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-cyan-500/30 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80"
                    >
                      <div className="flex-shrink-0 text-zinc-500 dark:text-zinc-400">
                        {link.type === 'website' && (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                        )}
                        {link.type === 'explorer' && (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        )}
                        {link.type === 'social' && (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        )}
                        {(!link.type || link.type === 'other') && (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{link.label}</div>
                        <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                          {link.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        </div>
                      </div>
                      <svg className="h-4 w-4 flex-shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
