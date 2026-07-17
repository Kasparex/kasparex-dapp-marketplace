'use client';

import { useMemo, useState } from 'react';
import { HubPaymentPanel } from '@/components/payments/HubPaymentPanel';
import { KREXBuyWizard } from '@/components/rewards/KREXBuyWizard';
import { Alert } from '@/components/Alert';
import { buildKasKrexCurrencyOptions, formatHubPaymentAmount } from '@/lib/payments/hubPaymentTypes';
import { usePricingSnapshot } from '@/hooks/usePricingSnapshot';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { computeEarnedHubPoints, formatHubPointsTierLabel } from '@/lib/rewards/hub-points';
import { KREX_TIERS, type KREXTier } from '@/lib/rewards/types';
import type { CrowdKasL1PriceQuote, CrowdKasL2PriceQuote } from '@/lib/donations/pricing';
import { CROWDKAS_CALCULATION_ASIDE } from '@/components/donations/crowdkasFormTheme';
import type { StorePaymentCurrency } from '@/lib/store/currencies';
import type { HubPaymentQuoteLine } from '@/lib/payments/hubPaymentTypes';

function formatLineKas(kas: number, currencyId: StorePaymentCurrency, snapshot: ReturnType<typeof usePricingSnapshot>['snapshot']) {
  const currency = buildKasKrexCurrencyOptions().find((c) => c.id === currencyId) ?? buildKasKrexCurrencyOptions()[0];
  if (kas <= 0) return 'Free';
  return formatHubPaymentAmount(currency, kas, { snapshot });
}

function formatIkasAmount(ikas: number) {
  return `${ikas} iKAS`;
}

function buildL1BreakdownLines(
  quote: CrowdKasL1PriceQuote,
  paymentCurrency: StorePaymentCurrency,
  pricingSnapshot: ReturnType<typeof usePricingSnapshot>['snapshot'],
) {
  const lines: HubPaymentQuoteLine[] = [
    { label: 'Base fee', value: formatLineKas(quote.baseFeeKas, paymentCurrency, pricingSnapshot) },
    { label: 'Size fee', value: formatLineKas(quote.sizeFeeKas, paymentCurrency, pricingSnapshot) },
    { label: 'Network buffer', value: formatLineKas(quote.networkFeeBufferKas, paymentCurrency, pricingSnapshot) },
  ];
  if (quote.payoutSplitAddonKas > 0) {
    lines.push({
      label: 'Payout split recipients',
      value: formatLineKas(quote.payoutSplitAddonKas, paymentCurrency, pricingSnapshot),
    });
  }
  for (const line of quote.moduleLines) {
    lines.push({
      label: line.label,
      value: formatLineKas(line.kas, paymentCurrency, pricingSnapshot),
    });
  }
  if (quote.modulesFeeKas > 0) {
    lines.push({
      label: 'Modules subtotal',
      value: formatLineKas(quote.modulesFeeKas, paymentCurrency, pricingSnapshot),
      dividerBefore: true,
    });
  }
  lines.push({
    label: 'Subtotal',
    value: formatLineKas(quote.subtotalKas, paymentCurrency, pricingSnapshot),
    dividerBefore: true,
  });
  lines.push({ label: 'Payload bytes', value: String(quote.payloadBytes) });
  lines.push({ label: 'Chunk estimate', value: String(quote.chunkCount) });
  return lines;
}

