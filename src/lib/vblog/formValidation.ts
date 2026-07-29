import { htmlToPlainText } from '@/lib/richText/html';
import { VBLOG_READER_MIN_OUTPUT_KAS } from '@/lib/vblog/readerPricing';
import { validatePayoutSplitRows } from '@/lib/vblog/paymentSplit';
import type { VBlogPayoutSplit } from '@/lib/vblog/types';

export type VBlogModulesFormValidationInput = {
  premiumSectionEnabled?: boolean;
  premiumSectionContent?: string;
  premiumSectionPriceKas?: string | number;
  premiumPayoutSplits?: Array<{ address: string; sharePercent: number }>;
  tipBoxEnabled?: boolean;
  tipBoxPresets?: number[];
  tipBoxCurrencies?: string[];
  tipToRevealEnabled?: boolean;
  tipToRevealContent?: string;
  tipToRevealThresholdKas?: string | number;
  premiumPollEnabled?: boolean;
  pollQuestion?: string;
  pollOptions?: string[];
  magazineIntegrationEnabled?: boolean;
  linkedMagazineId?: string;
  linkedIssueNumber?: string | number;
};

/** Required-when-enabled checks for vBlog premium modules before pay/publish. */
export function validateVBlogModulesForPublish(input: VBlogModulesFormValidationInput): string | null {
  if (input.premiumSectionEnabled) {
    if (!htmlToPlainText(input.premiumSectionContent ?? '').trim()) {
      return 'Premium section needs content before you can enable and pay for it.';
    }
    const price = Number(input.premiumSectionPriceKas);
    const minList = VBLOG_READER_MIN_OUTPUT_KAS * 2;
    if (!Number.isFinite(price) || price < minList) {
      return `Premium unlock price must be at least ${minList} KAS (author payout + platform fee each need ≥ ${VBLOG_READER_MIN_OUTPUT_KAS} KAS).`;
    }
    if (input.premiumPayoutSplits) {
      const splitErr = validatePayoutSplitRows(input.premiumPayoutSplits as VBlogPayoutSplit[]);
      if (splitErr) return splitErr;
    }
  }

  if (input.tipBoxEnabled) {
    const presets = (input.tipBoxPresets ?? []).filter((n) => Number.isFinite(n) && n > 0);
    if (presets.length === 0) {
      return 'Tip box needs at least one tip preset amount when enabled.';
    }
    if (presets.some((n) => n < VBLOG_READER_MIN_OUTPUT_KAS)) {
      return `Tip presets must be at least ${VBLOG_READER_MIN_OUTPUT_KAS} KAS each (avoids storage-mass failures).`;
    }
    const currencies = (input.tipBoxCurrencies ?? []).map((c) => c.trim()).filter(Boolean);
    if (currencies.length === 0) {
      return 'Tip box needs at least one payment currency when enabled.';
    }
  }

  if (input.tipToRevealEnabled) {
    if (!htmlToPlainText(input.tipToRevealContent ?? '').trim()) {
      return 'Tip-to-reveal bonus content is required when enabled.';
    }
    const threshold = Number(input.tipToRevealThresholdKas);
    if (!Number.isFinite(threshold) || threshold < VBLOG_READER_MIN_OUTPUT_KAS) {
      return `Tip-to-reveal threshold must be at least ${VBLOG_READER_MIN_OUTPUT_KAS} KAS.`;
    }
  }

  if (input.premiumPollEnabled) {
    const options = (input.pollOptions ?? []).map((o) => o.trim()).filter(Boolean);
    if (!String(input.pollQuestion ?? '').trim() || options.length < 2) {
      return 'Premium poll requires a question and at least 2 options when enabled.';
    }
  }

  if (input.magazineIntegrationEnabled && (!input.linkedMagazineId || !input.linkedIssueNumber)) {
    return 'Magazine integration requires a target magazine and issue number when enabled.';
  }

  return null;
}
