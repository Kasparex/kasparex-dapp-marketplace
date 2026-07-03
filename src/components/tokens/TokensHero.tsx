'use client';

import Link from 'next/link';
import { HubHaloHeader } from '@/components/hub/HubHaloHeader';
import { TOKENS_GRADIENT_TEXT } from '@/lib/tokens/theme';

export function TokensHero() {
  return (
    <HubHaloHeader
      badgeLabel="Utility Hub"
      theme="cyan"
      title={
        <>
          Kasparex <span className={TOKENS_GRADIENT_TEXT}>Tokens</span>
        </>
      }
      subtitle={
        <>
          Discover ecosystem tokens, track balances, and find projects with live Kasparex Hub utility.
          Build modular landing pages and connect real use cases for your community.
        </>
      }
      actions={
        <>
          <a href="#content" className="k-cta-primary">
            View Tokens
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </a>
          <Link href="/tokens/dashboard" className="k-cta-secondary">
            Developer Dashboard
          </Link>
          <Link href="/hub" className="k-cta-secondary">
            Go to Hub
          </Link>
        </>
      }
    />
  );
}
