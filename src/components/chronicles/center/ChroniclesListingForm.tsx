'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { HubPaymentCurrencyDropdown } from '@/components/payments/HubPaymentCurrencyDropdown';
import { buildKasKrexMenuOptions } from '@/lib/payments/hubPaymentTypes';
import { KxTabStrip } from '@/components/ui/KxTabStrip';
import { useDAppListingPayment } from '@/hooks/useDAppListingPayment';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { calculateDirectoryListingFeeKas, listingActionFeeLabel } from '@/lib/dapps/listingSubmissions';
import type { StorePaymentCurrency } from '@/lib/store/currencies';
import {
  CHRONICLES_CONTENT_KIND_LABELS,
  saveCommunitySubmission,
  submissionFeeKas,
  type ChroniclesContentKind,
} from '@/lib/chronicles/communitySubmissions';
import type { CharacterKind, ChronicleTimeline, VehicleKind } from '@/lib/chronicles/types';
import { communityDetailHref } from '@/lib/chronicles/communityRoutes';
import { ChronicleThumb } from '@/components/chronicles/ChronicleFeaturedVisual';
import { ChroniclesCommunityBadge } from '@/components/chronicles/ChroniclesCommunityBadge';
import { StoreFileUpload } from '@/components/store/StoreFileUpload';
import { useIPFSUpload } from '@/lib/ipfs/hooks';
import { getBestGatewayUrl } from '@/lib/hub/ipfsStandard';
import { appendHubActivityEarn } from '@/lib/rewards/appendHubActivityEarn';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { KxRichTextEditor } from '@/components/ui/KxRichTextEditor';
import { KxInFormPremiumRow } from '@/components/ui/KxInFormPremiumRow';
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { HubBenefitsPanel } from '@/components/hub/HubBenefitsPanel';
import { HubFlowProgress } from '@/components/hub/HubFlowProgress';
import { getHubFlowPreset } from '@/lib/hub/hubFlowProgress';
import { htmlToPlainText } from '@/lib/richText/html';
import {
  KX_FORM_GRID,
  KX_FORM_PANEL,
  KX_FORM_STICKY_RAIL,
  KX_CALCULATION_ASIDE,
  KX_PREMIUM_MODULE_CARD,
} from '@/lib/hub/shellTokens';

const CONTENT_KINDS: ChroniclesContentKind[] = ['chapter', 'article', 'character', 'location', 'vehicle'];
const FEATURED_IMAGE_MAX_SIZE_MB = 5;
const PREMIUM_ILLUSTRATED_FEE_KAS = 8;
const PREMIUM_CANON_HINT_FEE_KAS = 6;

function FeaturedImageSourceToggle({
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
      ariaLabel="Featured image source"
      fullWidth
    />
  );
}

