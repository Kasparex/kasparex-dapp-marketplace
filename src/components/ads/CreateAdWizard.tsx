'use client';

import { useState, useEffect, useMemo, useRef, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AD_SLOTS, getSlotConfig, priceKasForDays } from '@/lib/ads/slots';
import { getAdsTreasuryL1Address, kasToSompi } from '@/lib/ads/config';
import {
  ADS_MIN_DURATION_DAYS,
  ADS_MAX_DURATION_DAYS,
  ADS_FEATURED_HIGHLIGHT_KAS,
  ADS_MAX_PROMO_TOOLTIP_CHARS,
} from '@/lib/ads/constants';
import { buildCampaignMetadataV1, type AdImageRef } from '@/lib/ads/metadata';
import { buildAdsBindingPayloadHex, buildAdsBindingPlainNote } from '@/lib/ads/payloadHex';
import type { AdSlotId, AdFormat, AdEntry } from '@/lib/ads/types';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { sendKaspaTransaction, detectKaspaWallets, KASPA_WALLET_PROVIDERS } from '@/lib/kaspa/wallet';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { KREX_TIER_SHOP_DISCOUNT_PCT } from '@/lib/game/diamond-veins-config';
import { KREX_TIERS } from '@/lib/rewards/types';
import { getIPFSClient } from '@/lib/ipfs/client';
import { useAdsRegistryContext } from '@/components/ads/AdsRegistryProvider';
import { countActiveForSlot, filterActiveAdsForSlot } from '@/lib/ads/registryUtils';
import { defaultFormatForSlot, validateUploadedImageFile } from '@/lib/ads/creativeSpecs';

