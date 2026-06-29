'use client';

import type { VBlogModuleId } from '@/lib/vblog/types';

export function VBlogModuleConfigFields({
  moduleId,
  premiumSectionContent,
  onPremiumSectionContentChange,
  premiumSectionPriceKas,
  onPremiumSectionPriceKasChange,
  premiumSectionPayoutAddress,
  onPremiumSectionPayoutAddressChange,
  tipToRevealContent,
  onTipToRevealContentChange,
  tipToRevealThresholdKas,
  onTipToRevealThresholdKasChange,
  pollQuestion,
  onPollQuestionChange,
  pollOptions,
  onPollOptionsChange,
  disabled,
}: {
  moduleId: VBlogModuleId;
  premiumSectionContent?: string;
  onPremiumSectionContentChange?: (v: string) => void;
  premiumSectionPriceKas?: string;
  onPremiumSectionPriceKasChange?: (v: string) => void;
  premiumSectionPayoutAddress?: string;
  onPremiumSectionPayoutAddressChange?: (v: string) => void;
  tipToRevealContent?: string;
  onTipToRevealContentChange?: (v: string) => void;
  tipToRevealThresholdKas?: string;
  onTipToRevealThresholdKasChange?: (v: string) => void;
  pollQuestion?: string;
  onPollQuestionChange?: (v: string) => void;
  pollOptions?: string;
  onPollOptionsChange?: (v: string) => void;
  disabled?: boolean;
}) {
  if (moduleId === 'premium_section') {
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/40 px-4 py-3 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Premium section setup</p>
        <textarea
          value={premiumSectionContent ?? ''}
          onChange={(e) => onPremiumSectionContentChange?.(e.target.value)}
          rows={4}
          className="k-textarea min-h-[96px]"
          placeholder="Premium section content (Markdown supported)"
          disabled={disabled}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            className="k-input"
            value={premiumSectionPriceKas ?? ''}
            onChange={(e) => onPremiumSectionPriceKasChange?.(e.target.value)}
            placeholder="Reader unlock price (KAS)"
            disabled={disabled}
          />
          <input
            className="k-input"
            value={premiumSectionPayoutAddress ?? ''}
            onChange={(e) => onPremiumSectionPayoutAddressChange?.(e.target.value)}
            placeholder="Payout Kaspa address"
            disabled={disabled}
          />
        </div>
      </div>
    );
  }

  if (moduleId === 'tip_to_reveal') {
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/40 px-4 py-3 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Tip-to-reveal setup</p>
        <textarea
          value={tipToRevealContent ?? ''}
          onChange={(e) => onTipToRevealContentChange?.(e.target.value)}
          rows={3}
          className="k-textarea min-h-[80px]"
          placeholder="Hidden bonus content (Markdown supported)"
          disabled={disabled}
        />
        <input
          className="k-input"
          value={tipToRevealThresholdKas ?? ''}
          onChange={(e) => onTipToRevealThresholdKasChange?.(e.target.value)}
          placeholder="Reveal threshold (KAS)"
          disabled={disabled}
        />
      </div>
    );
  }

  if (moduleId === 'premium_poll') {
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/40 px-4 py-3 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Premium poll setup</p>
        <input
          className="k-input"
          value={pollQuestion ?? ''}
          onChange={(e) => onPollQuestionChange?.(e.target.value)}
          placeholder="Poll question"
          disabled={disabled}
        />
        <input
          className="k-input"
          value={pollOptions ?? ''}
          onChange={(e) => onPollOptionsChange?.(e.target.value)}
          placeholder="Options, comma-separated"
          disabled={disabled}
        />
      </div>
    );
  }

  return null;
}
