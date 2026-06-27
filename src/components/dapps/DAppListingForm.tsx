'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useIPFSUpload } from '@/lib/ipfs/hooks';
import { categories, type Category } from '@/lib/categories';
import { KxSegmentToggle } from '@/components/ui/KxSegmentToggle';
import { KxFilterDropdown } from '@/components/ui/KxFilterDropdown';
import { StoreFileUpload } from '@/components/store/StoreFileUpload';
import { useDAppListingPayment } from '@/hooks/useDAppListingPayment';
import {
  DAPP_LISTING_ACTION_FEE_KAS,
  DAPP_LISTING_FEE_KAS,
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

const LISTING_CATEGORIES = categories.filter((c) => c.id !== 'all');

type LinkRow = { label: string; url: string };

function parseTags(raw: string): string[] {
  return raw
    .split(/[,#]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function parseList(raw: string): string[] {
  return raw
    .split(/[,;\n]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function cleanLinks(rows: LinkRow[]): DirectoryLink[] {
  return rows
    .map((r) => ({ label: r.label.trim(), url: r.url.trim() }))
    .filter((r) => r.label && r.url)
    .slice(0, 8);
}

function LinkRowsEditor({
  label,
  rows,
  onChange,
  addLabel,
}: {
  label: string;
  rows: LinkRow[];
  onChange: (rows: LinkRow[]) => void;
  addLabel: string;
}) {
  return (
    <div className="k-form-group">
      <label className="k-label">{label}</label>
      <div className="space-y-3">
        {rows.map((row, index) => (
          <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_1.5fr_auto] gap-2">
            <input
              type="text"
              className="k-input"
              value={row.label}
              placeholder="Label"
              onChange={(e) => {
                const next = [...rows];
                next[index] = { ...next[index], label: e.target.value };
                onChange(next);
              }}
            />
            <input
              type="url"
              className="k-input"
              value={row.url}
              placeholder="https://"
              onChange={(e) => {
                const next = [...rows];
                next[index] = { ...next[index], url: e.target.value };
                onChange(next);
              }}
            />
            <button
              type="button"
              className="k-control-btn text-xs"
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className="k-control-btn text-xs !border-cyan-500/30 !text-cyan-800 dark:!text-cyan-300"
          onClick={() => onChange([...rows, { label: '', url: '' }])}
        >
          {addLabel}
        </button>
      </div>
    </div>
  );
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
  const { payListingFee, payActionFee, isProcessing, error, setError } = useDAppListingPayment();

  const [name, setName] = useState(listing?.name ?? '');
  const [shortDescription, setShortDescription] = useState(listing?.shortDescription ?? '');
  const [fullDescription, setFullDescription] = useState(listing?.fullDescription ?? '');
  const [category, setCategory] = useState<Category>(listing?.category ?? 'general');
  const [tagsRaw, setTagsRaw] = useState(listing?.tags.join(', ') ?? '');
  const [utility, setUtility] = useState(listing?.utility ?? '');
  const [chainsRaw, setChainsRaw] = useState(listing?.supportedChains.join(', ') ?? '');
  const [networkLayer, setNetworkLayer] = useState<NetworkLayer>(listing?.networkLayer ?? 'L1');
  const [websiteUrl, setWebsiteUrl] = useState(listing?.websiteUrl ?? '');
  const [socialLinks, setSocialLinks] = useState<LinkRow[]>(
    listing?.socialLinks.length ? listing.socialLinks : [{ label: '', url: '' }],
  );
  const [documentationLinks, setDocumentationLinks] = useState<LinkRow[]>(
    listing?.documentationLinks.length ? listing.documentationLinks : [{ label: '', url: '' }],
  );
  const [actionButtons, setActionButtons] = useState<LinkRow[]>(
    listing?.actionButtons.length ? listing.actionButtons : [{ label: '', url: '' }],
  );
  const [featureImageCid, setFeatureImageCid] = useState<string | null>(listing?.featureImageCid ?? null);
  const [featureImageName, setFeatureImageName] = useState<string | null>(null);
  const [galleryCids, setGalleryCids] = useState<string[]>(listing?.galleryCids ?? []);
  const [galleryFileNames, setGalleryFileNames] = useState<string[]>(listing?.galleryFileNames ?? []);
  const [optionalFileCids, setOptionalFileCids] = useState<string[]>(listing?.optionalFileCids ?? []);
  const [optionalFileNames, setOptionalFileNames] = useState<string[]>(listing?.optionalFileNames ?? []);
  const [contactEmail, setContactEmail] = useState(listing?.contactEmail ?? '');
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
    setChainsRaw(listing.supportedChains.join(', '));
    setNetworkLayer(listing.networkLayer);
    setWebsiteUrl(listing.websiteUrl);
    setSocialLinks(listing.socialLinks.length ? listing.socialLinks : [{ label: '', url: '' }]);
    setDocumentationLinks(
      listing.documentationLinks.length ? listing.documentationLinks : [{ label: '', url: '' }],
    );
    setActionButtons(listing.actionButtons.length ? listing.actionButtons : [{ label: '', url: '' }]);
    setFeatureImageCid(listing.featureImageCid ?? null);
    setGalleryCids(listing.galleryCids);
    setGalleryFileNames(listing.galleryFileNames);
    setOptionalFileCids(listing.optionalFileCids);
    setOptionalFileNames(listing.optionalFileNames);
    setContactEmail(listing.contactEmail);
    setContactTelegram(listing.contactTelegram ?? '');
    setContactDiscord(listing.contactDiscord ?? '');
    setAdditionalNotes(listing.additionalNotes ?? '');
    setPaymentCurrency(listing.paymentCurrency);
  }, [listing]);

  const actionFeeKas = isEdit ? DAPP_LISTING_ACTION_FEE_KAS : DAPP_LISTING_FEE_KAS;
  const feeLabel = useMemo(
    () => listingActionFeeLabel(paymentCurrency, actionFeeKas),
    [paymentCurrency, actionFeeKas],
  );

  const canSubmit = Boolean(
    state.isConnected &&
      name.trim() &&
      shortDescription.trim() &&
      fullDescription.trim() &&
      featureImageCid &&
      !isProcessing &&
      !isUploading,
  );

  const uploadFile = async (file: File, maxSizeMb = 2): Promise<string | null> => {
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
    }
    e.target.value = '';
  };

  const handleOptionalFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const cids: string[] = [];
    const names: string[] = [];
    for (const file of files) {
      const cid = await uploadFile(file, 5);
      if (cid) {
        cids.push(cid);
        names.push(file.name);
      }
    }
    if (cids.length) {
      setOptionalFileCids((prev) => [...prev, ...cids]);
      setOptionalFileNames((prev) => [...prev, ...names]);
    }
    e.target.value = '';
  };

  const buildPayload = () => ({
    name: name.trim(),
    shortDescription: shortDescription.trim(),
    fullDescription: fullDescription.trim(),
    category,
    tags: parseTags(tagsRaw),
    utility: utility.trim() || shortDescription.trim(),
    supportedChains: parseList(chainsRaw),
    networkLayer,
    websiteUrl: websiteUrl.trim(),
    socialLinks: cleanLinks(socialLinks),
    documentationLinks: cleanLinks(documentationLinks),
    actionButtons: cleanLinks(actionButtons),
    featureImageCid: featureImageCid || undefined,
    galleryCids,
    galleryFileNames,
    optionalFileCids,
    optionalFileNames,
    contactEmail: contactEmail.trim(),
    contactTelegram: contactTelegram.trim() || undefined,
    contactDiscord: contactDiscord.trim() || undefined,
    additionalNotes: additionalNotes.trim() || undefined,
    paymentCurrency,
    submitterAddress: state.address!,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !state.address) return;

    setError(null);
    setStep('payment');

    try {
      const feeTxHash = isEdit
        ? await payActionFee(paymentCurrency, actionFeeKas)
        : await payListingFee(paymentCurrency);

      if (isEdit && listing) {
        const updated = updateDirectoryListing(listing.id, state.address, {
          ...buildPayload(),
          feeTxHash,
          feeAmountKAS: actionFeeKas,
        });
        if (!updated) throw new Error('Failed to update listing');
      } else {
        saveDirectoryListing({
          ...buildPayload(),
          feeTxHash,
          feeAmountKAS: DAPP_LISTING_FEE_KAS,
        });

        const txNorm = extractKaspaTransactionId(feeTxHash) ?? feeTxHash;
        appendHubActivityEarn({
          walletRaw: state.address,
          source: 'dapp_directory_list',
          redeemableDelta: HUB_EARN_POINTS.dappDirectoryList,
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
        <div className="text-5xl mb-4">✓</div>
        <p className="text-zinc-900 dark:text-zinc-100 font-black uppercase tracking-widest">
          {isEdit ? 'Listing updated' : 'Listing submitted'}
        </p>
        <p className="text-sm text-zinc-500 mt-2">Redirecting to your listings...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="rounded-xl border border-cyan-200 dark:border-cyan-900/40 bg-cyan-50 dark:bg-cyan-950/20 p-4">
        <p className="text-[11px] font-bold text-cyan-900 dark:text-cyan-200 uppercase tracking-wider mb-1">
          {isEdit ? 'Update directory listing' : 'List your project on Kasparex dApps'}
        </p>
        <p className="text-xs text-cyan-800 dark:text-cyan-300/90 leading-relaxed">
          Submit a full project profile for the public dApps directory. Your listing gets its own page with
          description, links, media, and contact details. Integrated live widgets are reserved for official
          Kasparex dApps.
        </p>
      </div>

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
            <label className="k-label">Supported chains</label>
            <input
              type="text"
              className="k-input"
              value={chainsRaw}
              onChange={(e) => setChainsRaw(e.target.value)}
              placeholder="Kaspa, Kasplex, Igra (comma separated)"
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

          <LinkRowsEditor
            label="Social links"
            rows={socialLinks}
            onChange={setSocialLinks}
            addLabel="Add social link"
          />
          <LinkRowsEditor
            label="Documentation links"
            rows={documentationLinks}
            onChange={setDocumentationLinks}
            addLabel="Add documentation link"
          />
          <LinkRowsEditor
            label="Action buttons"
            rows={actionButtons}
            onChange={setActionButtons}
            addLabel="Add action button"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <StoreFileUpload
              label="Feature image *"
              hint="PNG, JPG, or WebP under 2MB"
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
            <StoreFileUpload
              label="Gallery / screenshots"
              hint="Images under 2MB each"
              accept="image/*"
              multiple
              fileCount={galleryCids.length}
              onChange={handleGallery}
              disabled={isUploading}
            />
          </div>

          <StoreFileUpload
            label="Optional files"
            hint="PDFs, docs, or assets up to 5MB each"
            multiple
            fileCount={optionalFileCids.length}
            onChange={handleOptionalFiles}
            disabled={isUploading}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-5">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100 mb-4">
              {isEdit ? 'Update listing' : 'Listing fee'}
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
              {isEdit ? 'Update fee' : 'One-time directory fee'}:{' '}
              <span className="font-black text-[#02abb8]">{feeLabel}</span>
            </p>
            <p className="text-xs text-zinc-500 mt-2">
              Paid to the Kasparex treasury when you {isEdit ? 'save changes' : 'publish'}. Equivalent to{' '}
              {actionFeeKas} KAS.
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
            {isUploading
              ? 'Uploading...'
              : isProcessing
                ? 'Processing...'
                : isEdit
                  ? `Save changes (${feeLabel})`
                  : `Publish listing (${feeLabel})`}
          </button>
        </aside>
      </div>
    </form>
  );
}
