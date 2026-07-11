'use client';

import type { ReactNode } from 'react';
import type { CrowdKasPriceQuote } from '@/lib/donations/pricing';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { computeEarnedHubPoints } from '@/lib/rewards/hub-points';
import type { KREXTier } from '@/lib/rewards/types';

export function CrowdKasCalculationPanel({
  quote,
  tier,
  actionLabel,
  onSubmit,
  submitLabel,
  submitDisabled = false,
  onPreview,
  previewLabel = 'Preview campaign',
  error,
  children,
}: {
  quote: CrowdKasPriceQuote;
  tier: KREXTier;
  actionLabel: string;
  onSubmit?: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
  onPreview?: () => void;
  previewLabel?: string;
  error?: string | null;
  children?: ReactNode;
}) {
  const earnPts = computeEarnedHubPoints(HUB_EARN_POINTS.crowdkasCampaignCreate, tier);

  return (
    <aside className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 p-5 shadow-lg shadow-emerald-500/5 space-y-4">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400 mb-1">
          Calculation breakdown
        </p>
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{actionLabel}</h2>
      </div>

      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-zinc-500 dark:text-zinc-400">Base fee</dt>
          <dd className="font-semibold tabular-nums">{quote.baseFeeKas <= 0 ? 'Free' : `${quote.baseFeeKas} KAS`}</dd>
        </div>
        {quote.moduleLines.map((line) => (
          <div key={line.id} className="flex justify-between gap-2">
            <dt className="text-zinc-500 dark:text-zinc-400">{line.label}</dt>
            <dd className="font-semibold tabular-nums">{line.kas} KAS</dd>
          </div>
        ))}
        {quote.modulesFeeKas > 0 ? (
          <div className="flex justify-between gap-2">
            <dt className="text-zinc-500 dark:text-zinc-400">Modules subtotal</dt>
            <dd className="font-semibold tabular-nums">{quote.modulesFeeKas} KAS</dd>
          </div>
        ) : null}
        {quote.networkFeeBufferKas > 0 ? (
          <div className="flex justify-between gap-2">
            <dt className="text-zinc-500 dark:text-zinc-400">Network buffer</dt>
            <dd className="font-semibold tabular-nums">{quote.networkFeeBufferKas} KAS</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
          <dt className="font-semibold text-zinc-900 dark:text-zinc-100">Total to pay</dt>
          <dd className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {quote.totalKas <= 0 ? 'Free (+ gas)' : `${quote.totalKas} KAS`}
          </dd>
        </div>
      </dl>

      {quote.action === 'create' ? (
        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-snug rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
          Earn <strong className="text-emerald-800 dark:text-emerald-300">+{earnPts} Hub Points</strong> when your campaign is created on-chain.
        </p>
      ) : null}

      {children}

      {onSubmit ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitDisabled}
          className="w-full k-control-btn justify-center !bg-emerald-600 !text-white hover:!bg-emerald-700 disabled:opacity-50"
        >
          {submitLabel ?? 'Submit'}
        </button>
      ) : null}

      {onPreview ? (
        <button type="button" onClick={onPreview} className="w-full k-control-btn justify-center">
          {previewLabel}
        </button>
      ) : null}

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
    </aside>
  );
}
