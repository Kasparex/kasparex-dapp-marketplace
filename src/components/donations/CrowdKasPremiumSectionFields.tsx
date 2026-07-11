'use client';

import { KxRichTextEditor } from '@/components/ui/KxRichTextEditor';
import { VBlogPayoutSplitsEditor } from '@/components/vblog/VBlogModuleConfigFields';
import { payoutSplitRowsFromModules, type PayoutSplitRow } from '@/lib/vblog/paymentSplit';
import type { CrowdKasModulesConfig } from '@/lib/donations/crowdkasModules';

export function crowdKasPremiumPayoutRows(modules: CrowdKasModulesConfig): PayoutSplitRow[] {
  if (modules.premiumSectionPayoutSplits?.length) {
    return modules.premiumSectionPayoutSplits.map((r) => ({
      address: r.address,
      sharePercent: String(r.sharePercent),
    }));
  }
  return payoutSplitRowsFromModules({
    premiumSectionPayoutAddress: modules.premiumSectionPayoutAddress,
    premiumSectionPayoutSplits: modules.premiumSectionPayoutSplits?.map((r) => ({
      address: r.address,
      sharePercent: r.sharePercent,
    })),
  });
}

export function CrowdKasPremiumSectionFields({
  modules,
  onChange,
  disabled = false,
}: {
  modules: CrowdKasModulesConfig;
  onChange: (next: CrowdKasModulesConfig) => void;
  disabled?: boolean;
}) {
  const rows = crowdKasPremiumPayoutRows(modules);

  return (
    <div className="space-y-3 pt-5 border-t border-zinc-200 dark:border-zinc-700">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        Premium section setup
      </p>
      <KxRichTextEditor
        value={modules.premiumSectionContent ?? ''}
        onChange={(v) => onChange({ ...modules, premiumSectionContent: v })}
        minRows={4}
        placeholder="Premium section content"
        disabled={disabled}
      />
      <input
        className="k-input"
        value={modules.premiumSectionPriceKas != null ? String(modules.premiumSectionPriceKas) : ''}
        onChange={(e) =>
          onChange({
            ...modules,
            premiumSectionPriceKas: e.target.value.trim() ? Number(e.target.value) : undefined,
          })
        }
        placeholder="Donor unlock price (KAS)"
        disabled={disabled}
      />
      <VBlogPayoutSplitsEditor
        rows={rows}
        onChange={(next) =>
          onChange({
            ...modules,
            premiumSectionPayoutSplits: next
              .filter((r) => r.address.trim())
              .map((r) => ({
                address: r.address.trim(),
                sharePercent: Number(r.sharePercent) || 0,
              })),
          })
        }
        disabled={disabled}
      />
    </div>
  );
}
