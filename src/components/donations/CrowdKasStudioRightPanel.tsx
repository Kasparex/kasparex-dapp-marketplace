'use client';

import { CrowdKasDashboardBenefitsPanel } from '@/components/donations/CrowdKasDashboardBenefitsPanel';
import { CrowdKasL1CalculationPanel, CrowdKasL2CalculationPanel } from '@/components/donations/CrowdKasCalculationPanel';
import type { CrowdKasL1PriceQuote, CrowdKasL2PriceQuote } from '@/lib/donations/pricing';
import type { KREXTier } from '@/lib/rewards/types';

type L1PanelProps = {
  network: 'l1';
  quote: CrowdKasL1PriceQuote;
  tier: KREXTier;
  infoText: string;
  submitLabel: string;
  onSubmit?: () => void;
  submitDisabled?: boolean;
  isSubmitting?: boolean;
  onPreview?: () => void;
  error?: string | null;
};

type L2PanelProps = {
  network: 'l2';
  quote: CrowdKasL2PriceQuote;
  infoText: string;
  submitLabel: string;
  onSubmit?: () => void;
  submitDisabled?: boolean;
  isSubmitting?: boolean;
  onPreview?: () => void;
  error?: string | null;
};

export function CrowdKasStudioRightPanel(props: L1PanelProps | L2PanelProps) {
  const { infoText, submitLabel, onSubmit, submitDisabled, isSubmitting, onPreview, error } = props;

  return (
    <div className="flex flex-col gap-4 xl:sticky xl:top-6">
      <CrowdKasDashboardBenefitsPanel />
      {props.network === 'l1' ? (
        <CrowdKasL1CalculationPanel
          quote={props.quote}
          tier={props.tier}
          infoText={infoText}
          submitLabel={submitLabel}
          onSubmit={onSubmit}
          submitDisabled={submitDisabled}
          isSubmitting={isSubmitting}
          onPreview={onPreview}
          error={error}
        />
      ) : (
        <CrowdKasL2CalculationPanel
          quote={props.quote}
          infoText={infoText}
          submitLabel={submitLabel}
          onSubmit={onSubmit}
          submitDisabled={submitDisabled}
          isSubmitting={isSubmitting}
          onPreview={onPreview}
          error={error}
        />
      )}
    </div>
  );
}
