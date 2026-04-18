/**
 * Token detail sidebar: UnifiedSidebar + standard nav (Profile Hub / protocols pattern).
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { Token } from '@/lib/tokens/types';
import { loadTokenFeaturedImageUrl } from '@/lib/tokens/metadata';
import { TokenLogo } from './TokenLogo';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarSection } from '@/components/sidebar/SidebarSection';
import { SidebarNavItem } from '@/components/sidebar/SidebarNavItem';

interface TokenSidebarProps {
  token: Token;
}

const SECTIONS = [
  { id: 'info', label: 'About' },
  { id: 'tokenomics', label: 'Tokenomics' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'dapps', label: 'Related dApps' },
  { id: 'price', label: 'Price' },
  { id: 'balance', label: 'Your Balance' },
  { id: 'links', label: 'Links' },
] as const;

const navIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m-6 4h10" />
  </svg>
);

export function TokenSidebar({ token }: TokenSidebarProps) {
  const [activeSection, setActiveSection] = useState<string>('info');
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, observerOptions);

    SECTIONS.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observerRef.current?.observe(element);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [token.slug]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(sectionId);
    }
  };

  const featuredImageUrl = loadTokenFeaturedImageUrl(token);
  const price = token.price?.current;
  const priceChange24h = token.price?.change24h;

  return (
    <UnifiedSidebar
      storageKeyPrefix={`token-${token.slug}`}
      header={(onHide) => (
        <SidebarHeader backHref="/tokens" backLabel="Back to Tokens" onHide={onHide} className="bg-white dark:bg-zinc-950" />
      )}
      defaultWidth={280}
    >
      <div className="space-y-4">
        {featuredImageUrl ? (
          <div className="relative w-full h-32 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800">
            <Image src={featuredImageUrl} alt={token.name} fill className="object-cover" unoptimized />
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-2">
          <TokenLogo token={token} size={48} showName showSymbol />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded px-2 py-1 text-xs font-medium ${
              token.network === 'L1'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
            }`}
          >
            {token.network}
          </span>
          <span
            className={`rounded px-2 py-1 text-xs font-medium capitalize ${
              token.type === 'global'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                : token.type === 'local'
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                  : 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300'
            }`}
          >
            {token.type}
          </span>
        </div>

        {price !== undefined && (
          <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
            <div className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">Price</div>
            <div className="flex items-center gap-2">
              <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
              </div>
              {priceChange24h !== undefined && (
                <div
                  className={`text-sm ${
                    priceChange24h >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {priceChange24h >= 0 ? '+' : ''}
                  {priceChange24h.toFixed(2)}%
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <SidebarSection title="On this page" className="mt-6 mb-0">
        <nav className="space-y-0.5">
          {SECTIONS.map((section) => {
            if (section.id === 'roadmap' && !token.roadmap?.length) return null;
            if (section.id === 'dapps' && !token.relatedDAppIds?.length && !token.parentDAppId) return null;
            if (section.id === 'price' && !token.price) return null;
            if (section.id === 'links' && !token.links?.length) return null;

            return (
              <SidebarNavItem
                key={section.id}
                label={section.label}
                icon={navIcon}
                active={activeSection === section.id}
                onClick={() => scrollToSection(section.id)}
              />
            );
          })}
        </nav>
      </SidebarSection>
    </UnifiedSidebar>
  );
}
