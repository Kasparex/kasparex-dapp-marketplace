'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AD_SLOTS, getSlotConfig, priceKasForDays } from '@/lib/ads/slots';
import { getAdsTreasuryL1Address, kasToSompi } from '@/lib/ads/config';
import { ADS_MIN_DURATION_DAYS, ADS_MAX_DURATION_DAYS } from '@/lib/ads/constants';
import { buildCampaignMetadataV1, type AdImageRef } from '@/lib/ads/metadata';
import { buildAdsBindingPayloadHex, buildAdsBindingPlainNote } from '@/lib/ads/payloadHex';
import type { AdSlotId, AdFormat } from '@/lib/ads/types';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { sendKaspaTransaction, detectKaspaWallets, KASPA_WALLET_PROVIDERS } from '@/lib/kaspa/wallet';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { KREX_TIER_SHOP_DISCOUNT_PCT } from '@/lib/game/diamond-veins-config';
import { KREX_TIERS } from '@/lib/rewards/types';
import { useAccount } from 'wagmi';
import { getIPFSClient } from '@/lib/ipfs/client';
import { useAdsRegistryContext } from '@/components/ads/AdsRegistryProvider';
import { countActiveForSlot } from '@/lib/ads/registryUtils';
import { AD_CREATIVE_SPECS, defaultFormatForSlot, validateUploadedImageFile } from '@/lib/ads/creativeSpecs';

