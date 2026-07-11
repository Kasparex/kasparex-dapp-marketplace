'use client';

import { CrowdKasDashboardBenefitsPanel } from '@/components/donations/CrowdKasDashboardBenefitsPanel';
import { CrowdKasCalculationPanel } from '@/components/donations/CrowdKasCalculationPanel';
import type { CrowdKasPriceQuote } from '@/lib/donations/pricing';
import type { KREXTier } from '@/lib/rewards/types';

export function CrowdKasStudioRightPanel({
  quote,
  tier,
  infoText,
  submitLabel,
  onSubmit,
  submitDisabled,
  isSubmitting,
  onPreview,
  error,
}: {
  quote: CrowdKasPriceQuote;
  tier: KREXTier;
  infoText: string;
  submitLabel: string;
  onSubmit?: () => void;
  submitDisabled?: boolean;
  isSubmitting?: boolean;
  onPreview?: () => void;
  error?: string | null;
}) {
  return (
    <div className="flex flex-col gap-4 xl:sticky xl:top-6">
      <CrowdKasDashboardBenefitsPanel />
      <CrowdKasCalculationPanel
        quote={quote}
        tier={tier}
        infoText={infoText}
        submitLabel={submitLabel}
        onSubmit={onSubmit}
        submitDisabled={submitDisabled}
        isSubmitting={isSubmitting}
        onPreview={onPreview}
        error={error}
      />
    </div>
  );
}
