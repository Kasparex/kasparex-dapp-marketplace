'use client';

import { useState } from 'react';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { HubPaymentCurrencyDropdown } from '@/components/payments/HubPaymentCurrencyDropdown';
import { KREXBuyWizard } from '@/components/rewards/KREXBuyWizard';
import { KxAlertRegion } from '@/components/ui/KxAlertRegion';
import { Alert } from '@/components/Alert';
import { buildKasKrexMenuOptions, type KasKrexPaymentCurrency } from '@/lib/payments/hubPaymentTypes';
import { KREX_TIERS, type KREXTier } from '@/lib/rewards/types';
import type { CrowdKasL1PriceQuote, CrowdKasL2PriceQuote } from '@/lib/donations/pricing';

function formatKasFee(kas: number): string {
  return kas <= 0 ? 'Free' : `${kas} KAS`;
}

function formatIkasFee(ikas: number): string {
  return ikas <= 0 ? 'Free (+ gas)' : `${ikas} iKAS`;
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
  const [paymentCurrency, setPaymentCurrency] = useState<KasKrexPaymentCurrency>('KAS');
  const [isKrexWizardOpen, setIsKrexWizardOpen] = useState(false);
  const discountPercent = KREX_TIERS[tier].feeDiscountPercent;
  const hasKrexDiscount = discountPercent > 0;

  return (
    <>
      <aside className="flex flex-col bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-[0_10px_30px_-18px_rgba(16,185,129,0.4)]">
        <DAppSectionHeader title="L1 calculation breakdown" className="mb-1" />
        <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
          <div className="flex justify-between">
            <span>Covenant deploy fee</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatKasFee(quote.baseFeeKas)}</span>
          </div>
          {quote.krexDiscountPercent > 0 ? (
            <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
              <span>KREX tier discount</span>
              <span className="font-semibold">-{quote.krexDiscountPercent}%</span>
            </div>
          ) : null}
          {quote.moduleLines.map((line) => (
            <div key={line.id} className="flex justify-between gap-2">
              <span className="truncate">{line.label}</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 shrink-0">+{line.kas} KAS</span>
            </div>
          ))}
          {quote.modulesFeeKas > 0 ? (
            <div className="flex justify-between border-t border-zinc-200 dark:border-zinc-700 pt-1.5">
              <span>Modules subtotal</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{quote.modulesFeeKas} KAS</span>
            </div>
          ) : null}
          {quote.networkFeeBufferKas > 0 ? (
            <div className="flex justify-between">
              <span>Network buffer</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{quote.networkFeeBufferKas} KAS</span>
            </div>
          ) : null}
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-3">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Total to pay (KAS)</p>
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            {quote.totalKas <= 0 ? 'Free (+ gas)' : `${quote.totalKas} KAS`}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-3">
          <p className="mb-2 text-xs uppercase tracking-widest text-zinc-500">Pay with</p>
          <HubPaymentCurrencyDropdown
            value={paymentCurrency}
            onChange={setPaymentCurrency}
            options={buildKasKrexMenuOptions()}
            ariaLabel="L1 campaign fee currency"
          />
        </div>
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-3 text-sm text-zinc-700 dark:text-zinc-300">
          {infoText}
        </div>
        {hasKrexDiscount ? (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-800 dark:text-emerald-300">
            KREX discount: {discountPercent}% off paid module unlock fees ({KREX_TIERS[tier].label}).
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsKrexWizardOpen(true)}
            className="w-full k-control-btn !border-emerald-500/30 !text-emerald-700 dark:!text-emerald-300"
          >
            Buy KREX to unlock discount
          </button>
        )}
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
      </aside>
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
  quote: CrowdKasL2PriceQuote;
  infoText: string;
  isSubmitting?: boolean;
  onSubmit?: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
  onPreview?: () => void;
  previewLabel?: string;
  error?: string | null;
}) {
  return (
    <aside className="flex flex-col bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-[0_10px_30px_-18px_rgba(16,185,129,0.4)]">
      <DAppSectionHeader title="L2 calculation breakdown" className="mb-1" />
      <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
        <div className="flex justify-between">
          <span>Platform fee</span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatIkasFee(quote.baseFeeIkas)}</span>
        </div>
        <div className="flex justify-between">
          <span>Network gas</span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">Paid in iKAS</span>
        </div>
      </div>
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-3">
        <p className="text-xs uppercase tracking-widest text-zinc-500">Total to pay (iKAS)</p>
        <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{formatIkasFee(quote.totalIkas)}</p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Plus Igra network gas for the escrow transaction.</p>
      </div>
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-3">
        <p className="mb-1 text-xs uppercase tracking-widest text-zinc-500">Pay with</p>
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">iKAS on Igra Mainnet</p>
      </div>
      <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-3 text-sm text-zinc-700 dark:text-zinc-300">
        {infoText}
      </div>
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
    </aside>
  );
}
