'use client';

import type { Token } from '@/lib/tokens/types';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { getTokenWhitepaperUrl } from '@/lib/tokens/sections';

export function TokenWhitepaperSection({ token }: { token: Token }) {
  const whitepaperUrl = getTokenWhitepaperUrl(token);

  return (
    <section id="token-whitepaper" className="space-y-6">
      <DAppSectionHeader title="Whitepaper" />
      {whitepaperUrl ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Download the official {token.symbol} whitepaper for tokenomics, utility, and roadmap details.
          </p>
          <a
            href={whitepaperUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="k-cta-primary inline-flex shrink-0 items-center justify-center gap-2 text-sm"
          >
            Download whitepaper
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </a>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/80 p-5 dark:border-zinc-700 dark:bg-zinc-900/40">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No whitepaper has been published for this token yet.
          </p>
          <button type="button" disabled className="k-control-btn mt-3 opacity-50 cursor-not-allowed">
            Download whitepaper
          </button>
        </div>
      )}
    </section>
  );
}
