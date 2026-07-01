'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useIPFSUpload } from '@/lib/ipfs/hooks';
import { categories, type Category } from '@/lib/categories';
import { KxSegmentToggle } from '@/components/ui/KxSegmentToggle';
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
import { STORE_PAYMENT_CURRENCIES, type StorePaymentCurrency } from '@/lib/store/currencies';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { appendHubActivityEarn } from '@/lib/rewards/appendHubActivityEarn';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import { getCategoryById } from '@/lib/categories';
import { DAppIcon } from '@/components/dapps/DAppIcon';
import { KxMultiSelectDropdown } from '@/components/ui/KxMultiSelectDropdown';
import { DIRECTORY_LISTING_CHAINS } from '@/lib/dapps/listingChains';

const LISTING_CATEGORIES = categories.filter((c) => c.id !== 'all');
const IMAGE_MAX_SIZE_MB = 0.5;

const CHAIN_OPTIONS = DIRECTORY_LISTING_CHAINS.map((chain) => ({
  value: chain,
  label: chain,
}));

import { KxLinkRowsEditor, type KxLinkRow } from '@/components/ui/KxLinkRowsEditor';

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
  const [featureImageUrl, setFeatureImageUrl] = useState(listing?.featureImageUrl ?? '');
  const [featureImageSource, setFeatureImageSource] = useState<'url' | 'file'>(() =>
    listing?.featureImageUrl ? 'url' : 'file',
  );
  const [logoCid, setLogoCid] = useState<string | null>(listing?.logoCid ?? null);
  const [logoName, setLogoName] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState(listing?.logoUrl ?? '');
  const [logoSource, setLogoSource] = useState<'url' | 'file'>(() =>
    listing?.logoUrl ? 'url' : 'file',
  );
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
    setFeatureImageUrl(listing.featureImageUrl ?? '');
    setFeatureImageSource(listing.featureImageUrl ? 'url' : 'file');
    setLogoCid(listing.logoCid ?? null);
    setLogoUrl(listing.logoUrl ?? '');
    setLogoSource(listing.logoUrl ? 'url' : 'file');
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
  const listingFee = useMemo(
    () => calculateDirectoryListingFeeKas(baseFeeKas, krexTier, nftStatus),
    [baseFeeKas, krexTier, nftStatus],
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
  const listingCategory = getCategoryById(category);

  const hasFeatureImage =
    featureImageSource === 'url' ? Boolean(featureImageUrl.trim()) : Boolean(featureImageCid);

  const canSubmit = Boolean(
    state.isConnected &&
      name.trim() &&
      shortDescription.trim() &&
      fullDescription.trim() &&
      hasFeatureImage &&
      !isProcessing &&
      !isUploading,
  );

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
      setFeatureImageUrl('');
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
      setLogoUrl('');
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
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-8">
        <div className="space-y-6">
          <div className="k-form-group">
            <label className="k-label">Project name *</label>
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
            <label className="k-label">Short description *</label>
            <textarea
              className="k-textarea min-h-[80px]"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="One or two sentences for cards and search"
              required
            />
          </div>

          <div className="k-form-group">
            <label className="k-label">Full description / overview *</label>
            <textarea
              className="k-textarea min-h-[160px]"
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              placeholder="Detailed overview of your project"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
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
            <p className="text-xs text-zinc-500 mt-1.5">
              Choose every network your dApp supports ({DIRECTORY_LISTING_CHAINS.join(', ')}).
            </p>
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

          <KxLinkRowsEditor
            label="Social links"
            rows={socialLinks}
            onChange={setSocialLinks}
            addLabel="Add social link"
          />
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
                <div>
                  <input
                    type="url"
                    className="k-input"
                    value={logoUrl}
                    onChange={(e) => {
                      setLogoUrl(e.target.value);
                      setLogoCid(null);
                      setLogoName(null);
                    }}
                    placeholder="https://..."
                  />
                  <p className="text-xs text-zinc-500 mt-1.5">
                    Direct HTTPS image URL. Recommended square ratio, max 500 KB file size when hosted.
                  </p>
                </div>
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
                <div>
                  <input
                    type="url"
                    className="k-input"
                    value={featureImageUrl}
                    onChange={(e) => {
                      setFeatureImageUrl(e.target.value);
                      setFeatureImageCid(null);
                      setFeatureImageName(null);
                    }}
                    placeholder="https://..."
                    required={featureImageSource === 'url'}
                  />
                  <p className="text-xs text-zinc-500 mt-1.5">
                    Direct HTTPS image URL. PNG, JPG, or WebP under 500 KB when hosted.
                  </p>
                </div>
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
                <div>
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
                  <p className="text-xs text-zinc-500 mt-1.5">
                    Direct HTTPS image URLs. Max 500 KB per file when hosted.
                  </p>
                </div>
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
          <p className="text-xs text-zinc-500 -mt-4">
            PDFs, docs, or assets linked via HTTPS. Direct uploads are not supported.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="k-form-group">
              <label className="k-label">X handle</label>
              <input
                type="text"
                className="k-input"
                value={contactX}
                onChange={(e) => setContactX(e.target.value)}
                placeholder="@username"
              />
            </div>
            <div className="k-form-group">
              <label className="k-label">Telegram</label>
              <input
                type="text"
                className="k-input"
                value={contactTelegram}
                onChange={(e) => setContactTelegram(e.target.value)}
                placeholder="@handle or t.me/..."
              />
            </div>
            <div className="k-form-group">
              <label className="k-label">Discord</label>
              <input
                type="text"
                className="k-input"
                value={contactDiscord}
                onChange={(e) => setContactDiscord(e.target.value)}
                placeholder="Server invite or username"
              />
            </div>
          </div>

          <div className="k-form-group">
            <label className="k-label">Additional notes</label>
            <textarea
              className="k-textarea min-h-[80px]"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Anything else reviewers or visitors should know"
            />
          </div>
        </div>

        <aside className="xl:sticky xl:top-6 h-fit space-y-4">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Card preview</p>
            <div className="flex items-start gap-3">
              <DAppIcon
                dAppName={name.trim() || 'Project'}
                category={category}
                imageSrc={logoPreviewUrl ?? undefined}
                size={48}
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                  {name.trim() || 'Project name'}
                </p>
                {listingCategory ? (
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    {listingCategory.emoji} {listingCategory.name}
                  </p>
                ) : null}
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                  {shortDescription.trim() || 'Short description appears on listing cards.'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-5 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
              {isEdit ? 'Update listing' : 'Listing fee'}
            </h3>
            <div>
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block normal-case tracking-normal">
                Pay with *
              </span>
              <KxSegmentToggle
                value={paymentCurrency}
                onChange={setPaymentCurrency}
                options={STORE_PAYMENT_CURRENCIES.map((cur) => ({ value: cur, label: cur }))}
                ariaLabel="Listing fee currency"
              />
            </div>
            <p className="kx-body">
              {isEdit ? 'Update fee' : 'One-time directory fee'}:{' '}
              {listingFee.discountPercent > 0 ? (
                <span className="line-through text-zinc-400 mr-1">
                  {listingActionFeeLabel(paymentCurrency, listingFee.baseKas)}
                </span>
              ) : null}
              <span className="font-black text-[#02abb8]">{feeLabel}</span>
            </p>
            {listingFee.discountPercent > 0 ? (
              <p className="text-xs text-green-700 dark:text-green-400">
                KREX tier discount applied ({listingFee.discountPercent}% off)
              </p>
            ) : null}
            <p className="text-xs text-zinc-500">
              Paid to the Kasparex treasury when you {isEdit ? 'save changes' : 'publish'}.
            </p>

            {error ? (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-800 dark:text-red-300">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full k-cta-primary !justify-center !tracking-normal disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading
                ? 'Uploading...'
                : isProcessing
                  ? 'Processing...'
                  : isEdit
                    ? 'Save changes'
                    : 'PUBLISH'}
            </button>
          </div>

          {!isEdit ? (
            <div className="rounded-2xl border border-cyan-200 dark:border-cyan-900/40 bg-cyan-50 dark:bg-cyan-950/25 p-5 space-y-2">
              <h3 className="text-sm font-black uppercase tracking-widest text-cyan-900 dark:text-cyan-100">
                Hub points
              </h3>
              <p className="text-2xl font-black text-cyan-900 dark:text-cyan-100">
                +{HUB_EARN_POINTS.dappDirectoryList} pts
              </p>
              <p className="text-xs text-cyan-800/90 dark:text-cyan-300/80 leading-relaxed">
                Redeemable Hub points awarded once when you publish a new listing.
              </p>
            </div>
          ) : null}
        </aside>
      </div>
    </form>
  );
}
