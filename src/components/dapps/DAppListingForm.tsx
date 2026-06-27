'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { categories, type Category } from '@/lib/categories';
import { KxSegmentToggle } from '@/components/ui/KxSegmentToggle';
import { KxFilterDropdown } from '@/components/ui/KxFilterDropdown';
import { useDAppListingPayment } from '@/hooks/useDAppListingPayment';
import {
  DAPP_LISTING_FEE_KAS,
  saveDAppListingSubmission,
} from '@/lib/dapps/listingSubmissions';
import {
  STORE_PAYMENT_CURRENCIES,
  kasToKrexAmount,
  type StorePaymentCurrency,
} from '@/lib/store/currencies';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { appendHubActivityEarn } from '@/lib/rewards/appendHubActivityEarn';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';

const LISTING_CATEGORIES = categories.filter((c) => c.id !== 'all');

type DAppListingFormProps = {
  onSubmitted?: () => void;
};

export function DAppListingForm({ onSubmitted }: DAppListingFormProps) {
  const router = useRouter();
  const { state } = useKaspaWallet();
  const { payListingFee, isProcessing, error, setError } = useDAppListingPayment();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('general');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [paymentCurrency, setPaymentCurrency] = useState<StorePaymentCurrency>('KAS');
  const [step, setStep] = useState<'form' | 'payment' | 'complete'>('form');

  const feeLabel = useMemo(() => {
    if (paymentCurrency === 'KREX') {
      return `${kasToKrexAmount(DAPP_LISTING_FEE_KAS).toLocaleString(undefined, { maximumFractionDigits: 2 })} KREX`;
    }
    return `${DAPP_LISTING_FEE_KAS} KAS`;
  }, [paymentCurrency]);

  const canSubmit = Boolean(
    state.isConnected &&
      name.trim() &&
      description.trim() &&
      !isProcessing,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !state.address) return;

    setError(null);
    setStep('payment');

    try {
      const feeTxHash = await payListingFee(paymentCurrency);

      saveDAppListingSubmission({
        name: name.trim(),
        category,
        description: description.trim(),
        websiteUrl: websiteUrl.trim(),
        contactEmail: contactEmail.trim(),
        paymentCurrency,
        feeAmountKAS: DAPP_LISTING_FEE_KAS,
        feeTxHash,
        submitterAddress: state.address,
      });

      const txNorm = extractKaspaTransactionId(feeTxHash) ?? feeTxHash;
      appendHubActivityEarn({
        walletRaw: state.address,
        source: 'dapp_directory_list',
        redeemableDelta: HUB_EARN_POINTS.dappDirectoryList,
        idempotencyKey: `dapps:listing:${txNorm}`,
        meta: { name: name.trim() },
      });

      setStep('complete');
      onSubmitted?.();
      setTimeout(() => router.replace('/dapps/dashboard?tab=listings'), 2000);
    } catch {
      setStep('form');
    }
  };

  if (step === 'payment') {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-6" />
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">
          Processing listing payment...
        </p>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">✓</div>
        <p className="text-zinc-900 dark:text-zinc-100 font-black uppercase tracking-widest">
          Listing submitted
        </p>
        <p className="text-sm text-zinc-500 mt-2">Redirecting to your listings...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 p-4 mb-2">
        <p className="text-[11px] font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider mb-1">
          Promotional directory listing
        </p>
        <p className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed">
          Paid listings appear as informational/promotional entries in the Kasparex dApp directory. They are not
          fully integrated Kasparex dApps. A proper editor with token connection will come later.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-8">
        <div className="space-y-6">
          <div className="k-form-group">
            <label className="k-label">dApp name *</label>
            <input
              type="text"
              className="k-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your dApp name"
              required
            />
          </div>

          <div className="k-form-group">
            <label className="k-label">Category *</label>
            <KxFilterDropdown
              value={category}
              onChange={(value) => setCategory(value as Category)}
              options={LISTING_CATEGORIES.map((c) => ({
                value: c.id,
                label: `${c.emoji} ${c.name}`,
              }))}
              ariaLabel="dApp category"
              triggerClassName="k-control-btn w-full min-w-0"
              menuClassName="w-full min-w-[12rem]"
            />
          </div>

          <div className="k-form-group">
            <label className="k-label">Description *</label>
            <textarea
              className="k-textarea min-h-[120px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your dApp for the directory listing"
              required
            />
          </div>

          <div className="k-form-group">
            <label className="k-label">Website URL</label>
            <input
              type="url"
              className="k-input"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://"
            />
          </div>

          <div className="k-form-group">
            <label className="k-label">Contact email</label>
            <input
              type="email"
              className="k-input"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
        </div>

        <aside className="xl:sticky xl:top-6 h-fit space-y-4">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-5">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100 mb-4">
              Listing fee
            </h3>
            <div className="k-form-group mb-4">
              <label className="k-label">Pay with *</label>
              <KxSegmentToggle
                value={paymentCurrency}
                onChange={setPaymentCurrency}
                options={STORE_PAYMENT_CURRENCIES.map((cur) => ({ value: cur, label: cur }))}
                ariaLabel="Listing fee currency"
              />
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              One-time directory fee:{' '}
              <span className="font-black text-[#02abb8]">{feeLabel}</span>
            </p>
            <p className="text-xs text-zinc-500 mt-2">
              Paid to the Kasparex treasury when you submit. Equivalent to {DAPP_LISTING_FEE_KAS} KAS.
            </p>
          </div>

          {error ? (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-800 dark:text-red-300">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full k-cta-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : `Submit listing (${feeLabel})`}
          </button>
        </aside>
      </div>
    </form>
  );
}
