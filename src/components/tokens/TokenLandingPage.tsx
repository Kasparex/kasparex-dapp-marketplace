/**
 * Token Landing Page Component
 * Combines all token sections with sidebar navigation
 */

'use client';

import Link from 'next/link';
import type { Token } from '@/lib/tokens/types';
import { TokenSidebar } from './TokenSidebar';
import { TokenInfoSection } from './TokenInfoSection';
import { TokenomicsSection } from './TokenomicsSection';
import { RoadmapSection } from './RoadmapSection';
import { DAppRelationSection } from './DAppRelationSection';
import { PriceSection } from './PriceSection';
import { TokenBalanceDisplay } from './TokenBalanceDisplay';
import { getExplorerUrl } from '@/lib/dapps/deployer';
import { useChainId } from 'wagmi';

interface TokenLandingPageProps {
  token: Token;
}

export function TokenLandingPage({ token }: TokenLandingPageProps) {
  const chainId = useChainId();

  const explorerUrl = token.contractAddress
    ? getExplorerUrl(token.contractAddress, chainId)
    : null;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Sidebar */}
      <TokenSidebar token={token} />

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
          {/* Hero Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              <Link href="/tokens" className="hover:text-zinc-900 dark:hover:text-zinc-100">
                Tokens
              </Link>
              <span>/</span>
              <span className="text-zinc-900 dark:text-zinc-100">{token.name}</span>
            </div>
          </section>

          {/* Token Info */}
          <TokenInfoSection token={token} />

          {/* Price */}
          <PriceSection token={token} />

          {/* Tokenomics */}
          <TokenomicsSection token={token} />

          {/* Roadmap */}
          <RoadmapSection token={token} />

          {/* Related dApps */}
          <DAppRelationSection token={token} />

          {/* Balance */}
          <TokenBalanceDisplay token={token} />

          {/* Links Section */}
          {token.links && token.links.length > 0 && (
            <section id="links" className="space-y-6">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Links</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {token.links.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-[#02abb8] hover:shadow-lg transition-all"
                  >
                    <div className="flex-shrink-0">
                      {link.type === 'website' && (
                        <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      )}
                      {link.type === 'explorer' && (
                        <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      )}
                      {link.type === 'social' && (
                        <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      )}
                      {(!link.type || link.type === 'other') && (
                        <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {link.label}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                        {link.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-zinc-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
