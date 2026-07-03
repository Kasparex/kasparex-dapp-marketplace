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
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { TokenListingBadges } from './TokenListingBadges';
import { TOKEN_MODULE_OFFERS } from '@/lib/tokens/modules';
import { TOKENS_ACCENT } from '@/lib/tokens/theme';

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
            <TokenListingBadges token={token} />

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
                <DAppSectionHeader title="Links" />
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

            {(token.listing?.instantUtility || token.listing?.verified) && (
              <section id="modules" className="scroll-mt-28 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 bg-zinc-50/80 dark:bg-zinc-900/40">
                <DAppSectionHeader title="Premium modules" className="mb-4" />
                <p className="kx-body-sm mb-4">
                  Extend this token page with roadmap editors, Hub integrations, analytics, and more.
                  Developer dashboard and module unlocks are coming in the next release.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {TOKEN_MODULE_OFFERS.slice(0, 4).map((module) => (
                    <div
                      key={module.id}
                      className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3"
                    >
                      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{module.title}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{module.unlockPriceKas} KAS unlock</p>
                    </div>
                  ))}
                </div>
                <Link
                  href="/tokens/dashboard"
                  className="k-cta-primary inline-flex text-sm"
                  style={{ borderColor: TOKENS_ACCENT }}
                >
                  Open Developer Dashboard
                </Link>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
