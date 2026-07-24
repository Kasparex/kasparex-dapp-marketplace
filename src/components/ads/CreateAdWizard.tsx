'use client';

import { useState, useEffect, useMemo, useRef, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AD_SLOTS, getSlotConfig, priceKasForDays } from '@/lib/ads/slots';
import { getAdsTreasuryL1Address } from '@/lib/ads/config';
import {
  ADS_MIN_DURATION_DAYS,
  ADS_MAX_DURATION_DAYS,
  ADS_FEATURED_HIGHLIGHT_KAS,
  ADS_EXTENDED_EXPOSURE_KAS,
  ADS_EXTENDED_EXPOSURE_SECONDS,
  ADS_MAX_PROMO_TOOLTIP_CHARS,
  ADS_KREX_BINDING_FEE_KAS,
} from '@/lib/ads/constants';
import { adPremiumAddonKas } from '@/lib/ads/premiumAddons';
import { buildCampaignMetadataV1, resolveAdImageUrl, type AdImageRef, type AdPaymentCurrency } from '@/lib/ads/metadata';
import type { AdSlotId, AdFormat, AdEntry } from '@/lib/ads/types';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { detectKaspaWallets, getKaspaAddress, getWalletProvider, KASPA_WALLET_PROVIDERS } from '@/lib/kaspa/wallet';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { usePricingSnapshot } from '@/hooks/usePricingSnapshot';
import { formatHubPaymentFromKas } from '@/lib/pricing';
import { KREX_TIER_SHOP_DISCOUNT_PCT } from '@/lib/game/diamond-veins-config';
import { KREX_TIERS } from '@/lib/rewards/types';
import { getIPFSClient } from '@/lib/ipfs/client';
import { useAdsRegistryContext } from '@/components/ads/AdsRegistryProvider';
import { countActiveForSlot, filterActiveAdsForSlot } from '@/lib/ads/registryUtils';
import { defaultFormatForSlot, validateUploadedImageFile } from '@/lib/ads/creativeSpecs';
import { appendHubActivityEarn } from '@/lib/rewards/appendHubActivityEarn';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { computeEarnedHubPoints, formatHubPointsTierLabel } from '@/lib/rewards/hub-points';
import { KxSegmentToggle } from '@/components/ui/KxSegmentToggle';
import { HubPaymentCurrencyDropdown } from '@/components/payments/HubPaymentCurrencyDropdown';
import { buildKasKrexMenuOptions } from '@/lib/payments/hubPaymentTypes';
import { KxInFormPremiumList, KxInFormPremiumRow } from '@/components/ui/KxInFormPremiumRow';
import { FieldHint } from '@/components/ui/FieldHint';
import { KxModalSectionTitle } from '@/components/payments/KxPaymentUi';
import { TierBadge } from '@/components/rewards/TierBadge';
import { HubPointsEarnBadge } from '@/components/hub/HubPointsEarnBadge';
import { KREXBuyWizard } from '@/components/rewards/KREXBuyWizard';
import { Tooltip } from '@/components/ui/Tooltip';
import { KrexTierPerksTooltipTable } from '@/components/rewards/KrexTierPerksTooltipTable';
import {
  adsPriceKrexFromKas,
  transferKrexForAdsPayment,
  useAdsPayment,
} from '@/hooks/useAdsPayment';
import { formatKaspaWalletError } from '@/lib/kaspa/formatWalletError';
import { readJsonResponse } from '@/lib/http/readJsonResponse';
import { exposureBonusSecondsFromPremium } from '@/lib/ads/carouselTiming';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { L1WalletConnectLabel, type L1WalletProviderId } from '@/components/wallet/L1WalletLogo';