export function CrowdKasL1CalculationPanel({
  quote,
  tier,
  infoText,
  isSubmitting = false,
  onSubmit,
  submitLabel = 'Create campaign',
  submittingLabel = 'Creating…',
  submitDisabled = false,
  onPreview,
  previewLabel = 'Preview campaign',
  onCancel,
  cancelLabel = 'Cancel',
  error,
  requirementsNote,
}: {
  quote: CrowdKasL1PriceQuote;
  tier: KREXTier;
  infoText: string;
  isSubmitting?: boolean;
  onSubmit?: () => void;
  submitLabel?: string;
  submittingLabel?: string;
  submitDisabled?: boolean;
  onPreview?: () => void;
  previewLabel?: string;
  onCancel?: () => void;
  cancelLabel?: string;
  error?: string | null;
  requirementsNote?: string[];
}) {
  const [paymentCurrency, setPaymentCurrency] = useState<StorePaymentCurrency>('KAS');
  const [isKrexWizardOpen, setIsKrexWizardOpen] = useState(false);
  const { balance: krexBalance } = useKREXBalance();
  const { snapshot: pricingSnapshot } = usePricingSnapshot(['KREX']);
  const discountPercent = KREX_TIERS[tier].feeDiscountPercent;
  const hasKrexDiscount = discountPercent > 0;
  const selectedCurrency =
    buildKasKrexCurrencyOptions().find((c) => c.id === paymentCurrency) ?? buildKasKrexCurrencyOptions()[0];

  const lines = useMemo(
    () => buildL1BreakdownLines(quote, paymentCurrency, pricingSnapshot),
    [paymentCurrency, pricingSnapshot, quote],
  );

  const totalDisplay = formatHubPaymentAmount(selectedCurrency, quote.totalKas, { snapshot: pricingSnapshot });
  const totalSubtitle = '+ network gas on Kaspa L1';
  const hubPoints =
    quote.action === 'create' ? computeEarnedHubPoints(HUB_EARN_POINTS.crowdkasCampaignCreate, tier) : 0;
  const hubPointsDetail = quote.action === 'create' ? formatHubPointsTierLabel(tier) : undefined;

  return (
    <>
      <HubPaymentPanel
        title="L1 calculation breakdown"
        asideClassName={CROWDKAS_CALCULATION_ASIDE}
        lines={lines}
        totalLabel="Total to pay"
        totalDisplay={totalDisplay}
        totalSubtitle={totalSubtitle}
        currencies={buildKasKrexCurrencyOptions()}
        selectedCurrencyId={paymentCurrency}
        onCurrencyChange={(id) => setPaymentCurrency(id as StorePaymentCurrency)}
        tier={tier}
        krexBalance={krexBalance}
        discountNote={
          quote.discountKas > 0
            ? `KREX discount: -${quote.discountKas.toFixed(2)} KAS (${discountPercent}% off total).`
            : hasKrexDiscount
              ? `KREX discount: ${discountPercent}% off platform and module fees (${KREX_TIERS[tier].label}).`
              : undefined
        }
        infoText={infoText}
        infoAccent="emerald"
        requirementsNote={requirementsNote}
        hubPoints={hubPoints}
        hubPointsDetail={hubPointsDetail}
        hubPointsBaseSpendKas={quote.subtotalKas}
        showCurrentTierFootnote
        flowBusy={isSubmitting}
        flowPreset="hubPublish"
        footer={
          <>
            {!hasKrexDiscount ? (
              <button
                type="button"
                onClick={() => setIsKrexWizardOpen(true)}
                className="w-full k-control-btn !border-emerald-500/30 !text-emerald-700 dark:!text-emerald-300"
              >
                Buy KREX to unlock discount
              </button>
            ) : null}
            {onSubmit ? (
              <button
                type="button"
                onClick={onSubmit}
                disabled={submitDisabled || isSubmitting}
                className="w-full k-control-btn !bg-emerald-600 !text-white !border-emerald-600 hover:!bg-emerald-700 dark:!bg-emerald-600 dark:hover:!bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? submittingLabel : submitLabel}
              </button>
            ) : null}
            {onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="w-full k-control-btn disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelLabel}
              </button>
            ) : null}
            {onPreview ? (
              <button
                type="button"
                onClick={onPreview}
                disabled={isSubmitting}
                className="w-full k-control-btn disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {previewLabel}
              </button>
            ) : null}
          </>
        }
        alerts={
          error ? (
            <Alert type="error" compact region>
              {error}
            </Alert>
          ) : null
        }
      />
      <KREXBuyWizard isOpen={isKrexWizardOpen} onClose={() => setIsKrexWizardOpen(false)} />
    </>
  );
}

