'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AD_SLOTS } from '@/lib/ads/slots';
import { getActiveAdsForSlot } from '@/lib/ads/mockAds';
import { getAdsTreasuryL1Address, kasToSompi } from '@/lib/ads/config';
import type { AdSlotId, AdFormat } from '@/lib/ads/types';
import { useKasWare } from '@/hooks/useKasWare';
import { useAccount } from 'wagmi';

type Step = 'slot' | 'details' | 'payment' | 'confirm';

const DURATION_OPTIONS = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
];

interface CreateAdWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** Pre-select slot when opening from a "Take this spot" button */
  initialSlotId?: AdSlotId | null;
}

export function CreateAdWizard({ isOpen, onClose, onSuccess, initialSlotId = null }: CreateAdWizardProps) {
  const [step, setStep] = useState<Step>('slot');
  const [slotId, setSlotId] = useState<AdSlotId | null>(initialSlotId);
  const [imageUrl, setImageUrl] = useState('');
  const [link, setLink] = useState('');
  const [title, setTitle] = useState('');
  const [durationDays, setDurationDays] = useState(30);
  const [format, setFormat] = useState<AdFormat>('rectangle');
  const [paymentNetwork, setPaymentNetwork] = useState<'L1' | 'L2'>('L1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { isConnected: isL1Connected, sendTransaction: sendL1 } = useKasWare();
  const { isConnected: isL2Connected } = useAccount();

  const slotConfig = slotId ? AD_SLOTS.find((s) => s.id === slotId) : null;
  const priceKas = durationDays === 30 ? (slotConfig?.pricePer30Days ?? 1000) : (slotConfig ? slotConfig.pricePerDay * durationDays : 0);
  const sompi = kasToSompi(priceKas);
  const treasuryAddress = getAdsTreasuryL1Address();

  const canProceedSlot = slotId !== null;
  const slotActiveCount = slotId ? getActiveAdsForSlot(slotId).length : 0;
  const slotAvailable = slotConfig && slotActiveCount < slotConfig.maxAds;

  const canProceedDetails = Boolean(imageUrl.trim() && link.trim() && title.trim());
  const canProceedPayment = paymentNetwork === 'L1' ? isL1Connected : isL2Connected;

  useEffect(() => {
    if (isOpen) {
      setSlotId(initialSlotId ?? null);
      setStep(initialSlotId ? 'details' : 'slot');
      setImageUrl('');
      setLink('');
      setTitle('');
      setDurationDays(30);
      setFormat('rectangle');
      setPaymentNetwork('L1');
      setTxHash(null);
      setError(null);
    }
  }, [isOpen, initialSlotId]);

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handlePay = async () => {
    if (paymentNetwork === 'L2') {
      setError('L2 payments are coming soon. Please use L1 (Kaspa) for now.');
      return;
    }
    if (!isL1Connected || !sendL1) {
      setError('Connect your Kaspa (L1) wallet to pay.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const hash = await sendL1(treasuryAddress, sompi);
      setTxHash(hash);
      setStep('confirm');
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transaction failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const steps: { id: Step; label: string }[] = [
    { id: 'slot', label: 'Slot' },
    { id: 'details', label: 'Details' },
    { id: 'payment', label: 'Payment' },
    { id: 'confirm', label: 'Confirm' },
  ];
  const currentStepIndex = steps.findIndex((s) => s.id === step);

  const body = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-xl max-w-lg w-full border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Create ad</h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex gap-2 px-6 py-2 border-b border-zinc-100 dark:border-zinc-800">
          {steps.map((s, i) => (
            <div
              key={s.id}
              className={`h-1 flex-1 rounded-full ${
                i <= currentStepIndex ? 'bg-[#02abb8]' : 'bg-zinc-200 dark:bg-zinc-700'
              }`}
            />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 'slot' && (
            <>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">Choose an ad slot. Only slots with capacity are listed.</p>
              <div className="space-y-2">
                {AD_SLOTS.map((s) => {
                  const active = getActiveAdsForSlot(s.id).length;
                  const available = active < s.maxAds;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => available && setSlotId(s.id as AdSlotId)}
                      disabled={!available}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                        slotId === s.id
                          ? 'border-[#02abb8] bg-[#02abb8]/10 text-[#02abb8]'
                          : available
                            ? 'border-zinc-200 dark:border-zinc-700 hover:border-[#02abb8]/50'
                            : 'border-zinc-100 dark:border-zinc-800 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <span className="font-medium">{s.label}</span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 block mt-0.5">
                        {active}/{s.maxAds} · {s.pricePer30Days} KAS / 30 days
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 'details' && (
            <>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">Image URL, link, title, and duration.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Link (destination URL)</label>
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ad title"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Duration</label>
                  <div className="flex gap-2">
                    {DURATION_OPTIONS.map((d) => (
                      <button
                        key={d.days}
                        type="button"
                        onClick={() => setDurationDays(d.days)}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium ${
                          durationDays === d.days
                            ? 'border-[#02abb8] bg-[#02abb8]/10 text-[#02abb8]'
                            : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Format</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as AdFormat)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
                  >
                    <option value="square">Square</option>
                    <option value="rectangle">Rectangle</option>
                    <option value="tall">Tall</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {step === 'payment' && (
            <>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">Pay with L1 (KAS) or L2.</p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setPaymentNetwork('L1')}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                    paymentNetwork === 'L1'
                      ? 'border-[#02abb8] bg-[#02abb8]/10 text-[#02abb8]'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                  }`}
                >
                  <span className="font-medium">L1 Kaspa (KAS)</span>
                  <span className="text-xs block mt-0.5">{isL1Connected ? 'Wallet connected' : 'Connect Kaspa wallet'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentNetwork('L2')}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                    paymentNetwork === 'L2'
                      ? 'border-[#02abb8] bg-[#02abb8]/10 text-[#02abb8]'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                  }`}
                >
                  <span className="font-medium">L2 (EVM)</span>
                  <span className="text-xs block mt-0.5">Coming soon</span>
                </button>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-4">
                Total: <strong>{priceKas} KAS</strong> for {durationDays} days
              </p>
            </>
          )}

          {step === 'confirm' && (
            <>
              {txHash ? (
                <div className="text-center py-4">
                  <p className="text-[#02abb8] font-medium mb-2">Payment sent</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 break-all">{txHash}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-4">Your ad will appear after confirmation. You can manage it from Studio → My Ads.</p>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <p><span className="text-zinc-500 dark:text-zinc-400">Slot:</span> {slotConfig?.label}</p>
                  <p><span className="text-zinc-500 dark:text-zinc-400">Title:</span> {title}</p>
                  <p><span className="text-zinc-500 dark:text-zinc-400">Duration:</span> {durationDays} days</p>
                  <p><span className="text-zinc-500 dark:text-zinc-400">Amount:</span> <strong>{priceKas} KAS</strong></p>
                  <p><span className="text-zinc-500 dark:text-zinc-400">Network:</span> {paymentNetwork}</p>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
          {step === 'slot' && (
            <>
              <button type="button" onClick={handleClose} className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:underline text-sm">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep('details')}
                disabled={!canProceedSlot}
                className="px-4 py-2 rounded-lg bg-[#02abb8] text-white font-medium text-sm disabled:opacity-50"
              >
                Next
              </button>
            </>
          )}
          {step === 'details' && (
            <>
              <button type="button" onClick={() => setStep('slot')} className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:underline text-sm">
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep('payment')}
                disabled={!canProceedDetails}
                className="px-4 py-2 rounded-lg bg-[#02abb8] text-white font-medium text-sm disabled:opacity-50"
              >
                Next
              </button>
            </>
          )}
          {step === 'payment' && (
            <>
              <button type="button" onClick={() => setStep('details')} className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:underline text-sm">
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep('confirm')}
                disabled={!canProceedPayment}
                className="px-4 py-2 rounded-lg bg-[#02abb8] text-white font-medium text-sm disabled:opacity-50"
              >
                Review
              </button>
            </>
          )}
          {step === 'confirm' && !txHash && (
            <>
              <button type="button" onClick={() => setStep('payment')} disabled={isSubmitting} className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:underline text-sm">
                Back
              </button>
              <button
                type="button"
                onClick={handlePay}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-[#02abb8] text-white font-medium text-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Sending...' : `Pay ${priceKas} KAS`}
              </button>
            </>
          )}
          {step === 'confirm' && txHash && (
            <button type="button" onClick={handleClose} className="ml-auto px-4 py-2 rounded-lg bg-[#02abb8] text-white font-medium text-sm">
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(body, document.body);
}
