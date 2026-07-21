'use client';

import type { HubListingPriceQuote } from '@/lib/hub/listingPricing';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';

type Props = {
  quote: HubListingPriceQuote;
  hubPoints?: number;
  /** Extra note under total (e.g. payment currency hint). */
  footerNote?: string;
  className?: string;
};

/** Shared Calculation breakdown rail (matches vBlog Create Article). */
export function HubListingCalculationBreakdown({ quote, hubPoints, footerNote, className }: Props) {
  return (
    <div className={className ?? 'contents'}>
      <DAppSectionHeader title="Calculation breakdown" className="mb-1" />
      <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
        <div className="flex justify-between">
          <span>Base fee</span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{quote.baseFeeKas} KAS</span>
        </div>
        <div className="flex justify-between">
          <span>Size fee</span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{quote.sizeFeeKas} KAS</span>
        </div>
        <div className="flex justify-between">
          <span>Network buffer</span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{quote.networkFeeBufferKas} KAS</span>
        </div>
        {quote.moduleLines.map((line) => (
          <div key={line.id} className="flex justify-between gap-2">
            <span className="truncate">{line.title}</span>
            <span className="shrink-0 font-semibold text-zinc-900 dark:text-zinc-100">+{line.kas} KAS</span>
          </div>
        ))}
        {quote.modulesFeeKas > 0 ? (
          <div className="flex justify-between border-t border-zinc-200 pt-1.5 dark:border-zinc-700">
            <span>Modules subtotal</span>
            <span className="font-semibold text-[#02abb8]">{quote.modulesFeeKas} KAS</span>
          </div>
        ) : null}
        {quote.discountKas > 0 ? (
          <div className="flex justify-between">
            <span>KREX discount</span>
            <span className="font-semibold text-emerald-600">-{quote.discountKas} KAS</span>
          </div>
        ) : null}
        <div className="flex justify-between">
          <span>Payload bytes</span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{quote.payloadBytes}</span>
        </div>
        <div className="flex justify-between">
          <span>Chunk estimate</span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{quote.chunkCount}</span>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
        <p className="text-xs uppercase tracking-widest text-zinc-500">Total to pay</p>
        <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{quote.totalKas} KAS</p>
      </div>

      {footerNote ? (
        <div className="rounded-xl border border-[#02abb8]/25 bg-[#02abb8]/10 p-3 text-sm text-zinc-700 dark:text-zinc-300">
          {footerNote}
        </div>
      ) : null}

      {hubPoints != null && hubPoints > 0 ? (
        <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-3 dark:border-cyan-900/40 dark:bg-cyan-950/25">
          <p className="text-xs font-black uppercase tracking-widest text-cyan-900 dark:text-cyan-100">Hub points</p>
          <p className="text-xl font-black text-cyan-900 dark:text-cyan-100">+{hubPoints} pts</p>
        </div>
      ) : null}
    </div>
  );
}
