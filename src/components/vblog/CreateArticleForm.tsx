'use client';

import { useEffect, useMemo, useState } from 'react';
import { VBlogArticle, VBlogModuleId } from '@/lib/vblog/types';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useAccount } from 'wagmi';
import { useVBlogPricing } from '@/hooks/useVBlogPricing';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import {
  validateTitle,
  validateDescription,
  validateContent,
  getCharacterCount,
  CONTENT_LIMITS,
} from '@/lib/vblog/limits';
import { Alert } from '@/components/Alert';
import { VBlogMagazineIntegration } from './VBlogMagazineIntegration';
import { KREXBuyWizard } from '@/components/rewards/KREXBuyWizard';
import { getVBlogBaseFeeKas } from '@/lib/vblog/pricing';
import { getVBlogModuleEffectivePriceKas, VBLOG_MODULE_OFFERS } from '@/lib/vblog/modules';
import { useIPFSUpload } from '@/lib/ipfs/hooks';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import { KxFormSelect } from '@/components/ui/KxFormSelect';
import { KxImageSourceField } from '@/components/ui/KxImageSourceField';
import { KxInFormPremiumList, KxInFormPremiumRow } from '@/components/ui/KxInFormPremiumRow';
import { KxAlertRegion } from '@/components/ui/KxAlertRegion';
import { VBlogModuleConfigFields } from './VBlogModuleConfigFields';

interface CreateArticleFormProps {
  onSubmit: (article: Omit<VBlogArticle, 'id' | 'slug' | 'publishDate' | 'cid' | 'articleId' | 'txHash' | 'status'>) => Promise<void>;
  onCancel?: () => void;
}

const CATEGORIES = [
  'Introduction',
  'Technical',
  'Tutorial',
  'News',
  'Opinion',
  'Review',
  'Other',
];

const FEATURED_IMAGE_MAX_SIZE_MB = 5;

const FORM_MODULE_IDS: VBlogModuleId[] = [
  'premium_section',
  'tip_box',
  'tip_to_reveal',
  'premium_poll',
  'reading_receipts_badges',
  'magazine_integration',
];

function moduleHasConfigFields(id: VBlogModuleId): boolean {
  return id === 'premium_section' || id === 'tip_to_reveal' || id === 'premium_poll';
}

