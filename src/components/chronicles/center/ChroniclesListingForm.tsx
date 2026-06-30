'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { KxSegmentToggle } from '@/components/ui/KxSegmentToggle';
import { KxTabStrip } from '@/components/ui/KxTabStrip';
import { useDAppListingPayment } from '@/hooks/useDAppListingPayment';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { calculateDirectoryListingFeeKas, listingActionFeeLabel } from '@/lib/dapps/listingSubmissions';
import { STORE_PAYMENT_CURRENCIES, type StorePaymentCurrency } from '@/lib/store/currencies';
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
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import { appendHubActivityEarn } from '@/lib/rewards/appendHubActivityEarn';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';

const CONTENT_KINDS: ChroniclesContentKind[] = ['chapter', 'article', 'character', 'location', 'vehicle'];
const FEATURED_IMAGE_MAX_SIZE_MB = 5;

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

  const baseFeeKas = useMemo(() => submissionFeeKas(kind), [kind]);
  const listingFee = useMemo(
    () => calculateDirectoryListingFeeKas(baseFeeKas, krexTier, nftStatus),
    [baseFeeKas, krexTier, nftStatus],
  );
  const feeLabel = listingActionFeeLabel(paymentCurrency, listingFee.effectiveKas);
  const featuredPreviewUrl =
    featuredImageSource === 'url' && featuredImageUrl.trim()
      ? featuredImageUrl.trim()
      : featuredImageCid
        ? getBestGatewayUrl(featuredImageCid)
        : undefined;
  const canSubmit = Boolean(
    state.isConnected && title.trim() && summary.trim() && bodyMarkdown.trim() && !isProcessing && !isUploading,
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
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-8">
        <div className="space-y-6">
          <div className="k-form-group">
            <label className="k-label">Content type *</label>
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
            <label className="k-label">Title *</label>
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
            <label className="k-label">Summary / teaser *</label>
            <textarea
              className="k-textarea min-h-[80px]"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="One or two sentences for cards and search"
              required
            />
          </div>

          <div className="k-form-group">
            <label className="k-label">Body (Markdown) *</label>
            <textarea
              className="k-textarea min-h-[160px]"
              value={bodyMarkdown}
              onChange={(e) => setBodyMarkdown(e.target.value)}
              placeholder="Full lore content in Markdown"
              required
            />
          </div>

          <div className="k-form-group">
            <label className="k-label">Featured image (optional)</label>
            <div className="space-y-3">
              <FeaturedImageSourceToggle
                value={featuredImageSource}
                onChange={setFeaturedImageSource}
              />
              {featuredImageSource === 'url' ? (
                <div>
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
                  <p className="text-xs text-zinc-500 mt-1.5">
                    Direct HTTPS image URL. PNG, JPG, or WebP.
                  </p>
                </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="k-form-group">
                <label className="k-label">Chapter number</label>
                <input
                  type="number"
                  min={1}
                  className="k-input"
                  value={chapterNumber}
                  onChange={(e) => setChapterNumber(e.target.value)}
                />
              </div>
              <div className="k-form-group">
                <label className="k-label">Timeline</label>
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
              <label className="k-label">Character kind</label>
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
              <label className="k-label">Tech kind</label>
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

          <div className="k-form-group">
            <label className="k-label">Tags</label>
            <input
              type="text"
              className="k-input"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Comma-separated tags"
            />
          </div>
        </div>

        <aside className="xl:sticky xl:top-6 h-fit space-y-4">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Card preview</p>
            <div className="flex items-start gap-3">
              <ChronicleThumb
                imageUrl={featuredPreviewUrl}
                alt=""
                className="w-12 h-12 shrink-0 rounded-xl"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                    {title.trim() || 'Title'}
                  </p>
                  <ChroniclesCommunityBadge />
                </div>
                <p className="text-[10px] text-zinc-500 mt-0.5">{CHRONICLES_CONTENT_KIND_LABELS[kind]}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                  {summary.trim() || 'Summary appears on listing cards.'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-5 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
              Listing fee
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
              One-time submission fee:{' '}
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
            <p className="text-xs text-zinc-500">Paid to the Kasparex treasury when you publish.</p>

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
              {isProcessing ? 'Processing...' : isUploading ? 'Uploading...' : 'PUBLISH'}
            </button>
          </div>

          {kind === 'article' ? (
            <div className="rounded-2xl border border-cyan-200 dark:border-cyan-900/40 bg-cyan-50 dark:bg-cyan-950/25 p-5 space-y-2">
              <h3 className="text-sm font-black uppercase tracking-widest text-cyan-900 dark:text-cyan-100">
                Hub points
              </h3>
              <p className="text-2xl font-black text-cyan-900 dark:text-cyan-100">
                +{HUB_EARN_POINTS.chroniclesArticleCreate} pts
              </p>
              <p className="text-xs text-cyan-800/90 dark:text-cyan-300/80 leading-relaxed">
                Redeemable Hub points awarded once when you publish a new article.
              </p>
            </div>
          ) : null}
        </aside>
      </div>
    </form>
  );
}
