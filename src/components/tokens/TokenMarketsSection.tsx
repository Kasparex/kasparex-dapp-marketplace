'use client';

import type { Token } from '@/lib/tokens/types';
import type { TokenMarketEntry } from '@/lib/tokens/modules';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { KxRichTextContent } from '@/components/ui/KxRichTextContent';

function venueBadgeClass(venueType: TokenMarketEntry['venueType']): string {
  return venueType === 'cex'
    ? 'border-violet-500/40 bg-violet-500/15 text-violet-700 dark:text-violet-300'
    : 'border-cyan-500/40 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300';
}

export function TokenMarketsSection({ token }: { token: Token }) {
  const markets = (token.modulesConfig?.markets ?? []).filter((m) => m.name.trim() && m.url.trim());

  if (markets.length === 0) {
    return (
      <section id="markets" className="space-y-6">
        <DAppSectionHeader title="Markets" />
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/80 p-6 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">No market listings have been published for this token yet.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="markets" className="space-y-6">
      <DAppSectionHeader title="Markets" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {markets.map((market, index) => (
          <a
            key={`${market.url}-${index}`}
            href={market.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-cyan-500/30 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{market.name}</div>
                <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {market.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </div>
              </div>
              <span
                className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${venueBadgeClass(market.venueType)}`}
              >
                {market.venueType}
              </span>
            </div>
            {market.description.trim() ? (
              <KxRichTextContent html={market.description} className="kx-prose text-sm" />
            ) : null}
          </a>
        ))}
      </div>
    </section>
  );
}