function resolveInitialSlotId(initial: AdSlotId | null | undefined, adsList: AdEntry[]): AdSlotId | null {
  const normalized =
    initial === 'GAMES_PLAY_RAIL_RIGHT'
      ? ('HALO_GAMES_RIGHT' as AdSlotId)
      : initial === 'VBLOG_ARTICLE_ASIDE_BOTTOM'
        ? ('HALO_VBLOG_RIGHT' as AdSlotId)
        : initial;
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
  const [extendedExposure, setExtendedExposure] = useState(false);
  const [paymentCurrency, setPaymentCurrency] = useState<AdPaymentCurrency>('KAS');
  const [imageSpecError, setImageSpecError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isKrexWizardOpen, setIsKrexWizardOpen] = useState(false);
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

  const { state: kaspaState, connect: connectKaspa, refresh: refreshKaspa } = useKaspaWallet();
  const { ads, refresh: registryRefresh, upsertAd } = useAdsRegistryContext();
  const [syncAdsAfterPayment, setSyncAdsAfterPayment] = useState(false);
  const { payAdCampaign, isProcessing: isPayProcessing } = useAdsPayment();
  const { tier: krexTier, balance: krexBalance, l1Balance: krexL1Balance } = useKREXBalance();
  const { snapshot: pricingSnapshot } = usePricingSnapshot(['KREX']);

  const l1Ready = Boolean(kaspaState.address) && Boolean(kaspaState.provider);

  const format: AdFormat = useMemo(
    () => (slotId ? defaultFormatForSlot(slotId) : 'square'),
    [slotId],
  );

  const slotConfig = slotId ? AD_SLOTS.find((s) => s.id === slotId) : null;
  const basePriceKas = slotConfig ? priceKasForDays(slotConfig, durationDays) : 0;
  const krexDiscountPct = KREX_TIER_SHOP_DISCOUNT_PCT[krexTier] ?? 0;
  const discountedSlotKas =
    basePriceKas > 0 ? Number((basePriceKas * (1 - krexDiscountPct / 100)).toFixed(8)) : 0;
  const discountKas =
    basePriceKas > 0 ? Number((basePriceKas - discountedSlotKas).toFixed(8)) : 0;
  const premiumAddonKas = adPremiumAddonKas({ featuredHighlight, extendedExposure });
  const priceKas =
    discountedSlotKas > 0 ? Number((discountedSlotKas + premiumAddonKas).toFixed(8)) : 0;
  const payLabel = formatHubPaymentFromKas(priceKas, paymentCurrency, pricingSnapshot);
  const formatPrice = (kas: number) => formatHubPaymentFromKas(kas, paymentCurrency, pricingSnapshot);
  const krexCheckoutHint =
    'KREX checkout uses two wallet confirmations: your KREX campaign fee, then a 1 KAS binding payment that carries your metadata on-chain. If storage mass errors appear, compound UTXOs in KasWare (Wallet > UTXO > Compound) and retry.';
  const hubPointsEarn = computeEarnedHubPoints(HUB_EARN_POINTS.hubAdPlacement, krexTier);
  const showBuyKrex = krexDiscountPct <= 0 && krexBalance < KREX_TIERS.Tier1.minKREX;
  const tierPerksTooltip = useMemo(
    () => <KrexTierPerksTooltipTable title="Ad slot KREX tier perks" />,
    [],
  );

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
      setExtendedExposure(false);
      setPaymentCurrency('KAS');
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
      for (let i = 0; i < 12 && !cancelled; i++) {
        if (cancelled) return;
        const sync = lastPaymentSyncRef.current;
        if (sync && i % 2 === 0) {
          try {
            const vr = await fetch('/api/ads/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ txHash: sync.txHash, metadataCid: sync.metadataCid }),
            });
            const vj = await readJsonResponse<{ ok?: boolean; entry?: AdEntry }>(vr);
            if (vj.ok && vj.entry) {
              upsertAd(vj.entry);
              break;
            }
          } catch {
            /* ignore */
          }
        }
        if (i === 0 || i % 3 === 0) {
          await registryRefresh({ silent: true });
        }
        if (cancelled) return;
        await new Promise((r) => setTimeout(r, 8000));
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [syncAdsAfterPayment, registryRefresh, upsertAd]);

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
    setError(null);

    const provider = kaspaState.provider;
    if (!provider) {
      setError('Connect your Kaspa (L1) wallet to pay.');
      return;
    }
    if (!getWalletProvider(provider)) {
      setError('Wallet extension is not available. Refresh the page or reconnect your wallet.');
      return;
    }

    await refreshKaspa();

    let payerAddress = kaspaState.address;
    try {
      const liveAddress = await getKaspaAddress(provider);
      if (liveAddress) payerAddress = liveAddress;
    } catch {
      /* use stored address if live lookup fails */
    }

    if (!payerAddress) {
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

    const payCur = paymentCurrency;
    if (payCur === 'KREX') {
      const priceKrex = adsPriceKrexFromKas(priceKas, pricingSnapshot);
      if (krexL1Balance + 1e-12 < priceKrex) {
        setError(`Insufficient KREX on your L1 wallet (${krexL1Balance.toFixed(2)} available, ${priceKrex} required).`);
        return;
      }
    }

    let payerL1: string;
    try {
      payerL1 = normalizeKaspaAddress(payerAddress);
    } catch {
      setError('Invalid Kaspa wallet address.');
      return;
    }

    setIsSubmitting(true);
    setVerifyNote(null);
    try {
      const image = await buildImageRef();

      let krexPaymentTxHash: string | undefined;
      let priceKrex: number | undefined;

      if (payCur === 'KREX') {
        krexPaymentTxHash = await transferKrexForAdsPayment(
          provider as KaspaWalletProvider,
          priceKas,
          treasuryAddress,
          pricingSnapshot,
        );
        priceKrex = adsPriceKrexFromKas(priceKas, pricingSnapshot);
      }

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
        paymentCurrency: payCur === 'KREX' ? 'KREX' : undefined,
        priceKrex,
        krexPaymentTxHash,
        featuredHighlight: featuredHighlight || undefined,
        extendedExposure: extendedExposure || undefined,
        promoTooltip: promoTooltipTrimmed || undefined,
      });

      const client = getIPFSClient();
      const cid = await client.uploadJSON(meta as unknown as Record<string, unknown>, {
        filename: `kasparex-ad-${slotId}-${Date.now()}.json`,
      });
      setMetadataCid(cid);

      const { txHash: hash } = await payAdCampaign({
        currency: payCur,
        priceKas,
        metadataCid: cid,
        krexPaymentTxHash,
      });
      setTxHash(hash);
      lastPaymentSyncRef.current = { txHash: hash, metadataCid: cid };

      upsertAd({
        id: `${hash}-${cid}`,
        slotId,
        slotIndex,
        featuredHighlight: featuredHighlight || undefined,
        exposureBonusSeconds: exposureBonusSecondsFromPremium(extendedExposure) ?? undefined,
        format,
        imageUrl: resolveAdImageUrl(image),
        link: link.trim(),
        title: title.trim(),
        promoTooltip: promoTooltipTrimmed || undefined,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString(),
        payerL1,
        metadataCid: cid,
        txId: hash,
      });

      try {
        appendHubActivityEarn({
          walletRaw: payerL1,
          source: 'hub_ad_placement',
          redeemableDelta: HUB_EARN_POINTS.hubAdPlacement,
          krexBalance,
          idempotencyKey: `ads:bind:${hash}`,
          meta: { slotId, slotIndex },
        });
      } catch {
        /* hub ledger is non-blocking */
      }

      // Wallet work is done - show success immediately. Verification hits public REST (often lags after broadcast).
      setPhase('success');
      setVerifyNote('Checking transaction on the network…');
      setIsSubmitting(false);
      onSuccess?.();
      setSyncAdsAfterPayment(true);

      let verifyOk = false;
      let lastVerifyMessage: string | null = null;
      const maxVerifyAttempts = 8;
      for (let attempt = 0; attempt < maxVerifyAttempts; attempt++) {
        try {
          const vr = await fetch('/api/ads/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ txHash: hash, metadataCid: cid }),
          });
          const vj = await readJsonResponse<{ ok?: boolean; error?: string; entry?: AdEntry }>(vr);
          if (vj.ok) {
            verifyOk = true;
            lastVerifyMessage = null;
            if (vj.entry) upsertAd(vj.entry);
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
      setError(formatKaspaWalletError(e));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const handleWalletConnect = async (provider: KaspaWalletProvider) => {
    setConnectBusy(true);
    setError(null);
    try {
      await connectKaspa(provider, {
        enableSIWK: true,
        siwkParams: {
          domain: typeof window !== 'undefined' ? window.location.hostname : 'kasparex.com',
          statement: 'Welcome to Kasparex!',
          appName: 'Kasparex',
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connection failed');
    } finally {
      setConnectBusy(false);
    }
  };

  const walletLogoProvider = (id: KaspaWalletProvider): L1WalletProviderId | null => {
    if (id === 'kasware' || id === 'kastle') return id;
    return null;
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
              <KxModalSectionTitle>Connect wallet</KxModalSectionTitle>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                Connect a Kaspa (L1) wallet to reserve a slot, pin campaign metadata, and pay in KAS. This uses the same
                connection as the site header.
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-4">
                Your KREX tier discounts the slot rate (same tiers as Hub listings) and multiplies Hub Points earned
                for placing an ad. You can pay in KAS or KREX on the next step.
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
                      {walletLogoProvider(w.id) ? (
                        <L1WalletConnectLabel provider={walletLogoProvider(w.id)!} label={`Connect ${w.name}`} />
                      ) : (
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">Connect {w.name}</span>
                      )}
                      <span className="text-xs text-zinc-500 block mt-1.5">Detected in this browser</span>
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
                <KxModalSectionTitle required>Placement</KxModalSectionTitle>
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
                <KxModalSectionTitle required>Creative</KxModalSectionTitle>
                <div className="space-y-4">
                  <div>
                    <KxSegmentToggle
                      value={imageSource}
                      onChange={setImageSource}
                      options={[
                        { value: 'url', label: 'Image URL' },
                        { value: 'file', label: 'Upload (IPFS)' },
                      ]}
                      ariaLabel="Creative image source"
                    />
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
                    <KxModalSectionTitle required>Link</KxModalSectionTitle>
                    <input
                      type="url"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      placeholder="https://..."
                      className="k-modal-field-input"
                    />
                  </div>
                  <div>
                    <KxModalSectionTitle required>Title</KxModalSectionTitle>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ad title"
                      className="k-modal-field-input"
                    />
                  </div>
                  <div>
                    <KxModalSectionTitle>Hover promo (optional)</KxModalSectionTitle>
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
                <KxModalSectionTitle required>Duration</KxModalSectionTitle>
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
                <KxModalSectionTitle>Premium (L1)</KxModalSectionTitle>
                <KxInFormPremiumList>
                  <KxInFormPremiumRow
                    title="Featured highlight"
                    description={`More visible placement with a colorful frame for the duration of the campaign. One-time ${formatPrice(ADS_FEATURED_HIGHLIGHT_KAS)} - not per day.`}
                    priceLabel={`+${formatPrice(ADS_FEATURED_HIGHLIGHT_KAS)}`}
                    checked={featuredHighlight}
                    onToggle={() => setFeaturedHighlight((v) => !v)}
                  />
                  <KxInFormPremiumRow
                    title="Extended exposure"
                    description={`Your ad stays visible +${ADS_EXTENDED_EXPOSURE_SECONDS} seconds longer before the slider advances. One-time ${formatPrice(ADS_EXTENDED_EXPOSURE_KAS)} - not per day.`}
                    priceLabel={`+${formatPrice(ADS_EXTENDED_EXPOSURE_KAS)}`}
                    checked={extendedExposure}
                    onToggle={() => setExtendedExposure((v) => !v)}
                  />
                </KxInFormPremiumList>
              </div>

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-3">
                <KxModalSectionTitle className="mb-2 [&_p]:items-center">
                  <span className="inline-flex items-center gap-1.5">
                    Pay with
                    {paymentCurrency === 'KREX' ? (
                      <FieldHint text={krexCheckoutHint} ariaLabel="KREX checkout info" />
                    ) : null}
                  </span>
                </KxModalSectionTitle>
                <HubPaymentCurrencyDropdown
                  value={paymentCurrency}
                  onChange={setPaymentCurrency}
                  options={buildKasKrexMenuOptions()}
                  ariaLabel="Ad payment currency"
                />
              </div>

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-800/40 p-4 space-y-3 text-xs text-zinc-600 dark:text-zinc-400">
                <div className="flex items-center justify-between gap-2">
                  <KxModalSectionTitle className="mb-0">
                    <span className="inline-flex items-center gap-1.5">
                      Summary
                      <Tooltip content={tierPerksTooltip}>
                        <button
                          type="button"
                          className="inline-flex shrink-0 rounded p-0.5 text-zinc-500 transition-colors hover:bg-zinc-200/60 hover:text-[#02abb8] dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-[#66dfe8]"
                          aria-label="KREX tier discount and Hub Points multiplier"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </button>
                      </Tooltip>
                    </span>
                  </KxModalSectionTitle>
                  <TierBadge tier={krexTier} isUnlocked={krexBalance > 0} />
                </div>

                {krexDiscountPct > 0 ? (
                  <p className="line-through opacity-70">
                    Slot list: {formatPrice(basePriceKas)} ({durationDays} × {formatPrice(slotConfig?.pricePerDay ?? 0)}
                    /day)
                  </p>
                ) : (
                  <p>
                    Slot: <strong className="text-zinc-900 dark:text-zinc-100">{formatPrice(basePriceKas)}</strong>{' '}
                    ({durationDays} × {formatPrice(slotConfig?.pricePerDay ?? 0)}/day)
                  </p>
                )}
                {krexDiscountPct > 0 ? (
                  <p>
                    Slot after tier:{' '}
                    <strong className="text-zinc-900 dark:text-zinc-100">{formatPrice(discountedSlotKas)}</strong>
                    {` (${krexDiscountPct}% off · ${KREX_TIERS[krexTier]?.label ?? krexTier})`}
                  </p>
                ) : null}
                {featuredHighlight && (
                  <p>
                    Featured add-on:{' '}
                    <strong className="text-zinc-900 dark:text-zinc-100">+{formatPrice(ADS_FEATURED_HIGHLIGHT_KAS)}</strong>{' '}
                    <span className="text-zinc-500">(one-time, not discounted)</span>
                  </p>
                )}
                {extendedExposure && (
                  <p>
                    Extended exposure:{' '}
                    <strong className="text-zinc-900 dark:text-zinc-100">+{formatPrice(ADS_EXTENDED_EXPOSURE_KAS)}</strong>{' '}
                    <span className="text-zinc-500">(+{ADS_EXTENDED_EXPOSURE_SECONDS}s, one-time, not discounted)</span>
                  </p>
                )}
                <p className="text-base font-bold text-[#02abb8] dark:text-[#02abb8] pt-1 border-t border-zinc-200 dark:border-zinc-600 mt-1 tabular-nums">
                  Total: {payLabel}
                </p>
                {paymentCurrency === 'KREX' ? (
                  <p className="text-zinc-500 dark:text-zinc-500">
                    +{ADS_KREX_BINDING_FEE_KAS} KAS binding fee in the second wallet step (plus network fee).
                  </p>
                ) : null}

                {discountKas > 0 ? (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-300">
                    KREX discount: -{discountKas.toFixed(2)} KAS ({krexDiscountPct}% off slot rate).
                  </div>
                ) : null}

                {hubPointsEarn > 0 ? (
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 px-3 py-2.5 dark:border-zinc-700">
                    <span>Hub points on placement</span>
                    <span className="inline-flex items-center gap-1.5">
                      <HubPointsEarnBadge
                        points={hubPointsEarn}
                        baseSpendKas={basePriceKas > 0 ? basePriceKas + premiumAddonKas : null}
                      />
                      <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                        ({krexTier !== 'Tier0' ? `${formatHubPointsTierLabel(krexTier)} multiplier` : 'base amount'})
                      </span>
                    </span>
                  </div>
                ) : null}

                {showBuyKrex ? (
                  <button
                    type="button"
                    onClick={() => setIsKrexWizardOpen(true)}
                    className="w-full k-control-btn !border-emerald-500/30 !text-emerald-700 dark:!text-emerald-300"
                  >
                    Buy KREX to unlock discount
                  </button>
                ) : null}
              </div>

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-3 text-xs">
                <KxModalSectionTitle className="mb-2">L1 wallet</KxModalSectionTitle>
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
                  disabled={isSubmitting || isPayProcessing || !canPay}
                  className="px-4 py-2 rounded-lg bg-[#02abb8] text-white font-medium text-sm disabled:opacity-50 min-w-[140px]"
                >
                  {isSubmitting || isPayProcessing ? 'Sending…' : `Pay ${payLabel}`}
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
      <KREXBuyWizard isOpen={isKrexWizardOpen} onClose={() => setIsKrexWizardOpen(false)} />
    </div>
  );

  return createPortal(body, document.body);
}
