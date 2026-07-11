'use client';

import { useMemo, useState } from 'react';
import { HubPaymentPanel } from '@/components/payments/HubPaymentPanel';
import { KREXBuyWizard } from '@/components/rewards/KREXBuyWizard';
import { KxAlertRegion } from '@/components/ui/KxAlertRegion';
import { Alert } from '@/components/Alert';
import { buildKasKrexCurrencyOptions, formatHubPaymentAmount } from '@/lib/payments/hubPaymentTypes';
import { usePricingSnapshot } from '@/hooks/usePricingSnapshot';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { KREX_TIERS, type KREXTier } from '@/lib/rewards/types';
import type { CrowdKasL1PriceQuote } from '@/lib/donations/pricing';
import type { StorePaymentCurrency } from '@/lib/store/currencies';

function formatLineAmount(kas: number, currencyId: StorePaymentCurrency, snapshot: ReturnType<typeof usePricingSnapshot>['snapshot']) {
  const currency = buildKasKrexCurrencyOptions().find((c) => c.id === currencyId) ?? buildKasKrexCurrencyOptions()[0];
  if (kas <= 0) return 'Free';
  return formatHubPaymentAmount(currency, kas, { snapshot });
}

export function CrowdKasL1CalculationPanel({
  quote,
  tier,
  infoText,
  isSubmitting = false,
  onSubmit,
  submitLabel = 'Create campaign',
  submitDisabled = false,
  onPreview,
  previewLabel = 'Preview campaign',
  error,
}: {
  quote: CrowdKasL1PriceQuote;
  tier: KREXTier;
  infoText: string;
  isSubmitting?: boolean;
  onSubmit?: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
  onPreview?: () => void;
  previewLabel?: string;
  error?: string | null;
}) {
  const [paymentCurrency, setPaymentCurrency] = useState<StorePaymentCurrency>('KAS');
  const [isKrexWizardOpen, setIsKrexWizardOpen] = useState(false);
  const { balance: krexBalance } = useKREXBalance();
  const { snapshot: pricingSnapshot } = usePricingSnapshot(['KREX']);
  const discountPercent = KREX_TIERS[tier].feeDiscountPercent;
  const hasKrexDiscount = discountPercent > 0;
  const selectedCurrency =
    buildKasKrexCurrencyOptions().find((c) => c.id === paymentCurrency) ?? buildKasKrexCurrencyOptions()[0];

  const lines = useMemo(() => {
    const out = [
      { label: 'Covenant deploy fee', value: formatLineAmount(quote.baseFeeKas, paymentCurrency, pricingSnapshot) },
    ];
    if (quote.krexDiscountPercent > 0) {
      out.push({ label: 'KREX tier discount', value: `-${quote.krexDiscountPercent}%` });
    }
    if (quote.payoutSplitAddonKas > 0) {
      out.push({
        label: 'Extra payout recipients',
        value: formatLineAmount(quote.payoutSplitAddonKas, paymentCurrency, pricingSnapshot),
      });
    }
    for (const line of quote.moduleLines) {
      out.push({
        label: line.label,
        value: formatLineAmount(line.kas, paymentCurrency, pricingSnapshot),
      });
    }
    if (quote.modulesFeeKas > 0) {
      out.push({
        label: 'Modules subtotal',
        value: formatLineAmount(quote.modulesFeeKas, paymentCurrency, pricingSnapshot),
      });
    }
    if (quote.networkFeeBufferKas > 0) {
      out.push({
        label: 'Network buffer',
        value: formatLineAmount(quote.networkFeeBufferKas, paymentCurrency, pricingSnapshot),
      });
    }
    return out;
  }, [paymentCurrency, pricingSnapshot, quote]);

  const totalDisplay =
    quote.totalKas <= 0
      ? 'Free (+ gas)'
      : formatHubPaymentAmount(selectedCurrency, quote.totalKas, { snapshot: pricingSnapshot });

  return (
    <>
      <HubPaymentPanel
        title="L1 calculation breakdown"
        lines={lines}
        totalLabel="Total to pay"
        totalDisplay={totalDisplay}
        currencies={buildKasKrexCurrencyOptions()}
        selectedCurrencyId={paymentCurrency}
        onCurrencyChange={(id) => setPaymentCurrency(id as StorePaymentCurrency)}
        tier={tier}
        krexBalance={krexBalance}
        discountNote={
          hasKrexDiscount
            ? `KREX discount: ${discountPercent}% off covenant deploy and module fees (${KREX_TIERS[tier].label}).`
            : undefined
        }
        infoText={infoText}
        infoAccent="emerald"
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
                {isSubmitting ? 'Creating…' : submitLabel}
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
            <KxAlertRegion>
              {error ? (
                <Alert type="error" compact region>
                  <p>{error}</p>
                </Alert>
              ) : null}
            </KxAlertRegion>
          </>
        }
      />
      <KREXBuyWizard isOpen={isKrexWizardOpen} onClose={() => setIsKrexWizardOpen(false)} />
    </>
  );
}

export function CrowdKasL2CalculationPanel({
  quote,
  infoText,
  isSubmitting = false,
  onSubmit,
  submitLabel = 'Create campaign',
  submitDisabled = false,
  onPreview,
  previewLabel = 'Preview campaign',
  error,
}: {
  quote: import('@/lib/donations/pricing').CrowdKasL2PriceQuote;
  infoText: string;
  isSubmitting?: boolean;
  onSubmit?: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
  onPreview?: () => void;
  previewLabel?: string;
  error?: string | null;
}) {
  const formatIkasFee = (ikas: number) => (ikas <= 0 ? 'Free (+ gas)' : `${ikas} iKAS`);

  return (
    <HubPaymentPanel
      title="L2 calculation breakdown"
      lines={[
        { label: 'Platform fee', value: formatIkasFee(quote.baseFeeIkas) },
        { label: 'Network gas', value: 'Paid in iKAS' },
      ]}
      totalLabel="Total to pay (iKAS)"
      totalDisplay={formatIkasFee(quote.totalIkas)}
      infoText={infoText}
      infoAccent="emerald"
      footer={
        <>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-3 text-xs text-zinc-600 dark:text-zinc-400">
            Paid modules (Featured, L1 Tip Jar) unlock separately on Kaspa L1 in KAS after your L2 campaign is live.
          </div>
          {onSubmit ? (
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitDisabled || isSubmitting}
              className="w-full k-control-btn !bg-emerald-600 !text-white !border-emerald-600 hover:!bg-emerald-700 dark:!bg-emerald-600 dark:hover:!bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating…' : submitLabel}
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
          <KxAlertRegion>
            {error ? (
              <Alert type="error" compact region>
                <p>{error}</p>
              </Alert>
            ) : null}
          </KxAlertRegion>
        </>
      }
    />
  );
}