function buildL2BreakdownLines(quote: CrowdKasL2PriceQuote) {
  const lines: HubPaymentQuoteLine[] = [
    { label: 'Base fee', value: formatIkasAmount(quote.baseFeeIkas) },
    { label: 'Size fee', value: formatIkasAmount(quote.sizeFeeIkas) },
    { label: 'Network buffer', value: formatIkasAmount(quote.networkFeeBufferIkas) },
  ];
  for (const line of quote.moduleLines) {
    lines.push({
      label: line.label,
      value: line.kas <= 0 ? 'Free' : formatIkasAmount(line.kas),
    });
  }
  if (quote.modulesFeeIkas > 0) {
    lines.push({
      label: 'Modules subtotal',
      value: formatIkasAmount(quote.modulesFeeIkas),
      dividerBefore: true,
    });
  }
  lines.push({ label: 'Subtotal', value: formatIkasAmount(quote.subtotalIkas), dividerBefore: true });
  lines.push({ label: 'Payload bytes', value: String(quote.payloadBytes) });
  lines.push({ label: 'Chunk estimate', value: String(quote.chunkCount) });
  return lines;
}

export function CrowdKasL2CalculationPanel({
  quote,
  tier,
  krexBalance = 0,
  infoText,
  isSubmitting = false,
  onSubmit,
  submitLabel = 'Create campaign',
  submittingLabel = 'Creating…',
  submitDisabled = false,
  onPreview,
  previewLabel = 'Preview campaign',
  onCancel,
  cancelLabel = 'Cancel',
  error,
  requirementsNote,
}: {
  quote: CrowdKasL2PriceQuote;
  tier: KREXTier;
  krexBalance?: number;
  infoText: string;
  isSubmitting?: boolean;
  onSubmit?: () => void;
  submitLabel?: string;
  submittingLabel?: string;
  submitDisabled?: boolean;
  onPreview?: () => void;
  previewLabel?: string;
  onCancel?: () => void;
  cancelLabel?: string;
  error?: string | null;
  requirementsNote?: string[];
}) {
  const isEdit = quote.action === 'edit';
  const lines = useMemo(() => buildL2BreakdownLines(quote), [quote]);

  const totalDisplay = formatIkasAmount(quote.totalIkas);
  const totalSubtitle = '+ network gas in iKAS';
  const hubPoints =
    quote.action === 'create' ? computeEarnedHubPoints(HUB_EARN_POINTS.crowdkasCampaignCreate, tier) : 0;
  const hubPointsDetail = quote.action === 'create' ? formatHubPointsTierLabel(tier) : undefined;

  return (
    <HubPaymentPanel
      title={isEdit ? 'L2 edit breakdown' : 'L2 calculation breakdown'}
      asideClassName={CROWDKAS_CALCULATION_ASIDE}
      lines={lines}
      totalLabel="Total to pay"
      totalDisplay={totalDisplay}
      totalSubtitle={totalSubtitle}
      tier={tier}
      krexBalance={krexBalance}
      discountNote={
        quote.discountIkas > 0
          ? `KREX discount: -${quote.discountIkas.toFixed(2)} iKAS (${quote.krexDiscountPercent}% off total).`
          : undefined
      }
      infoText={infoText}
      infoAccent="emerald"
      requirementsNote={requirementsNote}
      hubPoints={hubPoints}
      hubPointsDetail={hubPointsDetail}
      hubPointsBaseSpendKas={quote.subtotalIkas}
      showCurrentTierFootnote
      flowBusy={isSubmitting}
      flowPreset="hubPublish"
      footer={
        <>
          {onSubmit ? (
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitDisabled || isSubmitting}
              className="w-full k-control-btn !bg-emerald-600 !text-white !border-emerald-600 hover:!bg-emerald-700 dark:!bg-emerald-600 dark:hover:!bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? submittingLabel : submitLabel}
            </button>
          ) : null}
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="w-full k-control-btn disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelLabel}
            </button>
          ) : null}
          {onPreview ? (
            <button
              type="button"
              onClick={onPreview}
              disabled={isSubmitting}
              className="w-full k-control-btn disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {previewLabel}
            </button>
          ) : null}
        </>
      }
      alerts={
        error ? (
          <Alert type="error" compact region>
            {error}
          </Alert>
        ) : null
      }
    />
  );
}
