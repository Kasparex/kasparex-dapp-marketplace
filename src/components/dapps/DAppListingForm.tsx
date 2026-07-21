'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useIPFSUpload } from '@/lib/ipfs/hooks';
import { categories, type Category } from '@/lib/categories';
import { KxSegmentToggle } from '@/components/ui/KxSegmentToggle';
import { HubPaymentCurrencyDropdown } from '@/components/payments/HubPaymentCurrencyDropdown';
import { buildKasKrexMenuOptions } from '@/lib/payments/hubPaymentTypes';
import { KxTabStrip } from '@/components/ui/KxTabStrip';
import { KxFilterDropdown } from '@/components/ui/KxFilterDropdown';
import { StoreFileUpload } from '@/components/store/StoreFileUpload';
import { useDAppListingPayment } from '@/hooks/useDAppListingPayment';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import {
  DAPP_LISTING_ACTION_FEE_KAS,
  DAPP_LISTING_FEE_KAS,
  calculateDirectoryListingFeeKas,
  listingActionFeeLabel,
  saveDirectoryListing,
  updateDirectoryListing,
  type DirectoryLink,
  type DirectoryListing,
  type NetworkLayer,
} from '@/lib/dapps/listingSubmissions';
import type { StorePaymentCurrency } from '@/lib/store/currencies';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { appendHubActivityEarn } from '@/lib/rewards/appendHubActivityEarn';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { getBestGatewayUrl, normalizeIpfsUrlForForm } from '@/lib/ipfs/gateway';
import { KxMultiSelectDropdown } from '@/components/ui/KxMultiSelectDropdown';
import { DIRECTORY_LISTING_CHAINS } from '@/lib/dapps/listingChains';
import { KxLinkRowsEditor, type KxLinkRow } from '@/components/ui/KxLinkRowsEditor';
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';
import { DAppListingPreview } from '@/components/dapps/DAppListingPreview';
import { getFieldDef } from '@/lib/dapps/pageLayoutMap';
import {
  KX_FORM_GRID,
  KX_FORM_PANEL,
  KX_FORM_STICKY_RAIL,
  KX_CALCULATION_ASIDE,
  KX_PREMIUM_MODULE_CARD,
} from '@/lib/hub/shellTokens';
import { KxRichTextEditor } from '@/components/ui/KxRichTextEditor';
import { KxInFormPremiumRow } from '@/components/ui/KxInFormPremiumRow';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { HubFlowProgress } from '@/components/hub/HubFlowProgress';
import { getHubFlowPreset } from '@/lib/hub/hubFlowProgress';
import { HubBenefitsPanel } from '@/components/hub/HubBenefitsPanel';
import { htmlToPlainText } from '@/lib/richText/html';

const LISTING_CATEGORIES = categories.filter((c) => c.id !== 'all');
const IMAGE_MAX_SIZE_MB = 0.5;

const CHAIN_OPTIONS = DIRECTORY_LISTING_CHAINS.map((chain) => ({
  value: chain,
  label: chain,
}));

