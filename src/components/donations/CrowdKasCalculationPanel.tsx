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
import { CROWDKAS_CALCULATION_ASIDE } from '@/components/donations/crowdkasFormTheme';
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
  submittingLabel = 'Creating…',
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
  submittingLabel?: string;
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
        asideClassName={CROWDKAS_CALCULATION_ASIDE}
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
                {isSubmitting ? submittingLabel : submitLabel}
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
  submittingLabel = 'Creating…',
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
  submittingLabel?: string;
  submitDisabled?: boolean;
  onPreview?: () => void;
  previewLabel?: string;
  error?: string | null;
}) {
  const formatIkasFee = (ikas: number) => (ikas <= 0 ? 'Free (+ gas)' : `${ikas} iKAS`);
  const isEdit = quote.action === 'edit';
  const l1ModuleLines = quote.l1ModuleLines ?? [];
  const l1ModulesFeeKas = quote.l1ModulesFeeKas ?? 0;

  const lines = useMemo(() => {
    const out: { label: string; value: string }[] = [
      {
        label: isEdit ? 'L2 metadata update' : 'L2 escrow deploy',
        value: 'Network gas in iKAS',
      },
    ];
    if (!isEdit && quote.baseFeeIkas > 0) {
      out.unshift({ label: 'Platform fee', value: formatIkasFee(quote.baseFeeIkas) });
    }
    for (const line of l1ModuleLines) {
      out.push({
        label: `${line.label} (L1 unlock)`,
        value: line.kas <= 0 ? 'Free' : `${line.kas} KAS`,
      });
    }
    if (l1ModulesFeeKas > 0) {
      out.push({ label: 'L1 modules subtotal', value: `${l1ModulesFeeKas} KAS` });
    }
    return out;
  }, [isEdit, l1ModuleLines, l1ModulesFeeKas, quote.baseFeeIkas]);

  const totalDisplay = isEdit
    ? l1ModulesFeeKas > 0
      ? `Gas in iKAS + ${l1ModulesFeeKas} KAS modules`
      : 'Gas in iKAS (see wallet)'
    : formatIkasFee(quote.totalIkas);

  return (
    <HubPaymentPanel
      title={isEdit ? 'L2 edit breakdown' : 'L2 calculation breakdown'}
      asideClassName={CROWDKAS_CALCULATION_ASIDE}
      lines={lines}
      totalLabel={isEdit ? 'What you pay' : 'Total to pay (iKAS)'}
      totalDisplay={totalDisplay}
      infoText={infoText}
      infoAccent="emerald"
      footer={
        <>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-3 text-xs text-zinc-600 dark:text-zinc-400">
            {isEdit
              ? 'The L2 update is nonpayable on-chain. Your wallet shows network gas in iKAS. New paid modules unlock on Kaspa L1 in KAS after you save.'
              : 'Paid modules (Featured, L1 Tip Jar) unlock separately on Kaspa L1 in KAS after your L2 campaign is live.'}
          </div>
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
