'use client';

import type { VBlogModuleId } from '@/lib/vblog/types';
import { KxRichTextEditor } from '@/components/ui/KxRichTextEditor';
import { VBlogPollOptionsEditor } from './VBlogPollOptionsEditor';

export type PayoutSplitRow = { address: string; sharePercent: string };

/** Accepted tip currencies an author can enable for the tipping box. */
export const VBLOG_TIP_CURRENCIES = ['KAS', 'KREX'] as const;

/** Shared caption for module setup sub-sections (global standard). */
const CONFIG_SUBTITLE_CLASS =
  'text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400';

export function VBlogPayoutSplitsEditor({
  rows,
  onChange,
  disabled = false,
}: {
  rows: PayoutSplitRow[];
  onChange: (rows: PayoutSplitRow[]) => void;
  disabled?: boolean;
}) {
  const filled = rows.filter((r) => r.address.trim());
  const totalPercent = filled.reduce((s, r) => s + (Number(r.sharePercent) || 0), 0);
  const totalLabel = filled.length > 0 ? `${Math.round(totalPercent * 100) / 100}%` : '0%';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Payout split (up to 3 wallets)
        </p>
        <span
          className={`text-[10px] font-bold tabular-nums ${
            Math.abs(totalPercent - 100) < 0.01 && filled.length > 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-amber-600 dark:text-amber-400'
          }`}
        >
          Total: {totalLabel}
        </span>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Set wallet addresses and percentages. Shares must total 100%. Covenant routing will automate this soon.
      </p>
      {rows.map((row, index) => (
        <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_5.5rem] gap-2">
          <input
            className="k-input"
            value={row.address}
            onChange={(e) => {
              const next = [...rows];
              next[index] = { ...next[index], address: e.target.value };
              onChange(next);
            }}
            placeholder={index === 0 ? 'Primary payout Kaspa address' : `Split wallet ${index + 1} (optional)`}
            disabled={disabled}
          />
          <input
            type="number"
            min={0}
            max={100}
            step={0.01}
            className="k-input tabular-nums"
            value={row.sharePercent}
            onChange={(e) => {
              const next = [...rows];
              next[index] = { ...next[index], sharePercent: e.target.value };
              onChange(next);
            }}
            placeholder="%"
            disabled={disabled}
            aria-label={`Wallet ${index + 1} share percent`}
          />
        </div>
      ))}
    </div>
  );
}

export function VBlogModuleConfigFields({
  moduleId,
  premiumSectionContent,
  onPremiumSectionContentChange,
  premiumSectionPriceKas,
  onPremiumSectionPriceKasChange,
  premiumPayoutSplitRows,
  onPremiumPayoutSplitRowsChange,
  tipToRevealContent,
  onTipToRevealContentChange,
  tipToRevealThresholdKas,
  onTipToRevealThresholdKasChange,
  tipBoxPresets,
  onTipBoxPresetsChange,
  tipBoxCurrencies,
  onTipBoxCurrenciesChange,
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
  premiumPayoutSplitRows?: PayoutSplitRow[];
  onPremiumPayoutSplitRowsChange?: (rows: PayoutSplitRow[]) => void;
  tipToRevealContent?: string;
  onTipToRevealContentChange?: (v: string) => void;
  tipToRevealThresholdKas?: string;
  onTipToRevealThresholdKasChange?: (v: string) => void;
  tipBoxPresets?: string;
  onTipBoxPresetsChange?: (v: string) => void;
  tipBoxCurrencies?: string[];
  onTipBoxCurrenciesChange?: (v: string[]) => void;
  pollQuestion?: string;
  onPollQuestionChange?: (v: string) => void;
  pollOptions?: string[];
  onPollOptionsChange?: (v: string[]) => void;
  disabled?: boolean;
  bare?: boolean;
}) {
  const setupShellClass = bare
    ? 'space-y-3 pt-5 border-t border-zinc-200 dark:border-zinc-700'
    : 'rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/40 px-4 py-3 space-y-3';

  if (moduleId === 'premium_section') {
    return (
      <div className={setupShellClass}>
        <p className={CONFIG_SUBTITLE_CLASS}>Premium section setup</p>
        <KxRichTextEditor
          value={premiumSectionContent ?? ''}
          onChange={(v) => onPremiumSectionContentChange?.(v)}
          minRows={4}
          placeholder="Premium section content (Markdown supported)"
          disabled={disabled}
        />
        <input
          className="k-input"
          value={premiumSectionPriceKas ?? ''}
          onChange={(e) => onPremiumSectionPriceKasChange?.(e.target.value)}
          placeholder="Reader unlock price (KAS)"
          disabled={disabled}
        />
        <VBlogPayoutSplitsEditor
          rows={premiumPayoutSplitRows ?? [{ address: '', sharePercent: '100' }, { address: '', sharePercent: '' }, { address: '', sharePercent: '' }]}
          onChange={(next) => onPremiumPayoutSplitRowsChange?.(next)}
          disabled={disabled}
        />
      </div>
    );
  }

  if (moduleId === 'tip_box') {
    const activeCurrencies = tipBoxCurrencies && tipBoxCurrencies.length > 0 ? tipBoxCurrencies : ['KAS'];
    const toggleCurrency = (currency: string) => {
      const isOn = activeCurrencies.includes(currency);
      const next = isOn
        ? activeCurrencies.filter((c) => c !== currency)
        : [...activeCurrencies, currency];
      onTipBoxCurrenciesChange?.(next.length > 0 ? next : ['KAS']);
    };
    return (
      <div className={setupShellClass}>
        <p className={CONFIG_SUBTITLE_CLASS}>Tipping box setup</p>
        <div className="space-y-1.5">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Default tip amounts shown publicly to readers (comma-separated).
          </p>
          <input
            className="k-input tabular-nums"
            value={tipBoxPresets ?? ''}
            onChange={(e) => onTipBoxPresetsChange?.(e.target.value)}
            placeholder="10, 50, 100"
            disabled={disabled}
            aria-label="Default tip amounts"
          />
        </div>
        <div className="space-y-1.5">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Accepted tip currencies</p>
          <div className="flex flex-wrap gap-2">
            {VBLOG_TIP_CURRENCIES.map((currency) => {
              const active = activeCurrencies.includes(currency);
              return (
                <button
                  key={currency}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleCurrency(currency)}
                  aria-pressed={active}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                    active
                      ? 'border-[#e30d1b] bg-[#e30d1b]/10 text-[#e30d1b] dark:text-[#ff6b73]'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-[#e30d1b]/40'
                  }`}
                >
                  {currency}
                  {currency !== 'KAS' ? <span className="ml-1 opacity-70">(soon)</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (moduleId === 'tip_to_reveal') {
    return (
      <div className={setupShellClass}>
        <p className={CONFIG_SUBTITLE_CLASS}>Tip-to-reveal setup</p>
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
        <p className={CONFIG_SUBTITLE_CLASS}>Premium poll setup</p>
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