const PREMIUM_FEATURED_FEE_KAS = 15;
const PREMIUM_HIGHLIGHT_FEE_KAS = 10;
function parseTags(raw: string): string[] {
  return raw
    .split(/[,#]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function ImageSourceToggle({
  value,
  onChange,
}: {
  value: 'url' | 'file';
  onChange: (next: 'url' | 'file') => void;
}) {
  return (
    <KxTabStrip
      value={value}
      onChange={onChange}
      options={[
        { value: 'url', label: 'Via URL' },
        { value: 'file', label: 'Upload (IPFS)' },
      ]}
      ariaLabel="Image source"
      fullWidth
    />
  );
}

function cleanLinks(rows: KxLinkRow[]): DirectoryLink[] {
  return rows
    .map((r) => ({ label: r.label.trim(), url: r.url.trim() }))
    .filter((r) => r.label && r.url)
    .slice(0, 8);
}

type DAppListingFormProps = {
  listing?: DirectoryListing;
  onSubmitted?: () => void;
};

export function DAppListingForm({ listing, onSubmitted }: DAppListingFormProps) {
  const isEdit = Boolean(listing);
  const router = useRouter();
  const { state } = useKaspaWallet();
  const { upload, isUploading } = useIPFSUpload();
  const { payActionFee, isProcessing, error, setError } = useDAppListingPayment();
  const { tier: krexTier, balance: krexBalance } = useKREXBalance();
  const { nftStatus } = useNFTStatus();

  const [name, setName] = useState(listing?.name ?? '');
  const [shortDescription, setShortDescription] = useState(listing?.shortDescription ?? '');
  const [fullDescription, setFullDescription] = useState(listing?.fullDescription ?? '');
  const [category, setCategory] = useState<Category>(listing?.category ?? 'general');
  const [tagsRaw, setTagsRaw] = useState(listing?.tags.join(', ') ?? '');
  const [utility, setUtility] = useState(listing?.utility ?? '');
  const [process, setProcess] = useState(listing?.process ?? '');
  const [benefits, setBenefits] = useState(listing?.benefits ?? '');
  const [feesOverview, setFeesOverview] = useState(listing?.feesOverview ?? '');
  const [feesPricing, setFeesPricing] = useState(listing?.feesPricing ?? '');
  const [feesCosts, setFeesCosts] = useState(listing?.feesCosts ?? '');
  const [chains, setChains] = useState<string[]>(listing?.supportedChains ?? []);
  const [networkLayer, setNetworkLayer] = useState<NetworkLayer>(listing?.networkLayer ?? 'L1');
  const [websiteUrl, setWebsiteUrl] = useState(listing?.websiteUrl ?? '');
  const [socialLinks, setSocialLinks] = useState<KxLinkRow[]>(
    listing?.socialLinks.length ? listing.socialLinks : [{ label: '', url: '' }],
  );
  const [documentationLinks, setDocumentationLinks] = useState<KxLinkRow[]>(
    listing?.documentationLinks.length ? listing.documentationLinks : [{ label: '', url: '' }],
  );
  const [actionButtons, setActionButtons] = useState<KxLinkRow[]>(
    listing?.actionButtons.length ? listing.actionButtons : [{ label: '', url: '' }],
  );
  const [featureImageCid, setFeatureImageCid] = useState<string | null>(listing?.featureImageCid ?? null);
  const [featureImageName, setFeatureImageName] = useState<string | null>(null);
  const initialFeatureUrl = normalizeIpfsUrlForForm(listing?.featureImageUrl, listing?.featureImageCid);
  const [featureImageUrl, setFeatureImageUrl] = useState(initialFeatureUrl);
  const [featureImageSource, setFeatureImageSource] = useState<'url' | 'file'>(() =>
    initialFeatureUrl ? 'url' : 'file',
  );
  const [logoCid, setLogoCid] = useState<string | null>(listing?.logoCid ?? null);
  const [logoName, setLogoName] = useState<string | null>(null);
  const initialLogoUrl = normalizeIpfsUrlForForm(listing?.logoUrl, listing?.logoCid);
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [logoSource, setLogoSource] = useState<'url' | 'file'>(() => (initialLogoUrl ? 'url' : 'file'));
  const [galleryCids, setGalleryCids] = useState<string[]>(listing?.galleryCids ?? []);
  const [galleryFileNames, setGalleryFileNames] = useState<string[]>(listing?.galleryFileNames ?? []);
  const [galleryUrlsRaw, setGalleryUrlsRaw] = useState((listing?.galleryUrls ?? []).join('\n'));
  const [gallerySource, setGallerySource] = useState<'url' | 'file'>(() =>
    listing?.galleryUrls?.length ? 'url' : 'file',
  );
  const [optionalFileLinks, setOptionalFileLinks] = useState<KxLinkRow[]>(
    listing?.optionalFileUrls?.length ? listing.optionalFileUrls : [{ label: '', url: '' }],
  );
  const [contactX, setContactX] = useState(listing?.contactX ?? listing?.contactEmail ?? '');
  const [contactTelegram, setContactTelegram] = useState(listing?.contactTelegram ?? '');
  const [contactDiscord, setContactDiscord] = useState(listing?.contactDiscord ?? '');
  const [additionalNotes, setAdditionalNotes] = useState(listing?.additionalNotes ?? '');
  const [paymentCurrency, setPaymentCurrency] = useState<StorePaymentCurrency>(
    listing?.paymentCurrency ?? 'KAS',
  );
  const [step, setStep] = useState<'form' | 'payment' | 'complete'>('form');
  const [featuredPlacementEnabled, setFeaturedPlacementEnabled] = useState(false);
  const [highlightBadgeEnabled, setHighlightBadgeEnabled] = useState(false);
  useEffect(() => {
    if (!listing) return;
    setName(listing.name);
    setShortDescription(listing.shortDescription);
    setFullDescription(listing.fullDescription);
    setCategory(listing.category);
    setTagsRaw(listing.tags.join(', '));
    setUtility(listing.utility);
    setProcess(listing.process ?? '');
    setBenefits(listing.benefits ?? '');
    setFeesOverview(listing.feesOverview ?? '');
    setFeesPricing(listing.feesPricing ?? '');
    setFeesCosts(listing.feesCosts ?? '');
    setChains(listing.supportedChains ?? []);
    setNetworkLayer(listing.networkLayer);
    setWebsiteUrl(listing.websiteUrl);
    setSocialLinks(listing.socialLinks.length ? listing.socialLinks : [{ label: '', url: '' }]);
    setDocumentationLinks(
      listing.documentationLinks.length ? listing.documentationLinks : [{ label: '', url: '' }],
    );
    setActionButtons(listing.actionButtons.length ? listing.actionButtons : [{ label: '', url: '' }]);
    setFeatureImageCid(listing.featureImageCid ?? null);
    setFeatureImageUrl(normalizeIpfsUrlForForm(listing.featureImageUrl, listing.featureImageCid));
    setFeatureImageSource(
      normalizeIpfsUrlForForm(listing.featureImageUrl, listing.featureImageCid) ? 'url' : 'file',
    );
    setLogoCid(listing.logoCid ?? null);
    setLogoUrl(normalizeIpfsUrlForForm(listing.logoUrl, listing.logoCid));
    setLogoSource(normalizeIpfsUrlForForm(listing.logoUrl, listing.logoCid) ? 'url' : 'file');
    setGalleryCids(listing.galleryCids);
    setGalleryFileNames(listing.galleryFileNames);
    setGalleryUrlsRaw((listing.galleryUrls ?? []).join('\n'));
    setGallerySource(listing.galleryUrls?.length ? 'url' : 'file');
    setOptionalFileLinks(
      listing.optionalFileUrls?.length ? listing.optionalFileUrls : [{ label: '', url: '' }],
    );
    setContactX(listing.contactX ?? listing.contactEmail ?? '');
    setContactTelegram(listing.contactTelegram ?? '');
    setContactDiscord(listing.contactDiscord ?? '');
    setAdditionalNotes(listing.additionalNotes ?? '');
    setPaymentCurrency(listing.paymentCurrency);
  }, [listing]);

  const baseFeeKas = isEdit ? DAPP_LISTING_ACTION_FEE_KAS : DAPP_LISTING_FEE_KAS;
  const modulesFeeKas =
    (featuredPlacementEnabled ? PREMIUM_FEATURED_FEE_KAS : 0) +
    (highlightBadgeEnabled ? PREMIUM_HIGHLIGHT_FEE_KAS : 0);
  const listingFee = useMemo(
    () => calculateDirectoryListingFeeKas(baseFeeKas + modulesFeeKas, krexTier, nftStatus),
    [baseFeeKas, modulesFeeKas, krexTier, nftStatus],
  );
  const feeLabel = useMemo(
    () => listingActionFeeLabel(paymentCurrency, listingFee.effectiveKas),
    [paymentCurrency, listingFee.effectiveKas],
  );
  const logoPreviewUrl =
    logoSource === 'url' && logoUrl.trim()
      ? logoUrl.trim()
      : logoCid
        ? getBestGatewayUrl(logoCid)
        : null;

  const hasFeatureImage =
    featureImageSource === 'url' ? Boolean(featureImageUrl.trim()) : Boolean(featureImageCid);

  const canSubmit = Boolean(
    state.isConnected &&
      name.trim() &&
      shortDescription.trim() &&
      htmlToPlainText(fullDescription).trim() &&
      hasFeatureImage &&
      !isProcessing &&
      !isUploading,
  );

  const previewDraft = useMemo(
    () => ({
      name,
      shortDescription,
      fullDescription,
      category,
      tags: parseTags(tagsRaw),
      networkLayer,
      supportedChains: chains,
      websiteUrl,
      socialLinks: cleanLinks(socialLinks),
      utility,
      logoUrl: logoPreviewUrl,
      featureImageUrl:
        featureImageSource === 'url' && featureImageUrl.trim()
          ? featureImageUrl.trim()
          : featureImageCid
            ? getBestGatewayUrl(featureImageCid)
            : null,
    }),
    [
      name,
      shortDescription,
      fullDescription,
      category,
      tagsRaw,
      networkLayer,
      chains,
      websiteUrl,
      socialLinks,
      utility,
      logoPreviewUrl,
      featureImageSource,
      featureImageUrl,
      featureImageCid,
    ],
  );

  const fieldLabel = (key: string) => {
    const def = getFieldDef(key);
    return (
      <KxFormFieldLabel tooltip={def?.tooltip} layoutHint={def?.layoutHint} required={def?.required}>
        {def?.label ?? key}
      </KxFormFieldLabel>
    );
  };

  const uploadFile = async (file: File, maxSizeMb = IMAGE_MAX_SIZE_MB): Promise<string | null> => {
    const maxSize = maxSizeMb * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`${file.name} must be under ${maxSizeMb}MB`);
      return null;
    }
    return upload(file, { filename: file.name });
  };

  const handleFeatureImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const cid = await uploadFile(file);
    if (cid) {
      setFeatureImageCid(cid);
      setFeatureImageName(file.name);
      setFeatureImageUrl(normalizeIpfsUrlForForm(null, cid));
      setFeatureImageSource('url');
      setError(null);
    }
    e.target.value = '';
  };

  const handleLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const cid = await uploadFile(file, IMAGE_MAX_SIZE_MB);
    if (cid) {
      setLogoCid(cid);
      setLogoName(file.name);
      setLogoUrl(normalizeIpfsUrlForForm(null, cid));
      setLogoSource('url');
      setError(null);
    }
    e.target.value = '';
  };

  const handleGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const cids: string[] = [];
    const names: string[] = [];
    for (const file of files) {
      const cid = await uploadFile(file);
      if (cid) {
        cids.push(cid);
        names.push(file.name);
      }
    }
    if (cids.length) {
      setGalleryCids((prev) => [...prev, ...cids]);
      setGalleryFileNames((prev) => [...prev, ...names]);
      setGalleryUrlsRaw('');
    }
    e.target.value = '';
  };

  const parsedGalleryUrls = galleryUrlsRaw
    .split(/[\n,;]/)
    .map((url) => url.trim())
    .filter(Boolean)
    .slice(0, 12);

  const buildPayload = () => {
    const nextOptionalFileUrls = cleanLinks(optionalFileLinks);
    return {
    name: name.trim(),
    shortDescription: shortDescription.trim(),
    fullDescription: fullDescription.trim(),
    category,
    tags: parseTags(tagsRaw),
    utility: utility.trim() || shortDescription.trim(),
    process: process.trim(),
    benefits: benefits.trim(),
    feesOverview: feesOverview.trim(),
    feesPricing: feesPricing.trim(),
    feesCosts: feesCosts.trim(),
    supportedChains: chains,
    networkLayer,
    websiteUrl: websiteUrl.trim(),
    socialLinks: cleanLinks(socialLinks),
    documentationLinks: cleanLinks(documentationLinks),
    actionButtons: cleanLinks(actionButtons),
    featureImageCid: featureImageSource === 'file' ? featureImageCid || undefined : undefined,
    featureImageUrl:
      featureImageSource === 'url' && featureImageUrl.trim() ? featureImageUrl.trim() : undefined,
    logoCid: logoSource === 'file' ? logoCid || undefined : undefined,
    logoUrl: logoSource === 'url' && logoUrl.trim() ? logoUrl.trim() : undefined,
    galleryCids: gallerySource === 'file' ? galleryCids : [],
    galleryFileNames: gallerySource === 'file' ? galleryFileNames : [],
    galleryUrls: gallerySource === 'url' ? parsedGalleryUrls : [],
    optionalFileCids:
      nextOptionalFileUrls.length > 0 ? [] : (listing?.optionalFileCids ?? []),
    optionalFileNames:
      nextOptionalFileUrls.length > 0 ? [] : (listing?.optionalFileNames ?? []),
    optionalFileUrls: nextOptionalFileUrls,
    contactX: contactX.trim() || undefined,
    contactTelegram: contactTelegram.trim() || undefined,
    contactDiscord: contactDiscord.trim() || undefined,
    additionalNotes: additionalNotes.trim() || undefined,
    paymentCurrency,
    submitterAddress: state.address!,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !state.address) return;

    setError(null);
    setStep('payment');

    try {
      const feeTxHash = await payActionFee(paymentCurrency, listingFee.effectiveKas);

      if (isEdit && listing) {
        const updated = updateDirectoryListing(listing.id, state.address, {
          ...buildPayload(),
          feeTxHash,
          feeAmountKAS: listingFee.effectiveKas,
        });
        if (!updated) throw new Error('Failed to update listing');
      } else {
        saveDirectoryListing({
          ...buildPayload(),
          feeTxHash,
          feeAmountKAS: listingFee.effectiveKas,
        });

        const txNorm = extractKaspaTransactionId(feeTxHash) ?? feeTxHash;
        appendHubActivityEarn({
          walletRaw: state.address,
          source: 'dapp_directory_list',
          redeemableDelta: HUB_EARN_POINTS.dappDirectoryList,
          krexBalance,
          idempotencyKey: `dapps:listing:${txNorm}`,
          meta: { name: name.trim() },
        });
      }

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
          {isEdit ? 'Processing update payment...' : 'Processing listing payment...'}
        </p>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">?</div>
        <p className="text-zinc-900 dark:text-zinc-100 font-black uppercase tracking-widest">
          {isEdit ? 'Listing updated' : 'Listing submitted'}
        </p>
        <p className="text-sm text-zinc-500 mt-2">Redirecting to your listings...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`${KX_FORM_GRID} items-start`}>
      <div className="flex min-w-0 flex-col gap-6">
        <div className={`${KX_FORM_PANEL} space-y-6`}>
          <div>
            <DAppSectionHeader title="Main content" className="mb-3" />
            <h3 className="mb-4 text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              {isEdit ? 'Edit Directory Listing' : 'List a DApp'}
            </h3>
            <p className="kx-body">
              {isEdit
                ? `Updates require a ${feeLabel} fee. Estimated total: ${listingFee.effectiveKas} KAS.`
                : `Fill in your project profile for the public directory. Estimated cost: ${listingFee.effectiveKas} KAS${listingFee.discountPercent > 0 ? ' (KREX holder discount)' : ''}.`}
            </p>
          </div>

          <div className="k-form-group">
            {fieldLabel('name')}
            <input
              type="text"
              className="k-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your dApp, game, or tool name"
              required
            />
          </div>

          <div className="k-form-group">
            {fieldLabel('shortDescription')}
            <textarea
              className="k-textarea min-h-[80px]"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="One or two sentences for cards and search"
              required
            />
          </div>

          <div className="k-form-group">
            <KxFormFieldLabel required>Full description / overview</KxFormFieldLabel>
            <KxRichTextEditor
              value={fullDescription}
              onChange={setFullDescription}
              placeholder="Detailed overview of your project"
              minRows={12}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
              <label className="k-label">Layer *</label>
              <KxSegmentToggle
                value={networkLayer}
                onChange={setNetworkLayer}
                options={[
                  { value: 'L1', label: 'L1' },
                  { value: 'L2', label: 'L2' },
                  { value: 'multichain', label: 'Multi' },
                ]}
                ariaLabel="Network layer"
              />
            </div>
          </div>

          <div className="k-form-group">
            <label className="k-label">Tags</label>
            <input
              type="text"
              className="k-input"
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              placeholder="defi, gaming, nft (comma separated)"
            />
          </div>

          <div className="k-form-group">
            <label className="k-label">Utility / use case</label>
            <textarea
              className="k-textarea min-h-[80px]"
              value={utility}
              onChange={(e) => setUtility(e.target.value)}
              placeholder="What problem does your project solve?"
            />
          </div>

          <div className="k-form-group">
            <label className="k-label">How to use</label>
            <textarea
              className="k-textarea min-h-[80px]"
              value={process}
              onChange={(e) => setProcess(e.target.value)}
              placeholder="Explain how users interact with your project"
            />
          </div>

          <div className="k-form-group">
            <label className="k-label">Benefits</label>
            <textarea
              className="k-textarea min-h-[80px]"
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
              placeholder="Key benefits for users or communities"
            />
          </div>

          <div className="space-y-4 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Fees &amp; costs (public page)</h3>
            <div className="k-form-group">
              <label className="k-label">Fees overview</label>
              <textarea
                className="k-textarea min-h-[80px]"
                value={feesOverview}
                onChange={(e) => setFeesOverview(e.target.value)}
                placeholder="Summarize any fees users should expect"
              />
            </div>
            <div className="k-form-group">
              <label className="k-label">Pricing details</label>
              <textarea
                className="k-textarea min-h-[80px]"
                value={feesPricing}
                onChange={(e) => setFeesPricing(e.target.value)}
                placeholder="List prices, tiers, or subscription models"
              />
            </div>
            <div className="k-form-group">
              <label className="k-label">Additional costs</label>
              <textarea
                className="k-textarea min-h-[80px]"
                value={feesCosts}
                onChange={(e) => setFeesCosts(e.target.value)}
                placeholder="Gas, network, or service costs"
              />
            </div>
          </div>

          <div className="k-form-group">
            <label className="k-label">Supported chains</label>
            <KxMultiSelectDropdown
              values={chains}
              onChange={setChains}
              options={CHAIN_OPTIONS}
              ariaLabel="Supported chains"
              placeholder="Select chains"
              triggerClassName="k-control-btn w-full min-w-0 h-10"
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

          <KxLinkRowsEditor label="Social links" rows={socialLinks} onChange={setSocialLinks} addLabel="Add social link" />
          <KxLinkRowsEditor
            label="Documentation links"
            rows={documentationLinks}
            onChange={setDocumentationLinks}
            addLabel="Add documentation link"
          />
          <KxLinkRowsEditor
            label="Action buttons"
            rows={actionButtons}
            onChange={setActionButtons}
            addLabel="Add action button"
          />

          <div className="k-form-group">
            <label className="k-label">Custom logo (optional)</label>
            <div className="space-y-3">
              <ImageSourceToggle value={logoSource} onChange={setLogoSource} />
              {logoSource === 'url' ? (
                <input
                  type="url"
                  className="k-input"
                  value={logoUrl}
                  onChange={(e) => {
                    setLogoUrl(normalizeIpfsUrlForForm(e.target.value));
                    setLogoCid(null);
                    setLogoName(null);
                  }}
                  placeholder="https://..."
                />
              ) : (
                <StoreFileUpload
                  label=""
                  hint="Square PNG, JPG, or WebP under 500 KB"
                  accept="image/*"
                  fileName={logoName ?? (logoCid && !logoName ? 'Uploaded logo' : null)}
                  onClear={() => {
                    setLogoCid(null);
                    setLogoName(null);
                  }}
                  onChange={handleLogo}
                  disabled={isUploading}
                />
              )}
            </div>
          </div>

          <div className="k-form-group">
            <label className="k-label">Featured image *</label>
            <div className="space-y-3">
              <ImageSourceToggle value={featureImageSource} onChange={setFeatureImageSource} />
              {featureImageSource === 'url' ? (
                <input
                  type="url"
                  className="k-input"
                  value={featureImageUrl}
                  onChange={(e) => {
                    setFeatureImageUrl(normalizeIpfsUrlForForm(e.target.value));
                    setFeatureImageCid(null);
                    setFeatureImageName(null);
                  }}
                  placeholder="https://..."
                  required={featureImageSource === 'url'}
                />
              ) : (
                <StoreFileUpload
                  label=""
                  hint="PNG, JPG, or WebP under 500 KB"
                  accept="image/*"
                  fileName={
                    featureImageName ??
                    (featureImageCid && !featureImageName ? 'Uploaded feature image' : null)
                  }
                  onClear={() => {
                    setFeatureImageCid(null);
                    setFeatureImageName(null);
                  }}
                  onChange={handleFeatureImage}
                  disabled={isUploading}
                />
              )}
            </div>
          </div>

          <div className="k-form-group">
            <label className="k-label">Gallery / screenshots</label>
            <div className="space-y-3">
              <ImageSourceToggle value={gallerySource} onChange={setGallerySource} />
              {gallerySource === 'url' ? (
                <textarea
                  className="k-textarea min-h-[100px]"
                  value={galleryUrlsRaw}
                  onChange={(e) => {
                    setGalleryUrlsRaw(e.target.value);
                    setGalleryCids([]);
                    setGalleryFileNames([]);
                  }}
                  placeholder="One image URL per line"
                />
              ) : (
                <StoreFileUpload
                  label=""
                  hint="Images under 500 KB each"
                  accept="image/*"
                  multiple
                  fileCount={galleryCids.length}
                  onChange={handleGallery}
                  disabled={isUploading}
                />
              )}
            </div>
          </div>

          <KxLinkRowsEditor
            label="Optional files (URL links only)"
            rows={optionalFileLinks}
            onChange={setOptionalFileLinks}
            addLabel="Add file link"
          />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="k-form-group">
              <label className="k-label">X handle</label>
              <input type="text" className="k-input" value={contactX} onChange={(e) => setContactX(e.target.value)} placeholder="@username" />
            </div>
            <div className="k-form-group">
              <label className="k-label">Telegram</label>
              <input type="text" className="k-input" value={contactTelegram} onChange={(e) => setContactTelegram(e.target.value)} placeholder="@handle or t.me/..." />
            </div>
            <div className="k-form-group">
              <label className="k-label">Discord</label>
              <input type="text" className="k-input" value={contactDiscord} onChange={(e) => setContactDiscord(e.target.value)} placeholder="Server invite or username" />
            </div>
          </div>

          <div className="k-form-group !mb-0">
            <label className="k-label">Additional notes</label>
            <textarea
              className="k-textarea min-h-[80px]"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Anything else reviewers or visitors should know"
            />
          </div>
        </div>

        <div id="dapps-dashboard-modules" className={`${KX_FORM_PANEL} my-2 scroll-mt-24 space-y-6 py-10 sm:py-12`}>
          <div className="space-y-2">
            <DAppSectionHeader title="Premium modules" className="mb-0" />
            <h4 className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              Optional premium features
            </h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Toggle modules on to add them to your total. They activate when you pay and publish.
            </p>
          </div>

          <div className={KX_PREMIUM_MODULE_CARD}>
            <KxInFormPremiumRow
              flat
              accent="hub"
              title="Featured placement"
              description="Promote this listing in highlighted discovery placements across the dApps directory."
              priceLabel={`+${PREMIUM_FEATURED_FEE_KAS} KAS`}
              checked={featuredPlacementEnabled}
              onToggle={() => setFeaturedPlacementEnabled((v) => !v)}
            />
            {featuredPlacementEnabled ? (
              <div className="mt-5 space-y-3 border-t border-zinc-200 pt-5 dark:border-zinc-700">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Featured placement is enabled. Spotlights appear in directory discovery rails after payment confirms.
                </p>
              </div>
            ) : null}
          </div>

          <div className={KX_PREMIUM_MODULE_CARD}>
            <KxInFormPremiumRow
              flat
              accent="hub"
              title="Highlight badge"
              description="Add a highlight badge on the public listing card to stand out in search results."
              priceLabel={`+${PREMIUM_HIGHLIGHT_FEE_KAS} KAS`}
              checked={highlightBadgeEnabled}
              onToggle={() => setHighlightBadgeEnabled((v) => !v)}
            />
            {highlightBadgeEnabled ? (
              <div className="mt-5 space-y-3 border-t border-zinc-200 pt-5 dark:border-zinc-700">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Highlight badge content opens inside this module container and is included in the calculation breakdown.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className={KX_FORM_STICKY_RAIL}>
        <HubBenefitsPanel variant="panel" />
        <DAppListingPreview draft={previewDraft} submitterAddress={state.address ?? 'kaspa:preview'} compact />

        <aside className={KX_CALCULATION_ASIDE}>
          <DAppSectionHeader title="Calculation breakdown" className="mb-1" />
          <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            <div className="flex justify-between">
              <span>Base fee</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{baseFeeKas} KAS</span>
            </div>
            {featuredPlacementEnabled ? (
              <div className="flex justify-between gap-2">
                <span className="truncate">Featured placement</span>
                <span className="shrink-0 font-semibold text-zinc-900 dark:text-zinc-100">+{PREMIUM_FEATURED_FEE_KAS} KAS</span>
              </div>
            ) : null}
            {highlightBadgeEnabled ? (
              <div className="flex justify-between gap-2">
                <span className="truncate">Highlight badge</span>
                <span className="shrink-0 font-semibold text-zinc-900 dark:text-zinc-100">+{PREMIUM_HIGHLIGHT_FEE_KAS} KAS</span>
              </div>
            ) : null}
            {modulesFeeKas > 0 ? (
              <div className="flex justify-between border-t border-zinc-200 pt-1.5 dark:border-zinc-700">
                <span>Modules subtotal</span>
                <span className="font-semibold text-[#02abb8]">{modulesFeeKas} KAS</span>
              </div>
            ) : null}
            {listingFee.discountPercent > 0 ? (
              <div className="flex justify-between">
                <span>KREX discount</span>
                <span className="font-semibold text-emerald-600">-{listingFee.discountPercent}%</span>
              </div>
            ) : null}
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Pay with *</span>
            <HubPaymentCurrencyDropdown
              value={paymentCurrency}
              onChange={setPaymentCurrency}
              options={buildKasKrexMenuOptions()}
              ariaLabel="Listing fee currency"
            />
          </div>

          <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
            <p className="text-xs uppercase tracking-widest text-zinc-500">Total to pay</p>
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{feeLabel}</p>
          </div>

          <div className="rounded-xl border border-[#02abb8]/25 bg-[#02abb8]/10 p-3 text-sm text-zinc-700 dark:text-zinc-300">
            One Kaspa L1 payment covers the listing and any enabled modules. Ensure your wallet has enough balance.
          </div>

          {!isEdit ? (
            <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-3 dark:border-cyan-900/40 dark:bg-cyan-950/25">
              <p className="text-xs font-black uppercase tracking-widest text-cyan-900 dark:text-cyan-100">Hub points</p>
              <p className="text-xl font-black text-cyan-900 dark:text-cyan-100">+{HUB_EARN_POINTS.dappDirectoryList} pts</p>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full k-control-btn !border-[#02abb8] !bg-[#02abb8] !text-white hover:!bg-[#028a94] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : isProcessing ? 'Processing...' : isEdit ? 'Save changes' : 'Create Listing'}
          </button>

          <HubFlowProgress steps={getHubFlowPreset('hubPublish')} busy={isProcessing || isUploading} />
        </aside>
      </div>
    </form>
  );
}