export function CreateArticleForm({ onSubmit, onCancel }: CreateArticleFormProps) {
  const { state: kaspaState } = useKaspaWallet();
  const { address: evmAddress, isConnected: isEVMConnected } = useAccount();
  const pricing = useVBlogPricing();
  const { tier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const { upload, isUploading } = useIPFSUpload();

  const walletAddress = kaspaState.address || (evmAddress ? `evm:${evmAddress}` : null);
  const isWalletConnected = kaspaState.isConnected || isEVMConnected;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [featuredImageSource, setFeaturedImageSource] = useState<'url' | 'file'>('file');
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [featuredImageCid, setFeaturedImageCid] = useState<string | null>(null);
  const [featuredImageName, setFeaturedImageName] = useState<string | null>(null);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [tags, setTags] = useState('');
  const [linkedMagazineId, setLinkedMagazineId] = useState<string | undefined>();
  const [linkedIssueNumber, setLinkedIssueNumber] = useState<number | undefined>();
  const [primaryLink, setPrimaryLink] = useState('');
  const [socialLink1, setSocialLink1] = useState('');
  const [socialLink2, setSocialLink2] = useState('');
  const [socialLink3, setSocialLink3] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isKrexWizardOpen, setIsKrexWizardOpen] = useState(false);
  const [magazineIntegrationEnabled, setMagazineIntegrationEnabled] = useState(false);
  const [premiumSectionEnabled, setPremiumSectionEnabled] = useState(false);
  const [premiumSectionContent, setPremiumSectionContent] = useState('');
  const [premiumSectionPriceKas, setPremiumSectionPriceKas] = useState('10');
  const [premiumSectionPayoutAddress, setPremiumSectionPayoutAddress] = useState('');
  const [tipBoxEnabled, setTipBoxEnabled] = useState(false);
  const [tipToRevealEnabled, setTipToRevealEnabled] = useState(false);
  const [tipToRevealContent, setTipToRevealContent] = useState('');
  const [tipToRevealThresholdKas, setTipToRevealThresholdKas] = useState('25');
  const [premiumPollEnabled, setPremiumPollEnabled] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState('Option 1, Option 2');
  const [readingReceiptsEnabled, setReadingReceiptsEnabled] = useState(false);

  const resolvedFeaturedImage = useMemo(() => {
    if (featuredImageSource === 'url') return featuredImageUrl.trim();
    return featuredImageCid ? getBestGatewayUrl(featuredImageCid) : '';
  }, [featuredImageSource, featuredImageUrl, featuredImageCid]);

  const modulesPayload = useMemo(
    () => ({
      premiumSectionEnabled,
      premiumSectionContent: premiumSectionEnabled ? premiumSectionContent.trim() : undefined,
      premiumSectionPriceKas: premiumSectionEnabled ? Number(premiumSectionPriceKas) : undefined,
      premiumSectionPayoutAddress: premiumSectionEnabled ? premiumSectionPayoutAddress.trim() : undefined,
      tipBoxEnabled,
      tipBox: tipBoxEnabled ? { presets: [10, 50, 100], allowCustom: true } : undefined,
      tipToRevealEnabled,
      tipToRevealContent: tipToRevealEnabled ? tipToRevealContent.trim() : undefined,
      tipToRevealThresholdKas: tipToRevealEnabled ? Number(tipToRevealThresholdKas) : undefined,
      premiumPollEnabled,
      premiumPoll: premiumPollEnabled
        ? { question: pollQuestion.trim(), options: pollOptions.split(',').map((x) => x.trim()).filter(Boolean) }
        : undefined,
      readingReceiptsEnabled,
    }),
    [
      premiumSectionEnabled,
      premiumSectionContent,
      premiumSectionPriceKas,
      premiumSectionPayoutAddress,
      tipBoxEnabled,
      tipToRevealEnabled,
      tipToRevealContent,
      tipToRevealThresholdKas,
      premiumPollEnabled,
      pollQuestion,
      pollOptions,
      readingReceiptsEnabled,
    ],
  );

  const createQuote = pricing.estimateQuote(
    {
      title,
      description,
      content,
      category,
      tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      featuredImage: resolvedFeaturedImage,
      linkedMagazineId: magazineIntegrationEnabled ? linkedMagazineId : undefined,
      linkedIssueNumber: magazineIntegrationEnabled ? linkedIssueNumber : undefined,
      author: walletAddress ?? undefined,
      primaryLink: primaryLink.trim() || undefined,
      socialLinks: [socialLink1, socialLink2, socialLink3].map((x) => x.trim()).filter(Boolean),
      modules: modulesPayload,
      magazineIntegrationEnabled,
    },
    'create',
  );

  const fullBaseFee = getVBlogBaseFeeKas('create');
  const discountKas = Math.max(0, fullBaseFee - createQuote.baseFeeKas);
  const discountPercent = fullBaseFee > 0 ? Math.round((discountKas / fullBaseFee) * 100) : 0;

  const formModuleOffers = useMemo(
    () => VBLOG_MODULE_OFFERS.filter((offer) => FORM_MODULE_IDS.includes(offer.id)),
    [],
  );

  const moduleEnabledMap: Record<VBlogModuleId, boolean> = {
    premium_section: premiumSectionEnabled,
    tip_box: tipBoxEnabled,
    tip_to_reveal: tipToRevealEnabled,
    premium_poll: premiumPollEnabled,
    reading_receipts_badges: readingReceiptsEnabled,
    magazine_integration: magazineIntegrationEnabled,
  };

  const setModuleEnabled = (moduleId: VBlogModuleId, next: boolean) => {
    switch (moduleId) {
      case 'premium_section':
        setPremiumSectionEnabled(next);
        break;
      case 'tip_box':
        setTipBoxEnabled(next);
        break;
      case 'tip_to_reveal':
        setTipToRevealEnabled(next);
        break;
      case 'premium_poll':
        setPremiumPollEnabled(next);
        break;
      case 'reading_receipts_badges':
        setReadingReceiptsEnabled(next);
        break;
      case 'magazine_integration':
        setMagazineIntegrationEnabled(next);
        if (!next) {
          setLinkedMagazineId(undefined);
          setLinkedIssueNumber(undefined);
        }
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (premiumSectionEnabled && kaspaState.address && !premiumSectionPayoutAddress.trim()) {
      setPremiumSectionPayoutAddress(kaspaState.address);
    }
  }, [premiumSectionEnabled, kaspaState.address, premiumSectionPayoutAddress]);

  const uploadFeaturedImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = FEATURED_IMAGE_MAX_SIZE_MB * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`Featured image must be under ${FEATURED_IMAGE_MAX_SIZE_MB}MB`);
      e.target.value = '';
      return;
    }
    const uploadedCid = await upload(file, { filename: file.name });
    if (uploadedCid) {
      setFeaturedImageCid(uploadedCid);
      setFeaturedImageName(file.name);
      setFeaturedImageUrl('');
      setError(null);
    } else {
      setError('Failed to upload featured image to IPFS');
    }
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    const titleValidation = validateTitle(title, pricing.isPremium);
    if (!titleValidation.valid) {
      setError(titleValidation.error ?? 'Title validation failed');
      return;
    }

    if (!description.trim()) {
      setError('Description is required');
      return;
    }
    const descValidation = validateDescription(description, pricing.isPremium);
    if (!descValidation.valid) {
      setError(descValidation.error ?? 'Description validation failed');
      return;
    }

    if (!content.trim()) {
      setError('Content is required');
      return;
    }
    const contentValidation = validateContent(content, pricing.isPremium);
    if (!contentValidation.valid) {
      setError(contentValidation.error ?? 'Content validation failed');
      return;
    }

    if (!resolvedFeaturedImage) {
      setError('Featured image is required. Add a URL or upload to IPFS.');
      return;
    }

    if (premiumSectionEnabled) {
      if (!premiumSectionContent.trim() || !premiumSectionPayoutAddress.trim()) {
        setError('Premium section needs content and payout wallet address.');
        return;
      }
      const price = Number(premiumSectionPriceKas);
      if (!Number.isFinite(price) || price <= 0) {
        setError('Premium section unlock price must be greater than 0 KAS.');
        return;
      }
    }
    if (tipToRevealEnabled && !tipToRevealContent.trim()) {
      setError('Tip-to-reveal bonus content is required when enabled.');
      return;
    }
    if (tipToRevealEnabled) {
      const threshold = Number(tipToRevealThresholdKas);
      if (!Number.isFinite(threshold) || threshold <= 0) {
        setError('Tip-to-reveal threshold must be greater than 0 KAS.');
        return;
      }
    }
    if (premiumPollEnabled) {
      const options = pollOptions.split(',').map((x) => x.trim()).filter(Boolean);
      if (!pollQuestion.trim() || options.length < 2) {
        setError('Premium poll requires a question and at least 2 options.');
        return;
      }
    }
    if (magazineIntegrationEnabled && (!linkedMagazineId || !linkedIssueNumber)) {
      setError('Magazine integration requires a target magazine and issue number.');
      return;
    }

    void handleConfirm();
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);

    try {
      const tagsArray = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      if (!isWalletConnected || !walletAddress) {
        setError('Wallet not connected. Please connect your wallet (Kaspa or EVM) to create an article.');
        setIsSubmitting(false);
        return;
      }

      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        content: content.trim(),
        author: walletAddress,
        category,
        tags: tagsArray,
        featuredImage: resolvedFeaturedImage,
        linkedMagazineId: magazineIntegrationEnabled ? linkedMagazineId : undefined,
        linkedIssueNumber: magazineIntegrationEnabled ? linkedIssueNumber : undefined,
        primaryLink: primaryLink.trim() || undefined,
        socialLinks: [socialLink1, socialLink2, socialLink3].map((x) => x.trim()).filter(Boolean),
        modules: modulesPayload,
      });

      setTitle('');
      setDescription('');
      setContent('');
      setFeaturedImageUrl('');
      setFeaturedImageCid(null);
      setFeaturedImageName(null);
      setFeaturedImageSource('file');
      setCategory(CATEGORIES[0]);
      setTags('');
      setPrimaryLink('');
      setSocialLink1('');
      setSocialLink2('');
      setSocialLink3('');
      setMagazineIntegrationEnabled(false);
      setLinkedMagazineId(undefined);
      setLinkedIssueNumber(undefined);
      setPremiumSectionEnabled(false);
      setPremiumSectionContent('');
      setPremiumSectionPriceKas('10');
      setPremiumSectionPayoutAddress('');
      setTipBoxEnabled(false);
      setTipToRevealEnabled(false);
      setTipToRevealContent('');
      setTipToRevealThresholdKas('25');
      setPremiumPollEnabled(false);
      setPollQuestion('');
      setPollOptions('Option 1, Option 2');
      setReadingReceiptsEnabled(false);
    } catch (err) {
      console.error('Error creating article:', err);
      setError(err instanceof Error ? err.message : 'Failed to create article. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
      <div className="flex flex-col space-y-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8">
        <div>
          <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-4 tracking-tight">
            Create New Article
          </h3>
          <p className="kx-body mb-6">
            Fill in the details below to create a new article. Estimated cost: {createQuote.totalKas} KAS ({createQuote.chunkCount} chunk{createQuote.chunkCount === 1 ? '' : 's'}, {createQuote.payloadBytes} bytes){pricing.tier.hasKREXDiscount ? ' (KREX holder discount)' : ''}.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="k-label">
              Title <span className="text-red-500">*</span>
            </label>
            <span
              className={`text-xs ${
                getCharacterCount(title) > (pricing.isPremium ? CONTENT_LIMITS.premium.title.max : CONTENT_LIMITS.title.max)
                  ? 'text-red-500'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              {getCharacterCount(title)} / {pricing.isPremium ? CONTENT_LIMITS.premium.title.max : CONTENT_LIMITS.title.max}
            </span>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter article title"
            maxLength={pricing.isPremium ? CONTENT_LIMITS.premium.title.max : CONTENT_LIMITS.title.max}
            className="k-input text-base"
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="k-label">
              Short Description <span className="text-red-500">*</span>
            </label>
            <span
              className={`text-xs ${
                getCharacterCount(description) > (pricing.isPremium ? CONTENT_LIMITS.premium.description.max : CONTENT_LIMITS.description.max)
                  ? 'text-red-500'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              {getCharacterCount(description)} / {pricing.isPremium ? CONTENT_LIMITS.premium.description.max : CONTENT_LIMITS.description.max}
            </span>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter a brief description of the article"
            rows={3}
            maxLength={pricing.isPremium ? CONTENT_LIMITS.premium.description.max : CONTENT_LIMITS.description.max}
            className="k-textarea min-h-[96px] text-base"
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="k-label">
              Main Content <span className="text-red-500">*</span>
            </label>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your article content here..."
            maxLength={pricing.isPremium ? CONTENT_LIMITS.premium.content.max : CONTENT_LIMITS.content.max}
            disabled={isSubmitting}
            rows={14}
            className="k-textarea text-base leading-relaxed"
          />
        </div>

        <div className="k-form-group !mb-0">
          <label className="k-label">
            Featured image <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-2">
            Recommended size: 1200x630px (1.91:1 aspect ratio) for optimal display
          </p>
          <KxImageSourceField
            source={featuredImageSource}
            onSourceChange={setFeaturedImageSource}
            url={featuredImageUrl}
            onUrlChange={(next) => {
              setFeaturedImageUrl(next);
              setFeaturedImageCid(null);
              setFeaturedImageName(null);
            }}
            urlPlaceholder="https://..."
            urlHint="Direct HTTPS image URL. PNG, JPG, or WebP."
            fileName={
              featuredImageName ??
              (featuredImageCid && !featuredImageName ? 'Uploaded featured image' : null)
            }
            onClearFile={() => {
              setFeaturedImageCid(null);
              setFeaturedImageName(null);
            }}
            onFileChange={uploadFeaturedImage}
            uploadHint={`PNG, JPG, or WebP under ${FEATURED_IMAGE_MAX_SIZE_MB} MB`}
            isUploading={isUploading}
            inputClassName="k-input"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="k-label">Category</label>
            <KxFormSelect
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isSubmitting}
              ariaLabel="Article category"
              options={CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
            />
          </div>
          <div>
            <label className="k-label">Tags (comma-separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tag1, tag2, tag3"
              className="k-input"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="k-label">Main promotion link (optional)</label>
          <input className="k-input" value={primaryLink} onChange={(e) => setPrimaryLink(e.target.value)} placeholder="https://yourwebsite.com" disabled={isSubmitting} />
          <label className="k-label">Social links (up to 3)</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input className="k-input" value={socialLink1} onChange={(e) => setSocialLink1(e.target.value)} placeholder="https://x.com/..." disabled={isSubmitting} />
            <input className="k-input" value={socialLink2} onChange={(e) => setSocialLink2(e.target.value)} placeholder="https://instagram.com/..." disabled={isSubmitting} />
            <input className="k-input" value={socialLink3} onChange={(e) => setSocialLink3(e.target.value)} placeholder="https://youtube.com/..." disabled={isSubmitting} />
          </div>
        </div>

        <section className="space-y-3 pt-2">
          <p className="text-base font-black uppercase tracking-widest text-[#02abb8] dark:text-[#66dfe8]">Vault modules</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Optional premium features. Toggle modules on to add them to your total. They activate when you pay and publish.
          </p>
          <KxInFormPremiumList>
            {formModuleOffers.map((offer) => {
              const enabled = moduleEnabledMap[offer.id];
              const effectiveKas = getVBlogModuleEffectivePriceKas(offer.unlockPriceKas, tier, nftStatus);
              return (
                <div key={offer.id} className="space-y-2">
                  <KxInFormPremiumRow
                    title={offer.title}
                    description={offer.description}
                    priceLabel={`+${effectiveKas} KAS`}
                    checked={enabled}
                    disabled={isSubmitting}
                    onToggle={() => setModuleEnabled(offer.id, !enabled)}
                  />
                  {enabled && offer.id === 'magazine_integration' ? (
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/40 px-4 py-3">
                      <VBlogMagazineIntegration
                        embedded
                        linkedMagazineId={linkedMagazineId}
                        linkedIssueNumber={linkedIssueNumber}
                        onChange={(magId, issueNum) => {
                          setLinkedMagazineId(magId);
                          setLinkedIssueNumber(issueNum);
                        }}
                        disabled={isSubmitting}
                      />
                    </div>
                  ) : null}
                  {enabled && moduleHasConfigFields(offer.id) ? (
                    <VBlogModuleConfigFields
                      moduleId={offer.id}
                      disabled={isSubmitting}
                      premiumSectionContent={premiumSectionContent}
                      onPremiumSectionContentChange={setPremiumSectionContent}
                      premiumSectionPriceKas={premiumSectionPriceKas}
                      onPremiumSectionPriceKasChange={setPremiumSectionPriceKas}
                      premiumSectionPayoutAddress={premiumSectionPayoutAddress}
                      onPremiumSectionPayoutAddressChange={setPremiumSectionPayoutAddress}
                      tipToRevealContent={tipToRevealContent}
                      onTipToRevealContentChange={setTipToRevealContent}
                      tipToRevealThresholdKas={tipToRevealThresholdKas}
                      onTipToRevealThresholdKasChange={setTipToRevealThresholdKas}
                      pollQuestion={pollQuestion}
                      onPollQuestionChange={setPollQuestion}
                      pollOptions={pollOptions}
                      onPollOptionsChange={setPollOptions}
                    />
                  ) : null}
                </div>
              );
            })}
          </KxInFormPremiumList>
        </section>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>

        <KxAlertRegion>
          {pricing.tier.hasNFTPerks ? (
            <Alert type="success" compact region>
              <p>NFT Perks Active: Increased text limits enabled ({pricing.tier.nftCollections.join(', ')})</p>
            </Alert>
          ) : null}
          {error ? (
            <Alert type="error" title="Error" onDismiss={() => setError(null)} compact region>
              <p>{error}</p>
            </Alert>
          ) : null}
        </KxAlertRegion>
      </div>

      <aside className="xl:sticky xl:top-6 flex flex-col bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-[0_10px_30px_-18px_rgba(2,171,184,0.4)]">
        <h4 className="text-xs font-black uppercase tracking-[0.18em] text-[#02abb8]">Calculation breakdown</h4>
        <div className="space-y-2 kx-body">
          <div className="flex justify-between"><span>Base fee</span><span className="font-bold text-zinc-900 dark:text-zinc-100">{createQuote.baseFeeKas} KAS</span></div>
          <div className="flex justify-between"><span>Size fee</span><span className="font-bold text-zinc-900 dark:text-zinc-100">{createQuote.sizeFeeKas} KAS</span></div>
          <div className="flex justify-between"><span>Network buffer</span><span className="font-bold text-zinc-900 dark:text-zinc-100">{createQuote.networkFeeBufferKas} KAS</span></div>
          {createQuote.moduleLines.map((line) => (
            <div key={line.id} className="flex justify-between gap-2">
              <span className="truncate">{line.title}</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100 shrink-0">+{line.kas} KAS</span>
            </div>
          ))}
          {createQuote.modulesFeeKas > 0 ? (
            <div className="flex justify-between border-t border-zinc-200 dark:border-zinc-700 pt-2">
              <span>Modules subtotal</span>
              <span className="font-bold text-[#02abb8]">{createQuote.modulesFeeKas} KAS</span>
            </div>
          ) : null}
          <div className="flex justify-between"><span>Payload bytes</span><span className="font-bold text-zinc-900 dark:text-zinc-100">{createQuote.payloadBytes}</span></div>
          <div className="flex justify-between"><span>Chunk estimate</span><span className="font-bold text-zinc-900 dark:text-zinc-100">{createQuote.chunkCount}</span></div>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-3">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Total to pay</p>
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{createQuote.totalKas} KAS</p>
        </div>
        <div className="rounded-xl bg-[#02abb8]/10 border border-[#02abb8]/25 p-3 text-sm text-zinc-700 dark:text-zinc-300">
          One Kaspa L1 payment covers the article and any enabled modules. Ensure your wallet has enough KAS.
        </div>
        {pricing.tier.hasKREXDiscount && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-800 dark:text-emerald-300">
            KREX discount: -{discountKas.toFixed(2)} KAS ({discountPercent}% off base fee).
          </div>
        )}
        {!pricing.tier.hasKREXDiscount && (
          <button
            type="button"
            onClick={() => setIsKrexWizardOpen(true)}
            className="w-full k-control-btn !border-emerald-500/30 !text-emerald-700 dark:!text-emerald-300"
          >
            Buy KREX to unlock discount
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="w-full px-4 py-2.5 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating...' : 'Create Article'}
        </button>
        <KxAlertRegion>
          {error ? (
            <Alert type="error" compact onDismiss={() => setError(null)} region>
              <p>{error}</p>
            </Alert>
          ) : null}
        </KxAlertRegion>
      </aside>
      <KREXBuyWizard isOpen={isKrexWizardOpen} onClose={() => setIsKrexWizardOpen(false)} />
    </form>
  );
}
