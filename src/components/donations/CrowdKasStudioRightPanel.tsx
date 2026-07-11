'use client';

import { CrowdKasDashboardBenefitsPanel } from '@/components/donations/CrowdKasDashboardBenefitsPanel';
import { CrowdKasDashboardHubPointsPanel } from '@/components/donations/CrowdKasDashboardHubPointsPanel';
import { CrowdKasCalculationPanel } from '@/components/donations/CrowdKasCalculationPanel';
import type { CrowdKasPriceQuote } from '@/lib/donations/pricing';
import type { KREXTier } from '@/lib/rewards/types';

export function CrowdKasStudioRightPanel({
  quote,
  tier,
  actionLabel,
  onSubmit,
  submitLabel,
  submitDisabled,
  onPreview,
  error,
}: {
  quote: CrowdKasPriceQuote;
  tier: KREXTier;
  actionLabel: string;
  onSubmit?: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
  onPreview?: () => void;
  error?: string | null;
}) {
  return (
    <div className="space-y-4 xl:sticky xl:top-6">
      <CrowdKasDashboardBenefitsPanel />
      <CrowdKasDashboardHubPointsPanel />
      <CrowdKasCalculationPanel
        quote={quote}
        tier={tier}
        actionLabel={actionLabel}
        onSubmit={onSubmit}
        submitLabel={submitLabel}
        submitDisabled={submitDisabled}
        onPreview={onPreview}
        error={error}
      />
    </div>
  );
}