export function ChroniclesListingForm({ onSubmitted }: { onSubmitted?: () => void }) {
  const router = useRouter();
  const { state } = useKaspaWallet();
  const { payActionFee, isProcessing, error, setError } = useDAppListingPayment();
  const { upload, isUploading } = useIPFSUpload();
  const { tier: krexTier, balance: krexBalance } = useKREXBalance();
  const { nftStatus } = useNFTStatus();

  const [kind, setKind] = useState<ChroniclesContentKind>('chapter');
  const [paymentCurrency, setPaymentCurrency] = useState<StorePaymentCurrency>('KAS');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [bodyMarkdown, setBodyMarkdown] = useState('');
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [featuredImageSource, setFeaturedImageSource] = useState<'url' | 'file'>('file');
  const [featuredImageCid, setFeaturedImageCid] = useState<string | null>(null);
  const [featuredImageName, setFeaturedImageName] = useState<string | null>(null);
  const [chapterNumber, setChapterNumber] = useState('');
  const [timeline, setTimeline] = useState<ChronicleTimeline>('current');
  const [characterKind, setCharacterKind] = useState<CharacterKind>('person');
  const [vehicleKind, setVehicleKind] = useState<VehicleKind>('vehicle');
  const [tags, setTags] = useState('');
  const [illustratedEnabled, setIllustratedEnabled] = useState(false);
  const [canonHintEnabled, setCanonHintEnabled] = useState(false);

  const baseFeeKas = useMemo(() => submissionFeeKas(kind), [kind]);
  const modulesFeeKas =
    (illustratedEnabled ? PREMIUM_ILLUSTRATED_FEE_KAS : 0) +
    (canonHintEnabled ? PREMIUM_CANON_HINT_FEE_KAS : 0);
  const listingFee = useMemo(
    () => calculateDirectoryListingFeeKas(baseFeeKas + modulesFeeKas, krexTier, nftStatus),
    [baseFeeKas, modulesFeeKas, krexTier, nftStatus],
  );
  const feeLabel = listingActionFeeLabel(paymentCurrency, listingFee.effectiveKas);
  const featuredPreviewUrl =
    featuredImageSource === 'url' && featuredImageUrl.trim()
      ? featuredImageUrl.trim()
      : featuredImageCid
        ? getBestGatewayUrl(featuredImageCid)
        : undefined;
  const canSubmit = Boolean(
    state.isConnected &&
      title.trim() &&
      summary.trim() &&
      htmlToPlainText(bodyMarkdown).trim() &&
      !isProcessing &&
      !isUploading,
  );

  const uploadFeaturedImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = FEATURED_IMAGE_MAX_SIZE_MB * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`Featured image must be under ${FEATURED_IMAGE_MAX_SIZE_MB}MB`);
      e.target.value = '';
      return;
    }
    const cid = await upload(file, { filename: file.name });
    if (cid) {
      setFeaturedImageCid(cid);
      setFeaturedImageName(file.name);
      setFeaturedImageUrl('');
      setError(null);
    } else {
      setError('Failed to upload featured image to IPFS');
    }
    e.target.value = '';
  };

  const resolveFeaturedImageUrl = () => {
    if (featuredImageSource === 'url') {
      return featuredImageUrl.trim() || undefined;
    }
    return featuredImageCid ? getBestGatewayUrl(featuredImageCid) : undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!state.isConnected || !state.address) {
      setError('Connect your Kaspa wallet to submit community lore.');
      return;
    }

    try {
      const feeTxHash = await payActionFee(paymentCurrency, listingFee.effectiveKas);
      const entry = saveCommunitySubmission({
        kind,
        title: title.trim(),
        summary: summary.trim(),
        bodyMarkdown: bodyMarkdown.trim(),
        authorAddress: state.address,
        feeAmountKas: listingFee.effectiveKas,
        paymentCurrency,
        feeTxHash,
        featuredImageUrl: resolveFeaturedImageUrl(),
        chapterNumber: kind === 'chapter' && chapterNumber ? Number(chapterNumber) : undefined,
        timeline: kind === 'chapter' ? timeline : undefined,
        characterKind: kind === 'character' ? characterKind : undefined,
        vehicleKind: kind === 'vehicle' ? vehicleKind : undefined,
        tags: tags
          .split(/[,#]/)
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 12),
      });

      if (kind === 'article') {
        const txNorm = extractKaspaTransactionId(feeTxHash) ?? feeTxHash;
        appendHubActivityEarn({
          walletRaw: state.address,
          source: 'chronicles_article_create',
          redeemableDelta: HUB_EARN_POINTS.chroniclesArticleCreate,
          krexBalance,
          idempotencyKey: `chronicles:article:${txNorm}`,
          meta: { title: title.trim() },
        });
      }

      onSubmitted?.();
      router.replace(communityDetailHref(entry.kind, entry.slug));
    } catch {
      /* payActionFee sets error */
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`${KX_FORM_GRID} items-start`}>
      <div className="flex min-w-0 flex-col gap-6">
        <div className={`${KX_FORM_PANEL} space-y-6`}>
          <div>
            <DAppSectionHeader title="Main content" className="mb-3" />
            <h3 className="mb-4 text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              Create lore
            </h3>
            <p className="kx-body">
              Submit community lore for Krex&apos;s Chronicles. Estimated cost: {listingFee.effectiveKas} KAS
              {listingFee.discountPercent > 0 ? ' (KREX holder discount)' : ''}.
            </p>
          </div>

          <div className="k-form-group">
            <KxFormFieldLabel required>Content type</KxFormFieldLabel>
            <KxTabStrip
              value={kind}
              onChange={setKind}
              scrollable
              ariaLabel="Content type"
              options={CONTENT_KINDS.map((k) => ({
                value: k,
                label: CHRONICLES_CONTENT_KIND_LABELS[k],
              }))}
            />
          </div>

          <div className="k-form-group">
            <KxFormFieldLabel required>Title</KxFormFieldLabel>
            <input
              type="text"
              className="k-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Chapter or entity title"
              required
            />
          </div>

          <div className="k-form-group">
            <KxFormFieldLabel required>Summary / teaser</KxFormFieldLabel>
            <textarea
              className="k-textarea min-h-[80px]"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="One or two sentences for cards and search"
              required
            />
          </div>

          <div className="k-form-group">
            <KxFormFieldLabel required>Body</KxFormFieldLabel>
            <KxRichTextEditor
              value={bodyMarkdown}
              onChange={setBodyMarkdown}
              placeholder="Full lore content"
              minRows={12}
            />
          </div>

          <div className="k-form-group">
            <KxFormFieldLabel>Featured image (optional)</KxFormFieldLabel>
            <div className="space-y-3">
              <FeaturedImageSourceToggle value={featuredImageSource} onChange={setFeaturedImageSource} />
              {featuredImageSource === 'url' ? (
                <input
                  type="url"
                  className="k-input"
                  value={featuredImageUrl}
                  onChange={(e) => {
                    setFeaturedImageUrl(e.target.value);
                    setFeaturedImageCid(null);
                    setFeaturedImageName(null);
                  }}
                  placeholder="https://..."
                />
              ) : (
                <StoreFileUpload
                  label=""
                  hint={`PNG, JPG, or WebP under ${FEATURED_IMAGE_MAX_SIZE_MB} MB`}
                  accept="image/*"
                  fileName={
                    featuredImageName ??
                    (featuredImageCid && !featuredImageName ? 'Uploaded featured image' : null)
                  }
                  onClear={() => {
                    setFeaturedImageCid(null);
                    setFeaturedImageName(null);
                  }}
                  onChange={uploadFeaturedImage}
                  disabled={isUploading}
                />
              )}
            </div>
          </div>

          {kind === 'chapter' ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="k-form-group">
                <KxFormFieldLabel>Chapter number</KxFormFieldLabel>
                <input
                  type="number"
                  min={1}
                  className="k-input"
                  value={chapterNumber}
                  onChange={(e) => setChapterNumber(e.target.value)}
                />
              </div>
              <div className="k-form-group">
                <KxFormFieldLabel>Timeline</KxFormFieldLabel>
                <KxTabStrip
                  value={timeline}
                  onChange={setTimeline}
                  ariaLabel="Timeline"
                  options={[
                    { value: 'past', label: 'Past' },
                    { value: 'current', label: 'Current' },
                    { value: 'future', label: 'Future' },
                  ]}
                />
              </div>
            </div>
          ) : null}

          {kind === 'character' ? (
            <div className="k-form-group">
              <KxFormFieldLabel>Character kind</KxFormFieldLabel>
              <KxTabStrip
                value={characterKind}
                onChange={setCharacterKind}
                scrollable
                ariaLabel="Character kind"
                options={[
                  { value: 'person', label: 'Person' },
                  { value: 'ai', label: 'AI' },
                  { value: 'faction', label: 'Faction' },
                  { value: 'organization', label: 'Org' },
                  { value: 'unknown', label: 'Unknown' },
                ]}
              />
            </div>
          ) : null}

          {kind === 'vehicle' ? (
            <div className="k-form-group">
              <KxFormFieldLabel>Tech kind</KxFormFieldLabel>
              <KxTabStrip
                value={vehicleKind}
                onChange={setVehicleKind}
                scrollable
                ariaLabel="Vehicle kind"
                options={[
                  { value: 'vehicle', label: 'Vehicle' },
                  { value: 'tool', label: 'Tool' },
                  { value: 'weapon', label: 'Weapon' },
                  { value: 'device', label: 'Device' },
                ]}
              />
            </div>
          ) : null}

          <div className="k-form-group !mb-0">
            <KxFormFieldLabel>Tags</KxFormFieldLabel>
            <input
              type="text"
              className="k-input"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Comma-separated tags"
            />
          </div>
        </div>

        <div id="chronicles-dashboard-modules" className={`${KX_FORM_PANEL} my-2 scroll-mt-24 space-y-6 py-10 sm:py-12`}>
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
              title="Illustrated entry"
              description="Mark this submission for illustrated treatment in discovery rails."
              priceLabel={`+${PREMIUM_ILLUSTRATED_FEE_KAS} KAS`}
              checked={illustratedEnabled}
              onToggle={() => setIllustratedEnabled((v) => !v)}
            />
            {illustratedEnabled ? (
              <div className="mt-5 border-t border-zinc-200 pt-5 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                Illustrated options expand inside this module and are included in the calculation breakdown.
              </div>
            ) : null}
          </div>

          <div className={KX_PREMIUM_MODULE_CARD}>
            <KxInFormPremiumRow
              flat
              accent="hub"
              title="Canon hint notes"
              description="Attach optional canon-alignment notes for community reviewers."
              priceLabel={`+${PREMIUM_CANON_HINT_FEE_KAS} KAS`}
              checked={canonHintEnabled}
              onToggle={() => setCanonHintEnabled((v) => !v)}
            />
            {canonHintEnabled ? (
              <div className="mt-5 border-t border-zinc-200 pt-5 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                Canon hint fields stay inside this container so the form layout stays stable.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className={KX_FORM_STICKY_RAIL}>
        <HubBenefitsPanel variant="panel" />

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Card preview</p>
          <div className="flex items-start gap-3">
            <ChronicleThumb imageUrl={featuredPreviewUrl} alt="" className="h-12 w-12 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {title.trim() || 'Title'}
                </p>
                <ChroniclesCommunityBadge />
              </div>
              <p className="text-[10px] text-zinc-500">{CHRONICLES_CONTENT_KIND_LABELS[kind]}</p>
              <p className="mt-1 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
                {summary.trim() || 'Summary appears on listing cards.'}
              </p>
            </div>
          </div>
        </div>

        <aside className={KX_CALCULATION_ASIDE}>
          <DAppSectionHeader title="Calculation breakdown" className="mb-1" />
          <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            <div className="flex justify-between">
              <span>Base fee</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{baseFeeKas} KAS</span>
            </div>
            {illustratedEnabled ? (
              <div className="flex justify-between gap-2">
                <span className="truncate">Illustrated entry</span>
                <span className="shrink-0 font-semibold">+{PREMIUM_ILLUSTRATED_FEE_KAS} KAS</span>
              </div>
            ) : null}
            {canonHintEnabled ? (
              <div className="flex justify-between gap-2">
                <span className="truncate">Canon hint notes</span>
                <span className="shrink-0 font-semibold">+{PREMIUM_CANON_HINT_FEE_KAS} KAS</span>
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
            One Kaspa L1 payment covers the submission and any enabled modules.
          </div>

          {kind === 'article' ? (
            <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-3 dark:border-cyan-900/40 dark:bg-cyan-950/25">
              <p className="text-xs font-black uppercase tracking-widest text-cyan-900 dark:text-cyan-100">Hub points</p>
              <p className="text-xl font-black text-cyan-900 dark:text-cyan-100">
                +{HUB_EARN_POINTS.chroniclesArticleCreate} pts
              </p>
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
            {isProcessing ? 'Processing...' : isUploading ? 'Uploading...' : 'Create Lore Entry'}
          </button>

          <HubFlowProgress steps={getHubFlowPreset('hubPublish')} busy={isProcessing || isUploading} />
        </aside>
      </div>
    </form>
  );
}
