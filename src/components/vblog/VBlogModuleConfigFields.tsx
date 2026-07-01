'use client';

import type { VBlogModuleId } from '@/lib/vblog/types';
import { KxRichTextEditor } from '@/components/ui/KxRichTextEditor';
import { VBlogPollOptionsEditor } from './VBlogPollOptionsEditor';

export function VBlogModuleConfigFields({
  moduleId,
  premiumSectionContent,
  onPremiumSectionContentChange,
  premiumSectionPriceKas,
  onPremiumSectionPriceKasChange,
  premiumSectionPayoutAddress,
  onPremiumSectionPayoutAddressChange,
  premiumSectionSplitAddresses,
  onPremiumSectionSplitAddressesChange,
  tipToRevealContent,
  onTipToRevealContentChange,
  tipToRevealThresholdKas,
  onTipToRevealThresholdKasChange,
  pollQuestion,
  onPollQuestionChange,
  pollOptions,
  onPollOptionsChange,
  disabled,
  bare = false,
}: {
  moduleId: VBlogModuleId;
  premiumSectionContent?: string;
  onPremiumSectionContentChange?: (v: string) => void;
  premiumSectionPriceKas?: string;
  onPremiumSectionPriceKasChange?: (v: string) => void;
  premiumSectionPayoutAddress?: string;
  onPremiumSectionPayoutAddressChange?: (v: string) => void;
  premiumSectionSplitAddresses?: string[];
  onPremiumSectionSplitAddressesChange?: (v: string[]) => void;
  tipToRevealContent?: string;
  onTipToRevealContentChange?: (v: string) => void;
  tipToRevealThresholdKas?: string;
  onTipToRevealThresholdKasChange?: (v: string) => void;
  pollQuestion?: string;
  onPollQuestionChange?: (v: string) => void;
  pollOptions?: string[];
  onPollOptionsChange?: (v: string[]) => void;
  disabled?: boolean;
  bare?: boolean;
}) {
  const setupShellClass = bare
    ? 'space-y-3 pt-3 border-t border-zinc-200 dark:border-zinc-700'
    : 'rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/40 px-4 py-3 space-y-3';

  if (moduleId === 'premium_section') {
    return (
      <div className={setupShellClass}>
        <p className="text-xs font-bold uppercase tracking-wider text-[#02abb8] dark:text-[#66dfe8]">Premium section setup</p>
        <KxRichTextEditor
          value={premiumSectionContent ?? ''}
          onChange={(v) => onPremiumSectionContentChange?.(v)}
          minRows={4}
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
            placeholder="Primary payout Kaspa address"
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Optional split wallets (up to 2 more)
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Author share is split evenly across valid wallets. Covenant-based routing will automate this soon.
          </p>
          {(premiumSectionSplitAddresses ?? ['', '']).map((addr, index) => (
            <input
              key={index}
              className="k-input"
              value={addr}
              onChange={(e) => {
                const next = [...(premiumSectionSplitAddresses ?? ['', ''])];
                next[index] = e.target.value;
                onPremiumSectionSplitAddressesChange?.(next);
              }}
              placeholder={`Split wallet ${index + 2} (optional)`}
              disabled={disabled}
            />
          ))}
        </div>
      </div>
    );
  }

  if (moduleId === 'tip_to_reveal') {
    return (
      <div className={setupShellClass}>
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Tip-to-reveal setup</p>
        <KxRichTextEditor
          value={tipToRevealContent ?? ''}
          onChange={(v) => onTipToRevealContentChange?.(v)}
          minRows={3}
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
      <div className={setupShellClass}>
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Premium poll setup</p>
        <input
          className="k-input"
          value={pollQuestion ?? ''}
          onChange={(e) => onPollQuestionChange?.(e.target.value)}
          placeholder="Poll question"
          disabled={disabled}
        />
        <VBlogPollOptionsEditor
          options={pollOptions ?? ['Option 1', 'Option 2']}
          onChange={(next) => onPollOptionsChange?.(next)}
          disabled={disabled}
        />
      </div>
    );
  }

  return null;
}