type Step = 'connect' | 'slot' | 'details' | 'payment' | 'confirm';

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
  const [format, setFormat] = useState<AdFormat>('square');
  const [imageSpecError, setImageSpecError] = useState<string | null>(null);
  const [paymentNetwork, setPaymentNetwork] = useState<'L1' | 'L2'>('L1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [metadataCid, setMetadataCid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifyNote, setVerifyNote] = useState<string | null>(null);
  const [connectBusy, setConnectBusy] = useState(false);
  const ipfsFileInputRef = useRef<HTMLInputElement>(null);
  const wizardOpenRef = useRef(false);
  const lastPaymentSyncRef = useRef<{ txHash: string; metadataCid: string } | null>(null);

  const { state: kaspaState, connect: connectKaspa } = useKaspaWallet();
  const { isConnected: isL2Connected } = useAccount();
  const { ads, refresh: registryRefresh } = useAdsRegistryContext();
  const [syncAdsAfterPayment, setSyncAdsAfterPayment] = useState(false);
  const { tier: krexTier } = useKREXBalance();

  const l1Ready =
    kaspaState.isConnected && Boolean(kaspaState.address) && Boolean(kaspaState.provider);

  const slotConfig = slotId ? AD_SLOTS.find((s) => s.id === slotId) : null;
  const basePriceKas = slotConfig ? priceKasForDays(slotConfig, durationDays) : 0;
  const krexDiscountPct = KREX_TIER_SHOP_DISCOUNT_PCT[krexTier] ?? 0;
  const priceKas =
    basePriceKas > 0
      ? Number((basePriceKas * (1 - krexDiscountPct / 100)).toFixed(8))
      : 0;
  const sompi = kasToSompi(priceKas);
  const treasuryAddress = getAdsTreasuryL1Address();

  const canProceedSlot = slotId !== null;
  const slotActiveCount = slotId ? countActiveForSlot(ads, slotId) : 0;
  const slotAvailable = slotConfig && slotActiveCount < slotConfig.maxAds;

  const canProceedDetails = Boolean(
    (imageSource === 'url' ? imageUrl.trim() : imageFile) &&
      link.trim() &&
      title.trim() &&
      (imageSource !== 'file' || !imageSpecError)
  );
  const canProceedPayment = paymentNetwork === 'L1' ? l1Ready : isL2Connected;

  useEffect(() => {
    if (!isOpen) {
      wizardOpenRef.current = false;
      setSyncAdsAfterPayment(false);
      return;
    }

    const justOpened = !wizardOpenRef.current;
    wizardOpenRef.current = true;

    if (justOpened) {
      setSlotId(initialSlotId ?? null);
      setSlotIndex(initialSlotIndex);
      setImageUrl('');
      setImageFile(null);
      setImageSource('url');
      setLink('');
      setTitle('');
      setDurationDays(7);
      setFormat(initialSlotId ? defaultFormatForSlot(initialSlotId) : 'square');
      setImageSpecError(null);
      setPaymentNetwork('L1');
      setTxHash(null);
      setMetadataCid(null);
      setError(null);
      setVerifyNote(null);
      setSyncAdsAfterPayment(false);
      lastPaymentSyncRef.current = null;
      if (ipfsFileInputRef.current) ipfsFileInputRef.current.value = '';
      setStep(!kaspaState.isConnected ? 'connect' : initialSlotId ? 'details' : 'slot');
      return;
    }

    if (!kaspaState.isConnected) {
      setStep('connect');
      return;
    }
    setStep((prev) => (prev === 'connect' ? (initialSlotId ? 'details' : 'slot') : prev));
  }, [isOpen, initialSlotId, initialSlotIndex, kaspaState.isConnected]);

  const handleClose = () => {
    if (!isSubmitting) {
      setSyncAdsAfterPayment(false);
      onClose();
    }
  };

  const handleDone = async () => {
    if (isSubmitting) return;
    setSyncAdsAfterPayment(false);
    await registryRefresh({ silent: true });
    onClose();
  };

  useEffect(() => {
    if (!syncAdsAfterPayment) return;
    let cancelled = false;
    const run = async () => {
      await registryRefresh({ silent: true });
      for (let i = 0; i < 48 && !cancelled; i++) {
        if (cancelled) return;
        const sync = lastPaymentSyncRef.current;
        if (sync && i % 3 === 0) {
          try {
            await fetch('/api/ads/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ txHash: sync.txHash, metadataCid: sync.metadataCid }),
            });
          } catch {
            /* ignore — refresh still runs */
          }
        }
        await new Promise((r) => setTimeout(r, 2500));
        if (cancelled) return;
        await registryRefresh({ silent: true });
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [syncAdsAfterPayment, registryRefresh]);

  useEffect(() => {
    if (imageSource !== 'file' || !imageFile) {
      setImageSpecError(null);
      return;
    }
    let cancelled = false;
    void validateUploadedImageFile(imageFile, format).then((err) => {
      if (!cancelled) setImageSpecError(err);
    });
    return () => {
      cancelled = true;
    };
  }, [imageFile, format, imageSource]);

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
    if (!l1Ready || !kaspaState.provider || !kaspaState.address) {
      setError('Connect your Kaspa (L1) wallet to pay.');
      return;
    }
    if (!slotId || !slotConfig) {
      setError('Select a slot.');
      return;
    }
    let payerL1: string;
    try {
      payerL1 = normalizeKaspaAddress(kaspaState.address);
    } catch {
      setError('Invalid Kaspa wallet address.');
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
        payerL1,
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

      const txRes = await sendKaspaTransaction(kaspaState.provider as KaspaWalletProvider, {
        to: treasuryAddress,
        amount: String(sompi),
        note: plainNote,
        payload: payloadHex,
      });
      if (txRes.status === 'failed' || !txRes.txHash) {
        throw new Error(txRes.error ?? 'Transaction was rejected or failed');
      }
      const hash = extractKaspaTransactionId(txRes.txHash) ?? txRes.txHash;
      setTxHash(hash);
      lastPaymentSyncRef.current = { txHash: hash, metadataCid: cid };

      let verifyOk = false;
      let lastVerifyMessage: string | null = null;
      const maxVerifyAttempts = 10;
      for (let attempt = 0; attempt < maxVerifyAttempts; attempt++) {
        try {
          const vr = await fetch('/api/ads/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ txHash: hash, metadataCid: cid }),
          });
          const vj = (await vr.json()) as { ok?: boolean; error?: string };
          if (vj.ok) {
            verifyOk = true;
            lastVerifyMessage = null;
            break;
          }
          const msg = (vj.error ?? '').toLowerCase();
          const indexing = msg.includes('not found') || msg.includes('transaction not found');
          if (!indexing) {
            lastVerifyMessage =
              vj.error ??
              'If your wallet did not attach the metadata payload, this ad may not appear until the indexer sees the on-chain CID.';
            break;
          }
          lastVerifyMessage =
            attempt < maxVerifyAttempts - 1
              ? 'Waiting for the network indexer…'
              : 'Transaction not found after several tries. If payment succeeded, check KasWare or a block explorer; the Ads list updates within a few minutes.';
        } catch {
          lastVerifyMessage =
            attempt < maxVerifyAttempts - 1
              ? 'Waiting for verification…'
              : 'Could not reach the server to verify. Try refreshing the Ads page in a minute.';
        }
        if (verifyOk) break;
        if (attempt < maxVerifyAttempts - 1) {
          await new Promise((r) => setTimeout(r, 1400 + attempt * 400));
        }
      }
      setVerifyNote(lastVerifyMessage);

      setStep('confirm');
      onSuccess?.();
      setSyncAdsAfterPayment(true);
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

  const currentStepIndex = step === 'connect' ? -1 : steps.findIndex((s) => s.id === step);

  const handleWalletConnect = async (provider: KaspaWalletProvider) => {
    setConnectBusy(true);
    setError(null);
    try {
      await connectKaspa(provider);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connection failed');
    } finally {
      setConnectBusy(false);
    }
  };

  const installedKaspaWallets = typeof window !== 'undefined' ? detectKaspaWallets() : [];

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

        {step !== 'connect' && (
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
        )}

        <div className="flex-1 overflow-y-auto p-6">
          {step === 'connect' && (
            <>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                Connect a Kaspa (L1) wallet to reserve a slot, pin campaign metadata, and pay in KAS. This uses the same
                connection as the site header.
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-4">
                KREX balance across your connected wallets reduces the listed ad price (same tiers as Diamond Veins shop
                discounts).
              </p>
              {installedKaspaWallets.length > 0 ? (
                <div className="space-y-2">
                  {installedKaspaWallets.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      disabled={connectBusy}
                      onClick={() => void handleWalletConnect(w.id)}
                      className="w-full text-left px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-[#02abb8]/60 hover:bg-[#02abb8]/5 transition-colors disabled:opacity-50"
                    >
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">Connect {w.name}</span>
                      <span className="text-xs text-zinc-500 block mt-0.5">Detected in this browser</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 bg-zinc-50 dark:bg-zinc-800/80">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                    No Kaspa wallet detected. Install KasWare (or another supported wallet) to continue.
                  </p>
                  <a
                    href={KASPA_WALLET_PROVIDERS.kasware.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#02abb8] hover:underline"
                  >
                    Get KasWare
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}
            </>
          )}
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
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Format</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as AdFormat)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm mb-3"
                  >
                    <option value="square">Square (1:1)</option>
                    <option value="rectangle">Rectangle (banner)</option>
                    <option value="tall">Tall (3:4)</option>
                  </select>
                  <CreativeRequirementsCallout format={format} />
                </div>
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
                    <div>
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
                      />
                      <p className="mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-500">
                        Use a direct image URL that meets the minimum size for the format above.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="flex cursor-pointer flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-[#02abb8]/35 bg-gradient-to-br from-[#02abb8]/10 via-transparent to-cyan-500/5 px-4 py-7 transition-all hover:border-[#02abb8]/55 hover:from-[#02abb8]/15 dark:from-[#02abb8]/14 dark:to-cyan-950/25 dark:hover:from-[#02abb8]/20">
                        <input
                          ref={ipfsFileInputRef}
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                        />
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#02abb8]/15 text-[#02abb8] ring-2 ring-[#02abb8]/10 dark:bg-[#02abb8]/25 dark:ring-[#02abb8]/20">
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div className="text-center">
                          <span className="block text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                            Drop an image or click to browse
                          </span>
                          <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
                            PNG, JPG, or WebP — pinned to IPFS when you pay
                          </span>
                        </div>
                      </label>
                      {imageFile ? (
                        <div className="flex items-center justify-between gap-2 rounded-lg border border-[#02abb8]/25 bg-[#02abb8]/5 px-3 py-2 dark:border-[#02abb8]/30 dark:bg-[#02abb8]/10">
                          <p className="min-w-0 flex-1 truncate text-xs font-medium text-[#02abb8]" title={imageFile.name}>
                            {imageFile.name}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setImageFile(null);
                              if (ipfsFileInputRef.current) ipfsFileInputRef.current.value = '';
                            }}
                            className="flex-shrink-0 text-[11px] font-bold uppercase tracking-wide text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                          >
                            Clear
                          </button>
                        </div>
                      ) : null}
                    </div>
                  )}
                  {imageSource === 'file' && imageSpecError && (
                    <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">{imageSpecError}</p>
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
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 space-y-1">
                    <span className="block">
                      {krexDiscountPct > 0 && (
                        <span className="text-zinc-400 dark:text-zinc-500 line-through mr-2">{basePriceKas} KAS</span>
                      )}
                      <strong className="text-[#02abb8]">{priceKas} KAS</strong>
                      <span className="text-zinc-500">
                        {' '}
                        ({durationDays} × {slotConfig?.pricePerDay ?? 0} KAS/day)
                      </span>
                    </span>
                    {krexDiscountPct > 0 && (
                      <span className="block text-[#02abb8]/90 font-medium">
                        {krexDiscountPct}% KREX holder discount · {KREX_TIERS[krexTier]?.label ?? krexTier}
                      </span>
                    )}
                  </p>
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
                  <span
                    className={`text-xs block mt-0.5 ${
                      l1Ready ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {l1Ready
                      ? `Connected · ${kaspaState.address?.replace(/^kaspa:/, '').slice(0, 10)}…${kaspaState.address?.replace(/^kaspa:/, '').slice(-6)}`
                      : 'Use “Connect wallet” on this screen first, or connect from the site header'}
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
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-4 space-y-1">
                {krexDiscountPct > 0 && (
                  <p className="line-through opacity-70">List price: {basePriceKas} KAS</p>
                )}
                <p>
                  You pay: <strong className="text-zinc-900 dark:text-zinc-100">{priceKas} KAS</strong> for{' '}
                  {durationDays} day{durationDays !== 1 ? 's' : ''}
                  {krexDiscountPct > 0 ? ` (${krexDiscountPct}% KREX tier off)` : ''}
                </p>
              </div>
            </>
          )}

          {step === 'confirm' && (
            <>
              {txHash ? (
                <div className="text-center py-4">
                  <p className="text-[#02abb8] font-medium mb-2">Payment sent</p>
                  <p className="text-xs font-mono text-zinc-600 dark:text-zinc-300 break-all">
                    {extractKaspaTransactionId(txHash) ?? 'Open your wallet history to copy the transaction id.'}
                  </p>
                  {metadataCid && (
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-500 mt-2 break-all">Metadata: {metadataCid}</p>
                  )}
                  {verifyNote && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 mt-3 text-left">{verifyNote}</p>
                  )}
                  <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-3 text-left">
                    KasWare may label the payload as unsupported in the decode view; the transaction still carries the
                    Kasparex binding the site reads from the public indexer.
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-4">
                    Your ad appears in the public list once the indexer picks up the transaction (usually within a couple
                    of minutes). Campaigns older than the indexer lookback may not be listed—see Ads overview.
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
          {step === 'connect' && (
            <>
              <button
                type="button"
                onClick={handleClose}
                disabled={connectBusy}
                className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:underline text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-500 text-right max-w-[200px]">
                After you approve in your wallet, this wizard continues automatically.
              </span>
            </>
          )}
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
              onClick={() => void handleDone()}
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

function CreativeRequirementsCallout({ format }: { format: AdFormat }) {
  const spec = AD_CREATIVE_SPECS[format];
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 text-left dark:border-zinc-700 dark:bg-zinc-800/50">
      <p className="text-[11px] font-bold uppercase tracking-wide text-[#02abb8]">{spec.title}</p>
      <ul className="mt-2 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
        <li>
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Aspect: </span>
          {spec.aspectRatioLabel}
        </li>
        <li>
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Minimum size: </span>
          {spec.minWidth}×{spec.minHeight}px
        </li>
        <li>
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Recommended: </span>
          {spec.recommendedWidth}×{spec.recommendedHeight}px
        </li>
        <li>
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Max upload: </span>
          {spec.maxFileSizeMb} MB (PNG, JPG, WebP)
        </li>
        {spec.notes.map((n, i) => (
          <li key={i} className="text-zinc-500 dark:text-zinc-500">
            · {n}
          </li>
        ))}
      </ul>
    </div>
  );
}
