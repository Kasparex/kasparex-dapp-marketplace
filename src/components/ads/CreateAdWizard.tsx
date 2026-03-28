'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AD_SLOTS, getSlotConfig, priceKasForDays } from '@/lib/ads/slots';
import { getAdsTreasuryL1Address, kasToSompi } from '@/lib/ads/config';
import { ADS_MIN_DURATION_DAYS, ADS_MAX_DURATION_DAYS } from '@/lib/ads/constants';
import { buildCampaignMetadataV1, type AdImageRef } from '@/lib/ads/metadata';
import { buildAdsBindingPayloadHex, buildAdsBindingPlainNote } from '@/lib/ads/payloadHex';
import type { AdSlotId, AdFormat } from '@/lib/ads/types';
import { useKasWare } from '@/hooks/useKasWare';
import { useAccount } from 'wagmi';
import { getIPFSClient } from '@/lib/ipfs/client';
import { useAdsRegistryContext } from '@/components/ads/AdsRegistryProvider';
import { countActiveForSlot } from '@/lib/ads/registryUtils';

type Step = 'slot' | 'details' | 'payment' | 'confirm';

interface CreateAdWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialSlotId?: AdSlotId | null;
  initialSlotIndex?: number;
}

export function CreateAdWizard({
  isOpen,
  onClose,
  onSuccess,
  initialSlotId = null,
  initialSlotIndex = 0,
}: CreateAdWizardProps) {
  const [step, setStep] = useState<Step>('slot');
  const [slotId, setSlotId] = useState<AdSlotId | null>(initialSlotId ?? null);
  const [slotIndex, setSlotIndex] = useState(initialSlotIndex);
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageSource, setImageSource] = useState<'url' | 'file'>('url');
  const [link, setLink] = useState('');
  const [title, setTitle] = useState('');
  const [durationDays, setDurationDays] = useState(7);
  const [format, setFormat] = useState<AdFormat>('rectangle');
  const [paymentNetwork, setPaymentNetwork] = useState<'L1' | 'L2'>('L1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [metadataCid, setMetadataCid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifyNote, setVerifyNote] = useState<string | null>(null);

  const { isConnected: isL1Connected, sendTransaction: sendL1, address: l1Address } = useKasWare();
  const { isConnected: isL2Connected } = useAccount();
  const { ads } = useAdsRegistryContext();

  const slotConfig = slotId ? AD_SLOTS.find((s) => s.id === slotId) : null;
  const priceKas = slotConfig ? priceKasForDays(slotConfig, durationDays) : 0;
  const sompi = kasToSompi(priceKas);
  const treasuryAddress = getAdsTreasuryL1Address();

  const canProceedSlot = slotId !== null;
  const slotActiveCount = slotId ? countActiveForSlot(ads, slotId) : 0;
  const slotAvailable = slotConfig && slotActiveCount < slotConfig.maxAds;

  const canProceedDetails = Boolean(
    (imageSource === 'url' ? imageUrl.trim() : imageFile) && link.trim() && title.trim()
  );
  const canProceedPayment = paymentNetwork === 'L1' ? isL1Connected : isL2Connected;

  useEffect(() => {
    if (isOpen) {
      const hasSlot = Boolean(initialSlotId);
      setSlotId(initialSlotId ?? null);
      setSlotIndex(initialSlotIndex);
      setStep(hasSlot ? 'details' : 'slot');
      setImageUrl('');
      setImageFile(null);
      setImageSource('url');
      setLink('');
      setTitle('');
      setDurationDays(7);
      setFormat('rectangle');
      setPaymentNetwork('L1');
      setTxHash(null);
      setMetadataCid(null);
      setError(null);
      setVerifyNote(null);
    }
  }, [isOpen, initialSlotId, initialSlotIndex]);

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const buildImageRef = async (): Promise<AdImageRef> => {
    if (imageSource === 'url') {
      return { type: 'url', value: imageUrl.trim() };
    }
    if (!imageFile) throw new Error('Choose an image file');
    const client = getIPFSClient();
    const hash = await client.uploadFile(imageFile, { filename: imageFile.name });
    return { type: 'ipfs', value: hash };
  };

  const handlePay = async () => {
    if (paymentNetwork === 'L2') {
      setError('L2 ad payments are planned for a later phase. Please use L1 (Kaspa) for now.');
      return;
    }
    if (!isL1Connected || !sendL1 || !l1Address) {
      setError('Connect your Kaspa (L1) wallet to pay.');
      return;
    }
    if (!slotId || !slotConfig) {
      setError('Select a slot.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setVerifyNote(null);
    try {
      const image = await buildImageRef();
      const meta = buildCampaignMetadataV1({
        slotId,
        slotIndex,
        days: durationDays,
        priceKas,
        payerL1: l1Address,
        title: title.trim(),
        link: link.trim(),
        image,
        format,
      });

      const client = getIPFSClient();
      const cid = await client.uploadJSON(meta as unknown as Record<string, unknown>, {
        filename: `kasparex-ad-${slotId}-${Date.now()}.json`,
      });
      setMetadataCid(cid);

      const payloadHex = buildAdsBindingPayloadHex(cid);
      const plainNote = buildAdsBindingPlainNote(cid);

      const hash = await sendL1(treasuryAddress, sompi, {
        payload: payloadHex,
        note: plainNote,
      });
      setTxHash(hash);

      try {
        const vr = await fetch('/api/ads/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ txHash: hash, metadataCid: cid }),
        });
        const vj = (await vr.json()) as { ok?: boolean; error?: string };
        if (vj.ok) {
          setVerifyNote(null);
        } else {
          setVerifyNote(
            vj.error ??
              'If your wallet did not attach the metadata payload, this ad may not appear in the public list until the indexer sees an on-chain CID.'
          );
        }
      } catch {
        setVerifyNote(
          'Could not verify yet; the transaction may still be indexing. If the wallet attached the payload, your ad should appear after the next registry refresh.'
        );
      }

      setStep('confirm');
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transaction failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps: { id: Step; label: string }[] = useMemo(
    () => [
      { id: 'slot', label: 'Slot' },
      { id: 'details', label: 'Details' },
      { id: 'payment', label: 'Payment' },
      { id: 'confirm', label: 'Confirm' },
    ],
    []
  );

  if (!isOpen) return null;

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
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Choose an ad slot. Only slots with capacity are listed.
              </p>
              <div className="space-y-2">
                {AD_SLOTS.map((s) => {
                  const active = countActiveForSlot(ads, s.id);
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
                        {active}/{s.maxAds} · {s.pricePerDay} KAS/day
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-4">
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Cell index (0–{Math.max(0, (getSlotConfig(slotId ?? '')?.maxAds ?? 1) - 1)})
                </label>
                <input
                  type="number"
                  min={0}
                  max={Math.max(0, (getSlotConfig(slotId ?? '')?.maxAds ?? 1) - 1)}
                  value={slotIndex}
                  onChange={(e) => {
                    const maxI = Math.max(0, (getSlotConfig(slotId ?? '')?.maxAds ?? 1) - 1);
                    const n = parseInt(e.target.value, 10);
                    if (Number.isNaN(n)) return;
                    setSlotIndex(Math.min(maxI, Math.max(0, n)));
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                  disabled={!slotId}
                />
              </div>
            </>
          )}

          {step === 'details' && (
            <>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Creative, link, title, duration ({ADS_MIN_DURATION_DAYS}–{ADS_MAX_DURATION_DAYS} days). Price updates
                automatically.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Image</label>
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setImageSource('url')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                        imageSource === 'url'
                          ? 'border-[#02abb8] bg-[#02abb8]/10 text-[#02abb8]'
                          : 'border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      Image URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageSource('file')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                        imageSource === 'file'
                          ? 'border-[#02abb8] bg-[#02abb8]/10 text-[#02abb8]'
                          : 'border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      Upload (IPFS)
                    </button>
                  </div>
                  {imageSource === 'url' ? (
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
                    />
                  ) : (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                      className="w-full text-sm text-zinc-600 dark:text-zinc-400"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                    Link (destination URL)
                  </label>
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
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                    Duration (days)
                  </label>
                  <input
                    type="number"
                    min={ADS_MIN_DURATION_DAYS}
                    max={ADS_MAX_DURATION_DAYS}
                    value={durationDays}
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10);
                      if (Number.isNaN(n)) return;
                      setDurationDays(Math.min(ADS_MAX_DURATION_DAYS, Math.max(ADS_MIN_DURATION_DAYS, n)));
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Total: <strong className="text-[#02abb8]">{priceKas} KAS</strong> ({durationDays} ×{' '}
                    {slotConfig?.pricePerDay ?? 0} KAS/day)
                  </p>
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
                {initialSlotId && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Slot: <strong>{slotConfig?.label}</strong> · cell #{slotIndex}
                  </p>
                )}
              </div>
            </>
          )}

          {step === 'payment' && (
            <>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Pay with L1 (KAS). L2 is reserved for a future release.
              </p>
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
                  <span className="text-xs block mt-0.5">
                    {isL1Connected ? 'Wallet connected' : 'Connect Kaspa wallet'}
                  </span>
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
                  <span className="text-xs block mt-0.5 text-zinc-500">Phase 2 — not available yet</span>
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
                  {metadataCid && (
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-500 mt-2 break-all">Metadata: {metadataCid}</p>
                  )}
                  {verifyNote && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 mt-3 text-left">{verifyNote}</p>
                  )}
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-4">
                    Your ad appears in the public list once the transaction includes the Kasparex metadata payload and the
                    indexer refreshes (about 2 minutes). Campaigns older than the indexer lookback may not be listed—see
                    Ads overview.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <p>
                    <span className="text-zinc-500 dark:text-zinc-400">Slot:</span> {slotConfig?.label}
                  </p>
                  <p>
                    <span className="text-zinc-500 dark:text-zinc-400">Cell:</span> #{slotIndex}
                  </p>
                  <p>
                    <span className="text-zinc-500 dark:text-zinc-400">Title:</span> {title}
                  </p>
                  <p>
                    <span className="text-zinc-500 dark:text-zinc-400">Duration:</span> {durationDays} days
                  </p>
                  <p>
                    <span className="text-zinc-500 dark:text-zinc-400">Amount:</span> <strong>{priceKas} KAS</strong>
                  </p>
                  <p>
                    <span className="text-zinc-500 dark:text-zinc-400">Network:</span> {paymentNetwork}
                  </p>
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
                disabled={!canProceedSlot || !slotAvailable}
                className="px-4 py-2 rounded-lg bg-[#02abb8] text-white font-medium text-sm disabled:opacity-50"
              >
                Next
              </button>
            </>
          )}
          {step === 'details' && (
            <>
              <button
                type="button"
                onClick={() => (initialSlotId ? handleClose() : setStep('slot'))}
                className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:underline text-sm"
              >
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
              <button
                type="button"
                onClick={() => setStep('details')}
                className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:underline text-sm"
              >
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
              <button
                type="button"
                onClick={() => setStep('payment')}
                disabled={isSubmitting}
                className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:underline text-sm"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handlePay}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-[#02abb8] text-white font-medium text-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Sending…' : `Pay ${priceKas} KAS`}
              </button>
            </>
          )}
          {step === 'confirm' && txHash && (
            <button
              type="button"
              onClick={handleClose}
              className="ml-auto px-4 py-2 rounded-lg bg-[#02abb8] text-white font-medium text-sm"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(body, document.body);
}
