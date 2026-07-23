'use client';

import { PanelAdSlider } from '@/components/ads/PanelAdSlider';
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
  submittingLabel?: string;
  onSubmit?: () => void;
  submitDisabled?: boolean;
  isSubmitting?: boolean;
  onPreview?: () => void;
  onCancel?: () => void;
  error?: string | null;
  requirementsNote?: string[];
};

type L2PanelProps = {
  network: 'l2';
  quote: CrowdKasL2PriceQuote;
  tier: KREXTier;
  krexBalance?: number;
  infoText: string;
  submitLabel: string;
  submittingLabel?: string;
  onSubmit?: () => void;
  submitDisabled?: boolean;
  isSubmitting?: boolean;
  onPreview?: () => void;
  onCancel?: () => void;
  error?: string | null;
  requirementsNote?: string[];
};

export function CrowdKasStudioRightPanel(props: L1PanelProps | L2PanelProps) {
  const {
    infoText,
    submitLabel,
    submittingLabel,
    onSubmit,
    submitDisabled,
    isSubmitting,
    onPreview,
    onCancel,
    error,
    requirementsNote,
  } = props;

  return (
    <div className="flex flex-col gap-4">
      <CrowdKasDashboardBenefitsPanel />
      {props.network === 'l1' ? (
        <CrowdKasL1CalculationPanel
          quote={props.quote}
          tier={props.tier}
          infoText={infoText}
          submitLabel={submitLabel}
          submittingLabel={submittingLabel}
          onSubmit={onSubmit}
          submitDisabled={submitDisabled}
          isSubmitting={isSubmitting}
          onPreview={onPreview}
          onCancel={onCancel}
          error={error}
          requirementsNote={requirementsNote}
        />
      ) : (
        <CrowdKasL2CalculationPanel
          quote={props.quote}
          tier={props.tier}
          krexBalance={props.krexBalance}
          infoText={infoText}
          submitLabel={submitLabel}
          submittingLabel={submittingLabel}
          onSubmit={onSubmit}
          submitDisabled={submitDisabled}
          isSubmitting={isSubmitting}
          onPreview={onPreview}
          onCancel={onCancel}
          error={error}
          requirementsNote={requirementsNote}
        />
      )}
      <PanelAdSlider slotId="HALO_DONATIONS_RIGHT" id="ad-slot-crowdkas-studio-rail" />
    </div>
  );
}