function ModalSectionTitle({
  children,
  className,
  required,
}: {
  children: ReactNode;
  className?: string;
  /** Shows a red asterisk after the title for required fields. */
  required?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 mb-2 ${className ?? ''}`}>
      <span
        className="h-5 w-1 shrink-0 rounded-full bg-[#02abb8] shadow-[0_0_10px_rgba(2,171,184,0.35)] -skew-y-12"
        aria-hidden
      />
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300 inline-flex items-baseline gap-1 flex-wrap">
        <span>{children}</span>
        {required ? (
          <span className="text-red-500 dark:text-red-400 font-bold normal-case" aria-hidden title="Required">
            *
          </span>
        ) : null}
      </p>
    </div>
  );
}

function resolveInitialSlotId(initial: AdSlotId | null | undefined, adsList: AdEntry[]): AdSlotId | null {
  const normalized =
    initial === 'GAMES_PLAY_RAIL_RIGHT' ? ('HALO_GAMES_RIGHT' as AdSlotId) : initial;
  if (normalized) {
    const cfg = AD_SLOTS.find((s) => s.id === normalized);
    if (cfg && countActiveForSlot(adsList, normalized) < cfg.maxAds) return normalized;
  }
  const first = AD_SLOTS.find((s) => countActiveForSlot(adsList, s.id) < s.maxAds);
  return first ? (first.id as AdSlotId) : null;
}

type Phase = 'connect' | 'form' | 'success';

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
  const [phase, setPhase] = useState<Phase>('form');
  const [slotId, setSlotId] = useState<AdSlotId | null>(initialSlotId ?? null);
  const [slotIndex, setSlotIndex] = useState(initialSlotIndex);
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageSource, setImageSource] = useState<'url' | 'file'>('file');
  const [link, setLink] = useState('');
  const [title, setTitle] = useState('');
  const [promoTooltip, setPromoTooltip] = useState('');
  const [durationDays, setDurationDays] = useState(7);
  const [featuredHighlight, setFeaturedHighlight] = useState(false);
  const [imageSpecError, setImageSpecError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [metadataCid, setMetadataCid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifyNote, setVerifyNote] = useState<string | null>(null);
  const [connectBusy, setConnectBusy] = useState(false);
  const ipfsFileInputRef = useRef<HTMLInputElement>(null);
  /** Ignore backdrop closes briefly after native file picker (Windows sends stray clicks). */
  const suppressBackdropCloseUntilRef = useRef(0);
  const wizardOpenRef = useRef(false);
  const lastPaymentSyncRef = useRef<{ txHash: string; metadataCid: string } | null>(null);
  const durationInputId = useId();
  const slotMenuRootRef = useRef<HTMLDivElement>(null);

  const [slotMenuOpen, setSlotMenuOpen] = useState(false);

  const { state: kaspaState, connect: connectKaspa } = useKaspaWallet();
  const { ads, refresh: registryRefresh } = useAdsRegistryContext();
  const [syncAdsAfterPayment, setSyncAdsAfterPayment] = useState(false);
  const { tier: krexTier } = useKREXBalance();

  const l1Ready =
    kaspaState.isConnected && Boolean(kaspaState.address) && Boolean(kaspaState.provider);

  const format: AdFormat = useMemo(
    () => (slotId ? defaultFormatForSlot(slotId) : 'square'),
    [slotId],
  );

  const slotConfig = slotId ? AD_SLOTS.find((s) => s.id === slotId) : null;
  const basePriceKas = slotConfig ? priceKasForDays(slotConfig, durationDays) : 0;
  const krexDiscountPct = KREX_TIER_SHOP_DISCOUNT_PCT[krexTier] ?? 0;
  const discountedSlotKas =
    basePriceKas > 0 ? Number((basePriceKas * (1 - krexDiscountPct / 100)).toFixed(8)) : 0;
  const featuredAddonKas = featuredHighlight ? ADS_FEATURED_HIGHLIGHT_KAS : 0;
  const priceKas =
    discountedSlotKas > 0 ? Number((discountedSlotKas + featuredAddonKas).toFixed(8)) : 0;

  const treasuryAddress = getAdsTreasuryL1Address();

  const canProceedSlot = slotId !== null;
  const slotActiveCount = slotId ? countActiveForSlot(ads, slotId) : 0;
  const slotAvailable = slotConfig && slotActiveCount < slotConfig.maxAds;

  const promoTooltipTrimmed = promoTooltip.trim();
  const promoTooltipOk =
    promoTooltipTrimmed.length === 0 || promoTooltipTrimmed.length <= ADS_MAX_PROMO_TOOLTIP_CHARS;

  const canProceedDetails = Boolean(
    (imageSource === 'url' ? imageUrl.trim() : imageFile) &&
      link.trim() &&
      title.trim() &&
      promoTooltipOk &&
      (imageSource !== 'file' || !imageSpecError),
  );

  const canPay = Boolean(canProceedSlot && slotAvailable && canProceedDetails && l1Ready && priceKas > 0);

  useEffect(() => {
    if (!isOpen) {
      wizardOpenRef.current = false;
      setSyncAdsAfterPayment(false);
      return;
    }

    const justOpened = !wizardOpenRef.current;
    wizardOpenRef.current = true;

    if (justOpened) {
      setSlotId(resolveInitialSlotId(initialSlotId, ads));
      setSlotIndex(initialSlotIndex);
      setImageUrl('');
      setImageFile(null);
      setImageSource('file');
      setLink('');
      setTitle('');
      setPromoTooltip('');
      setDurationDays(7);
      setFeaturedHighlight(false);
      setImageSpecError(null);
      setTxHash(null);
      setMetadataCid(null);
      setError(null);
      setVerifyNote(null);
      setSyncAdsAfterPayment(false);
      lastPaymentSyncRef.current = null;
      if (ipfsFileInputRef.current) ipfsFileInputRef.current.value = '';
      setSlotMenuOpen(false);
      setPhase(!kaspaState.isConnected ? 'connect' : 'form');
      return;
    }

    if (!kaspaState.isConnected) {
      setPhase('connect');
      return;
    }
    setPhase((prev) => (prev === 'connect' ? 'form' : prev === 'success' ? prev : 'form'));
  }, [isOpen, initialSlotId, initialSlotIndex, kaspaState.isConnected, ads]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (slotMenuRootRef.current?.contains(t)) return;
      setSlotMenuOpen(false);
    };
    if (slotMenuOpen) document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [slotMenuOpen]);

  useEffect(() => {
    if (!isOpen || !slotId || phase !== 'form') return;
    const max = getSlotConfig(slotId)?.maxAds ?? 1;
    const active = filterActiveAdsForSlot(ads, slotId);
    const occupied = new Set(active.map((a) => a.slotIndex ?? 0));
    if (!occupied.has(slotIndex)) return;
    const free = [...Array(max).keys()].find((i) => !occupied.has(i));
    if (free !== undefined) setSlotIndex(free);
  }, [isOpen, slotId, ads, slotIndex, phase]);

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
            /* ignore */
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
    void validateUploadedImageFile(imageFile, format)
      .then((err) => {
        if (!cancelled) setImageSpecError(err);
      })
      .catch(() => {
        if (!cancelled) setImageSpecError('Could not validate this image. Try another file.');
      });
    return () => {
      cancelled = true;
    };
  }, [imageFile, format, imageSource]);

  const bumpDuration = (delta: number) => {
    setDurationDays((d) =>
      Math.min(ADS_MAX_DURATION_DAYS, Math.max(ADS_MIN_DURATION_DAYS, d + delta)),
    );
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
    if (!l1Ready || !kaspaState.provider || !kaspaState.address) {
      setError('Connect your Kaspa (L1) wallet to pay.');
      return;
    }
    if (!slotId || !slotConfig) {
      setError('Select a slot.');
      return;
    }
    if (!canProceedDetails || !slotAvailable) {
      setError('Fill in all details and pick an available slot.');
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
        featuredHighlight: featuredHighlight || undefined,
        promoTooltip: promoTooltipTrimmed || undefined,
      });

      const client = getIPFSClient();
      const cid = await client.uploadJSON(meta as unknown as Record<string, unknown>, {
        filename: `kasparex-ad-${slotId}-${Date.now()}.json`,
      });
      setMetadataCid(cid);

      const payloadHex = buildAdsBindingPayloadHex(cid);
      const plainNote = buildAdsBindingPlainNote(cid);

      const amountSompi = kasToSompi(priceKas);

      const txRes = await sendKaspaTransaction(kaspaState.provider as KaspaWalletProvider, {
        to: treasuryAddress,
        amount: String(amountSompi),
        note: plainNote,
        payload: payloadHex,
      });
      if (txRes.status === 'failed' || !txRes.txHash) {
        throw new Error(txRes.error ?? 'Transaction was rejected or failed');
      }
      const hash = extractKaspaTransactionId(txRes.txHash) ?? txRes.txHash;
      setTxHash(hash);
      lastPaymentSyncRef.current = { txHash: hash, metadataCid: cid };

      // Wallet work is done - show success immediately. Verification hits public REST (often lags after broadcast).
      setPhase('success');
      setVerifyNote('Checking transaction on the network…');
      setIsSubmitting(false);
      onSuccess?.();
      setSyncAdsAfterPayment(true);

      let verifyOk = false;
      let lastVerifyMessage: string | null = null;
      const maxVerifyAttempts = 5;
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
              ? 'Waiting for the public indexer…'
              : 'We could not load this transaction from Kaspa REST yet. If payment succeeded in KasWare, the Ads list usually updates within a few minutes - refresh the Ads page or try again later.';
        } catch {
          lastVerifyMessage =
            attempt < maxVerifyAttempts - 1
              ? 'Waiting for verification…'
              : 'Could not reach the server to verify. Try refreshing the Ads page in a minute.';
        }
        if (verifyOk) break;
        if (attempt < maxVerifyAttempts - 1) {
          await new Promise((r) => setTimeout(r, 2800));
        }
      }
      setVerifyNote(lastVerifyMessage);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transaction failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
      <div
        role="presentation"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
        onMouseDown={(e) => {
          if (e.button !== 0) return;
          if (Date.now() < suppressBackdropCloseUntilRef.current) return;
          if (!isSubmitting && !connectBusy) handleClose();
        }}
      />
      <div
        className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-xl max-w-xl w-full border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="h-6 w-1 shrink-0 rounded-full bg-[#02abb8] shadow-[0_0_12px_rgba(2,171,184,0.35)] -skew-y-12"
              aria-hidden
            />
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate">Create ad</h2>
          </div>
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

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {phase === 'connect' && (
            <>
              <ModalSectionTitle>Connect wallet</ModalSectionTitle>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                Connect a Kaspa (L1) wallet to reserve a slot, pin campaign metadata, and pay in KAS. This uses the same
                connection as the site header.
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-4">
                KREX balance across your connected wallets reduces the listed ad price (same tiers as Diamond Veins shop
                discounts). Campaign payment is KAS only for now.
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

          {phase === 'form' && (
            <>
              <div ref={slotMenuRootRef} className="relative overflow-visible">
                <ModalSectionTitle required>Placement</ModalSectionTitle>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                  Pick a slot with capacity. Pricing updates after you set duration below.
                </p>
                <button
                  type="button"
                  className="k-control-btn w-full min-h-[3.5rem] py-3 px-4 !justify-between gap-3 text-left !bg-zinc-50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] border-zinc-200 dark:!bg-zinc-800/95 dark:border-zinc-600 dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)]"
                  onClick={() => setSlotMenuOpen((v) => !v)}
                  aria-expanded={slotMenuOpen}
                  aria-haspopup="listbox"
                >
                  <span className="min-w-0 flex-1 truncate font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                    {slotConfig?.label ?? 'Select slot'}
                  </span>
                  <span className="shrink-0 text-right text-[11px] font-bold tabular-nums text-zinc-500 dark:text-zinc-400 leading-tight max-w-[9rem] sm:max-w-none">
                    {slotConfig ? (
                      <>
                        <span className="text-zinc-700 dark:text-zinc-300">{slotConfig.pricePerDay} KAS/day</span>
                        <span className="block text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 mt-0.5">
                          {slotActiveCount}/{slotConfig.maxAds} filled
                        </span>
                      </>
                    ) : (
                      <span> - </span>
                    )}
                  </span>
                  <svg
                    className={`w-4 h-4 shrink-0 text-zinc-500 transition-transform ${slotMenuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {slotMenuOpen && (
                  <div
                    role="listbox"
                    className="absolute left-0 right-0 top-full z-[10000] mt-1.5 max-h-72 overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    {AD_SLOTS.map((s) => {
                      const active = countActiveForSlot(ads, s.id);
                      const available = active < s.maxAds;
                      const selected = slotId === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          disabled={!available}
                          onClick={() => {
                            if (!available) return;
                            setSlotId(s.id as AdSlotId);
                            setSlotMenuOpen(false);
                          }}
                          className={`flex w-full min-h-[3rem] items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors ${
                            selected
                              ? 'bg-[#02abb8]/10 text-[#02abb8] dark:bg-[#02abb8]/20 font-medium'
                              : available
                                ? 'text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800'
                                : 'cursor-not-allowed opacity-45 text-zinc-400 dark:text-zinc-600'
                          }`}
                        >
                          <span className="min-w-0 flex-1 truncate font-semibold">{s.label}</span>
                          <span className="shrink-0 text-right text-[11px] font-bold tabular-nums leading-tight">
                            <span>{s.pricePerDay} KAS/day</span>
                            <span className="block text-[10px] font-semibold opacity-80 mt-0.5">
                              {active}/{s.maxAds} filled
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <ModalSectionTitle required>Creative</ModalSectionTitle>
                <div className="space-y-4">
                  <div>
                    <div className="k-control-group h-10 p-1 flex w-full">
                      <button
                        type="button"
                        onClick={() => setImageSource('url')}
                        className={`h-full flex-1 px-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${
                          imageSource === 'url'
                            ? 'bg-[#02abb8] text-white shadow-sm'
                            : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        Image URL
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageSource('file')}
                        className={`h-full flex-1 px-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${
                          imageSource === 'file'
                            ? 'bg-[#02abb8] text-white shadow-sm'
                            : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        Upload (IPFS)
                      </button>
                    </div>
                    {imageSource === 'url' ? (
                      <div className="mt-3">
                        <input
                          type="url"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="https://..."
                          className="k-modal-field-input mt-3"
                        />
                        <p className="mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-500">
                          Direct HTTPS image URL (PNG, JPG, or WebP).
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3 space-y-2">
                        <div className="relative flex min-h-[10rem] flex-col items-center justify-center gap-2.5 overflow-hidden rounded-xl border-2 border-dashed border-[#02abb8]/35 bg-gradient-to-br from-[#02abb8]/10 via-transparent to-cyan-500/5 px-4 py-7 transition-all hover:border-[#02abb8]/55 hover:from-[#02abb8]/15 dark:from-[#02abb8]/14 dark:to-cyan-950/25 dark:hover:from-[#02abb8]/20">
                          <input
                            ref={ipfsFileInputRef}
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                            onMouseDown={() => {
                              suppressBackdropCloseUntilRef.current = Date.now() + 2500;
                            }}
                            onFocus={() => {
                              suppressBackdropCloseUntilRef.current = Date.now() + 2500;
                            }}
                            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                          />
                          <div className="pointer-events-none flex flex-col items-center gap-2.5">
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
                                PNG, JPG, or WebP - pinned when you pay
                              </span>
                            </div>
                          </div>
                        </div>
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
                    <ModalSectionTitle required>Link</ModalSectionTitle>
                    <input
                      type="url"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      placeholder="https://..."
                      className="k-modal-field-input"
                    />
                  </div>
                  <div>
                    <ModalSectionTitle required>Title</ModalSectionTitle>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ad title"
                      className="k-modal-field-input"
                    />
                  </div>
                  <div>
                    <ModalSectionTitle>Hover promo (optional)</ModalSectionTitle>
                    <textarea
                      value={promoTooltip}
                      onChange={(e) => setPromoTooltip(e.target.value.slice(0, ADS_MAX_PROMO_TOOLTIP_CHARS))}
                      placeholder="Very short line shown in the hover tooltip on your creative"
                      rows={2}
                      className="k-modal-field-input"
                      maxLength={ADS_MAX_PROMO_TOOLTIP_CHARS}
                    />
                    <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-500">
                      {promoTooltip.length}/{ADS_MAX_PROMO_TOOLTIP_CHARS} characters
                      {!promoTooltipOk ? ' - shorten to continue' : ''}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <ModalSectionTitle required>Duration</ModalSectionTitle>
                <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900/40">
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-500">Days</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="k-control-icon-btn h-9 w-9"
                      onClick={() => bumpDuration(-1)}
                      disabled={durationDays <= ADS_MIN_DURATION_DAYS}
                    >
                      −
                    </button>
                    <input
                      id={durationInputId}
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      aria-label="Campaign duration in days"
                      className="min-w-[3.25rem] max-w-[5.25rem] rounded-lg border border-zinc-200 bg-white px-2 py-1 text-center text-sm font-black tabular-nums text-zinc-900 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-950/50 dark:text-zinc-100"
                      value={durationDays}
                      onChange={(e) => {
                        const t = e.target.value.replace(/\D/g, '').slice(0, 4);
                        const n = parseInt(t, 10);
                        if (t === '') return;
                        if (Number.isNaN(n)) return;
                        setDurationDays(Math.min(ADS_MAX_DURATION_DAYS, Math.max(ADS_MIN_DURATION_DAYS, n)));
                      }}
                      onBlur={() => {
                        if (durationDays < ADS_MIN_DURATION_DAYS) setDurationDays(ADS_MIN_DURATION_DAYS);
                      }}
                    />
                    <button
                      type="button"
                      className="k-control-icon-btn h-9 w-9"
                      onClick={() => bumpDuration(1)}
                      disabled={durationDays >= ADS_MAX_DURATION_DAYS}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <ModalSectionTitle>Premium (L1)</ModalSectionTitle>
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/90 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900/50">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Featured highlight</p>
                    <p className="text-[11px] leading-snug text-zinc-500 dark:text-zinc-400 mt-0.5">
                      More visible placement with a colorful frame for the duration of the campaign. One-time{' '}
                      {ADS_FEATURED_HIGHLIGHT_KAS} KAS - not per day.
                    </p>
                  </div>
                  <span className="text-sm font-black tabular-nums text-[#02abb8] shrink-0">
                    +{ADS_FEATURED_HIGHLIGHT_KAS} KAS
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={featuredHighlight}
                    onClick={() => setFeaturedHighlight((v) => !v)}
                    className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
                      featuredHighlight ? 'bg-[#02abb8]' : 'bg-zinc-300 dark:bg-zinc-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                        featuredHighlight ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-800/40 p-4 space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                <ModalSectionTitle className="mb-1">Summary</ModalSectionTitle>
                {krexDiscountPct > 0 && (
                  <p className="line-through opacity-70">
                    Slot list: {basePriceKas} KAS ({durationDays} × {slotConfig?.pricePerDay ?? 0} KAS/day)
                  </p>
                )}
                <p>
                  Slot after tier: <strong className="text-zinc-900 dark:text-zinc-100">{discountedSlotKas} KAS</strong>
                  {krexDiscountPct > 0 ? ` (${krexDiscountPct}% off · ${KREX_TIERS[krexTier]?.label ?? krexTier})` : ''}
                </p>
                {featuredHighlight && (
                  <p>
                    Featured add-on:{' '}
                    <strong className="text-zinc-900 dark:text-zinc-100">+{ADS_FEATURED_HIGHLIGHT_KAS} KAS</strong>{' '}
                    <span className="text-zinc-500">(one-time)</span>
                  </p>
                )}
                <p className="text-base font-bold text-[#02abb8] dark:text-[#02abb8] pt-1 border-t border-zinc-200 dark:border-zinc-600 mt-2 tabular-nums">
                  Total: {priceKas} KAS
                </p>
              </div>

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-3 text-xs">
                <ModalSectionTitle className="mb-2">L1 wallet</ModalSectionTitle>
                <p
                  className={`mt-1 ${l1Ready ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}
                >
                  {l1Ready
                    ? `Connected · ${kaspaState.address?.replace(/^kaspa:/, '').slice(0, 10)}…${kaspaState.address?.replace(/^kaspa:/, '').slice(-6)}`
                    : 'Connect from this screen or the site header.'}
                </p>
              </div>

              {initialSlotId && slotConfig && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Prefilled slot: <strong>{slotConfig.label}</strong>
                </p>
              )}
            </>
          )}

          {phase === 'success' && (
            <div className="text-center py-4">
              {!txHash ? (
                <>
                  <p className="text-[#02abb8] font-medium mb-2">Almost done</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Confirming payment…</p>
                </>
              ) : (
                <>
                  <p className="text-[#02abb8] font-medium mb-2">Payment sent</p>
                  <p className="text-xs font-mono text-zinc-600 dark:text-zinc-300 break-all">
                    {extractKaspaTransactionId(txHash) ?? 'Open your wallet history to copy the transaction id.'}
                  </p>
                  {metadataCid && (
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-500 mt-2 break-all">Metadata: {metadataCid}</p>
                  )}
                  {verifyNote && (
                    <p
                      className={`text-sm mt-3 text-left ${
                        verifyNote.startsWith('Checking transaction')
                          ? 'text-zinc-500 dark:text-zinc-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {verifyNote}
                    </p>
                  )}
                  <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-3 text-left">
                    KasWare may label the payload as unsupported in the decode view; the transaction still carries the Kasparex
                    binding the site reads from the public indexer.
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-4">
                    Your ad appears in the public list once the indexer picks up the transaction (usually within a couple of
                    minutes). Campaigns older than the indexer lookback may not be listed; see Ads overview.
                  </p>
                </>
              )}
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          {phase === 'connect' && (
            <>
              <button
                type="button"
                onClick={handleClose}
                disabled={connectBusy}
                className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:underline text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-500 text-right max-w-[220px]">
                After you approve in your wallet, you can continue here.
              </span>
            </>
          )}
          {phase === 'form' && (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:underline text-sm"
              >
                Cancel
              </button>
              <div className="flex flex-wrap items-center gap-2 justify-end ml-auto">
                <button
                  type="button"
                  onClick={() => void handlePay()}
                  disabled={isSubmitting || !canPay}
                  className="px-4 py-2 rounded-lg bg-[#02abb8] text-white font-medium text-sm disabled:opacity-50 min-w-[140px]"
                >
                  {isSubmitting ? 'Sending…' : `Pay ${priceKas} KAS`}
                </button>
              </div>
            </>
          )}
          {phase === 'success' && (
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
