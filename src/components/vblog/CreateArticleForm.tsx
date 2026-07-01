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
import { htmlToPlainText, contentForRichEditor } from '@/lib/richText/html';
import { Alert } from '@/components/Alert';
import { VBlogMagazineIntegration } from './VBlogMagazineIntegration';
import { KREXBuyWizard } from '@/components/rewards/KREXBuyWizard';
import { getVBlogModuleEffectivePriceKas, getEnabledVBlogModuleIds, getArticlePaidModuleIds, VBLOG_MODULE_OFFERS } from '@/lib/vblog/modules';
import { useIPFSUpload } from '@/lib/ipfs/hooks';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import { KxImageSourceField } from '@/components/ui/KxImageSourceField';
import { KxRichTextEditor } from '@/components/ui/KxRichTextEditor';
import { KxInFormPremiumRow } from '@/components/ui/KxInFormPremiumRow';
import { KxAlertRegion } from '@/components/ui/KxAlertRegion';
import { VBlogModuleConfigFields } from './VBlogModuleConfigFields';
import { VBlogCategoryField } from './VBlogCategoryField';
import { VBlogDashboardBenefitsPanel } from './VBlogDashboardBenefitsPanel';
import { DEFAULT_VBLOG_CATEGORIES, addAuthorCustomCategory, isCustomCategory } from '@/lib/vblog/categories';
import { cleanVBlogSocialLinks, vBlogSocialLinksToRows, VBLOG_SOCIAL_LABEL_MAX } from '@/lib/vblog/socialLinks';
import { KxLinkRowsEditor, type KxLinkRow } from '@/components/ui/KxLinkRowsEditor';
import { IPFS_MAX_UPLOAD_MB } from '@/lib/ipfs/limits';

const FORM_PANEL_CLASS =
  'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8';
const FORM_SECTION_HEADING_CLASS =
  'text-base font-black uppercase tracking-widest text-[#02abb8] dark:text-[#66dfe8]';

interface CreateArticleFormProps {
  onSubmit?: (article: Omit<VBlogArticle, 'id' | 'slug' | 'publishDate' | 'cid' | 'articleId' | 'txHash' | 'status'>) => Promise<void>;
  onUpdate?: (articleId: string, updates: Partial<Omit<VBlogArticle, 'id' | 'author' | 'publishDate'>>) => Promise<void>;
  article?: VBlogArticle;
  onCancel?: () => void;
}

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

export function CreateArticleForm({ onSubmit, onUpdate, article, onCancel }: CreateArticleFormProps) {
  const isEditMode = Boolean(article);
  const { state: kaspaState } = useKaspaWallet();
  const { address: evmAddress, isConnected: isEVMConnected } = useAccount();
  const pricing = useVBlogPricing();
  const { tier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const { upload, isUploading } = useIPFSUpload();

  const walletAddress = kaspaState.address || (evmAddress ? `evm:${evmAddress}` : null);
  const isWalletConnected = kaspaState.isConnected || isEVMConnected;

  const [title, setTitle] = useState(article?.title ?? '');
  const [description, setDescription] = useState(() => htmlToPlainText(article?.description ?? '') || (article?.description ?? ''));
  const [content, setContent] = useState(() => contentForRichEditor(article?.content ?? ''));
  const [featuredImageSource, setFeaturedImageSource] = useState<'url' | 'file'>(article?.featuredImage ? 'url' : 'file');
  const [featuredImageUrl, setFeaturedImageUrl] = useState(article?.featuredImage ?? '');
  const [featuredImageCid, setFeaturedImageCid] = useState<string | null>(null);
  const [featuredImageName, setFeaturedImageName] = useState<string | null>(null);
  const [category, setCategory] = useState(article?.category ?? DEFAULT_VBLOG_CATEGORIES[0]);
  const [tags, setTags] = useState(article?.tags.join(', ') ?? '');
  const [linkedMagazineId, setLinkedMagazineId] = useState<string | undefined>(article?.linkedMagazineId);
  const [linkedIssueNumber, setLinkedIssueNumber] = useState<number | undefined>(article?.linkedIssueNumber);
  const [primaryLink, setPrimaryLink] = useState(article?.primaryLink ?? '');
  const [socialLinks, setSocialLinks] = useState<KxLinkRow[]>(() => vBlogSocialLinksToRows(article?.socialLinks));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isKrexWizardOpen, setIsKrexWizardOpen] = useState(false);
  const [magazineIntegrationEnabled, setMagazineIntegrationEnabled] = useState(Boolean(article?.linkedMagazineId && article?.linkedIssueNumber));
  const [premiumSectionEnabled, setPremiumSectionEnabled] = useState(Boolean(article?.modules?.premiumSectionEnabled));
  const [premiumSectionContent, setPremiumSectionContent] = useState(() => contentForRichEditor(article?.modules?.premiumSectionContent ?? ''));
  const [premiumSectionPriceKas, setPremiumSectionPriceKas] = useState(String(article?.modules?.premiumSectionPriceKas ?? 10));
  const [premiumSectionPayoutAddress, setPremiumSectionPayoutAddress] = useState(article?.modules?.premiumSectionPayoutAddress ?? '');
  const [tipBoxEnabled, setTipBoxEnabled] = useState(Boolean(article?.modules?.tipBoxEnabled));
  const [tipToRevealEnabled, setTipToRevealEnabled] = useState(Boolean(article?.modules?.tipToRevealEnabled));
  const [tipToRevealContent, setTipToRevealContent] = useState(() => contentForRichEditor(article?.modules?.tipToRevealContent ?? ''));
  const [tipToRevealThresholdKas, setTipToRevealThresholdKas] = useState(String(article?.modules?.tipToRevealThresholdKas ?? 25));
  const [premiumPollEnabled, setPremiumPollEnabled] = useState(Boolean(article?.modules?.premiumPollEnabled));
  const [pollQuestion, setPollQuestion] = useState(article?.modules?.premiumPoll?.question ?? '');
  const [pollOptions, setPollOptions] = useState((article?.modules?.premiumPoll?.options ?? ['Option 1', 'Option 2']).join(', '));
  const [readingReceiptsEnabled, setReadingReceiptsEnabled] = useState(Boolean(article?.modules?.readingReceiptsEnabled));
  const [sidebarShownByDefault, setSidebarShownByDefault] = useState(article?.layoutPreferences?.sidebarShownByDefault ?? true);
  const [rightPanelShownByDefault, setRightPanelShownByDefault] = useState(article?.layoutPreferences?.rightPanelShownByDefault ?? true);

  const resolvedFeaturedImage = useMemo(() => {
    if (featuredImageSource === 'url') return featuredImageUrl.trim();
    return featuredImageCid ? getBestGatewayUrl(featuredImageCid) : '';
  }, [featuredImageSource, featuredImageUrl, featuredImageCid]);

  const resolvedSocialLinks = useMemo(() => cleanVBlogSocialLinks(socialLinks), [socialLinks]);

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

  const originalPaidModuleIds = useMemo((): VBlogModuleId[] => {
    if (!article) return [];
    return getArticlePaidModuleIds(article);
  }, [article]);

  const formQuote = pricing.estimateQuote(
    {
      title,
      description,
      content,
      category,
      tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      featuredImage: resolvedFeaturedImage,
      linkedMagazineId: magazineIntegrationEnabled ? linkedMagazineId : undefined,
      linkedIssueNumber: magazineIntegrationEnabled ? linkedIssueNumber : undefined,
      author: (isEditMode ? article?.author : walletAddress) ?? undefined,
      primaryLink: primaryLink.trim() || undefined,
      socialLinks: resolvedSocialLinks,
      modules: modulesPayload,
      magazineIntegrationEnabled,
      excludeModuleIds: isEditMode ? originalPaidModuleIds : undefined,
    },
    isEditMode ? 'edit' : 'create',
  );

  const discountKas = formQuote.discountKas;
  const discountPercent =
    formQuote.subtotalKas > 0 ? Math.round((discountKas / formQuote.subtotalKas) * 100) : 0;

  const formModuleOffers = useMemo(
    () => VBLOG_MODULE_OFFERS.filter((offer) => FORM_MODULE_IDS.includes(offer.id) && offer.id !== 'premium_section'),
    [],
  );

  const premiumSectionOffer = useMemo(
    () => VBLOG_MODULE_OFFERS.find((offer) => offer.id === 'premium_section'),
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
    if (!article) return;
    setTitle(article.title);
    setDescription(htmlToPlainText(article.description) || article.description);
    setContent(contentForRichEditor(article.content));
    setFeaturedImageSource(article.featuredImage ? 'url' : 'file');
    setFeaturedImageUrl(article.featuredImage ?? '');
    setFeaturedImageCid(null);
    setFeaturedImageName(null);
    setCategory(article.category);
    setTags(article.tags.join(', '));
    setLinkedMagazineId(article.linkedMagazineId);
    setLinkedIssueNumber(article.linkedIssueNumber);
    setPrimaryLink(article.primaryLink ?? '');
    setSocialLinks(vBlogSocialLinksToRows(article.socialLinks));
    setMagazineIntegrationEnabled(Boolean(article.linkedMagazineId && article.linkedIssueNumber));
    setPremiumSectionEnabled(Boolean(article.modules?.premiumSectionEnabled));
    setPremiumSectionContent(contentForRichEditor(article.modules?.premiumSectionContent ?? ''));
    setPremiumSectionPriceKas(String(article.modules?.premiumSectionPriceKas ?? 10));
    setPremiumSectionPayoutAddress(article.modules?.premiumSectionPayoutAddress ?? '');
    setTipBoxEnabled(Boolean(article.modules?.tipBoxEnabled));
    setTipToRevealEnabled(Boolean(article.modules?.tipToRevealEnabled));
    setTipToRevealContent(contentForRichEditor(article.modules?.tipToRevealContent ?? ''));
    setTipToRevealThresholdKas(String(article.modules?.tipToRevealThresholdKas ?? 25));
    setPremiumPollEnabled(Boolean(article.modules?.premiumPollEnabled));
    setPollQuestion(article.modules?.premiumPoll?.question ?? '');
    setPollOptions((article.modules?.premiumPoll?.options ?? ['Option 1', 'Option 2']).join(', '));
    setReadingReceiptsEnabled(Boolean(article.modules?.readingReceiptsEnabled));
    setSidebarShownByDefault(article.layoutPreferences?.sidebarShownByDefault ?? true);
    setRightPanelShownByDefault(article.layoutPreferences?.rightPanelShownByDefault ?? true);
  }, [article]);

  useEffect(() => {
    if (premiumSectionEnabled && kaspaState.address && !premiumSectionPayoutAddress.trim()) {
      setPremiumSectionPayoutAddress(kaspaState.address);
    }
  }, [premiumSectionEnabled, kaspaState.address, premiumSectionPayoutAddress]);

  const uploadFeaturedImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = IPFS_MAX_UPLOAD_MB * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`Featured image must be under ${IPFS_MAX_UPLOAD_MB}MB`);
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

    if (!htmlToPlainText(content).trim()) {
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
      if (!htmlToPlainText(premiumSectionContent).trim() || !premiumSectionPayoutAddress.trim()) {
        setError('Premium section needs content and payout wallet address.');
        return;
      }
      const price = Number(premiumSectionPriceKas);
      if (!Number.isFinite(price) || price <= 0) {
        setError('Premium section unlock price must be greater than 0 KAS.');
        return;
      }
    }
    if (tipToRevealEnabled && !htmlToPlainText(tipToRevealContent).trim()) {
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
        setError('Wallet not connected. Please connect your wallet (Kaspa or EVM) to publish.');
        setIsSubmitting(false);
        return;
      }

      if (isCustomCategory(category)) {
        try {
          addAuthorCustomCategory(walletAddress, category);
        } catch {
          /* category already stored or invalid */
        }
      }

      const payload = {
        title: title.trim(),
        description: description.trim(),
        content: content.trim(),
        category,
        tags: tagsArray,
        featuredImage: resolvedFeaturedImage,
        linkedMagazineId: magazineIntegrationEnabled ? linkedMagazineId : undefined,
        linkedIssueNumber: magazineIntegrationEnabled ? linkedIssueNumber : undefined,
        primaryLink: primaryLink.trim() || undefined,
        socialLinks: resolvedSocialLinks,
        modules: modulesPayload,
        layoutPreferences: {
          sidebarShownByDefault,
          rightPanelShownByDefault,
        },
      };

      if (isEditMode && article && onUpdate) {
        await onUpdate(article.id, payload);
      } else if (onSubmit) {
        await onSubmit({
          ...payload,
          author: walletAddress,
        });
      } else {
        throw new Error('No submit handler configured');
      }

      if (isEditMode) return;

      setTitle('');
      setDescription('');
      setContent('');
      setFeaturedImageUrl('');
      setFeaturedImageCid(null);
      setFeaturedImageName(null);
      setFeaturedImageSource('file');
      setCategory(DEFAULT_VBLOG_CATEGORIES[0]);
      setTags('');
      setPrimaryLink('');
      setSocialLinks([{ label: '', url: '' }]);
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
      setSidebarShownByDefault(true);
      setRightPanelShownByDefault(true);
    } catch (err) {
      console.error('Error creating article:', err);
      setError(err instanceof Error ? err.message : 'Failed to create article. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
      <div className="flex flex-col gap-6 min-w-0">
        <div className={`${FORM_PANEL_CLASS} space-y-6`}>
          <div>
            <p className={`${FORM_SECTION_HEADING_CLASS} mb-3`}>Main content</p>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-4 tracking-tight">
              {isEditMode ? 'Edit Article' : 'Create New Article'}
            </h3>
            <p className="kx-body">
              {isEditMode ? 'Update your article details.' : 'Fill in the details below to create a new article.'} Estimated cost: {formQuote.totalKas} KAS ({formQuote.chunkCount} chunk{formQuote.chunkCount === 1 ? '' : 's'}, {formQuote.payloadBytes} bytes){pricing.tier.hasKREXDiscount ? ' (KREX holder discount)' : ''}.
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
            maxLength={pricing.isPremium ? CONTENT_LIMITS.premium.description.max : CONTENT_LIMITS.description.max}
            rows={3}
            className="k-input text-base w-full resize-y min-h-[4.5rem]"
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
          <KxRichTextEditor
            value={content}
            onChange={setContent}
            placeholder="Write your article content here..."
            minRows={14}
            maxLength={pricing.isPremium ? CONTENT_LIMITS.premium.content.max : CONTENT_LIMITS.content.max}
            disabled={isSubmitting}
          />
        </div>

        {premiumSectionOffer ? (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-sm">
            <KxInFormPremiumRow
              flat
              title={premiumSectionOffer.title}
              description={premiumSectionOffer.description}
              priceLabel={
                isEditMode && originalPaidModuleIds.includes('premium_section')
                  ? 'Paid'
                  : `+${getVBlogModuleEffectivePriceKas(premiumSectionOffer.unlockPriceKas, tier, nftStatus)} KAS`
              }
              checked={premiumSectionEnabled}
              disabled={isSubmitting}
              onToggle={() => setModuleEnabled('premium_section', !premiumSectionEnabled)}
            />
            {premiumSectionEnabled ? (
              <VBlogModuleConfigFields
                bare
                moduleId="premium_section"
                disabled={isSubmitting}
                premiumSectionContent={premiumSectionContent}
                onPremiumSectionContentChange={setPremiumSectionContent}
                premiumSectionPriceKas={premiumSectionPriceKas}
                onPremiumSectionPriceKasChange={setPremiumSectionPriceKas}
                premiumSectionPayoutAddress={premiumSectionPayoutAddress}
                onPremiumSectionPayoutAddressChange={setPremiumSectionPayoutAddress}
              />
            ) : null}
          </div>
        ) : null}

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
            uploadHint={`PNG, JPG, or WebP under ${IPFS_MAX_UPLOAD_MB} MB`}
            isUploading={isUploading}
            inputClassName="k-input"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="k-label">Category</label>
            <VBlogCategoryField
              authorAddress={walletAddress}
              value={category}
              onChange={setCategory}
              disabled={isSubmitting}
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
          <label className="k-label">Website</label>
          <input className="k-input" value={primaryLink} onChange={(e) => setPrimaryLink(e.target.value)} placeholder="https://yourwebsite.com" disabled={isSubmitting} />
        </div>

        <KxLinkRowsEditor
          label="Social links (up to 5)"
          rows={socialLinks}
          onChange={setSocialLinks}
          addLabel="Add social link"
          maxRows={5}
          labelMaxLength={VBLOG_SOCIAL_LABEL_MAX}
          disabled={isSubmitting}
        />

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
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

        <div className={`${FORM_PANEL_CLASS} space-y-4`}>
          <div>
            <p className={FORM_SECTION_HEADING_CLASS}>Advanced options</p>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Control default reader layout when this article opens.
            </p>
          </div>
          <div className="space-y-2">
            <KxInFormPremiumRow
              title="Sidebar shown by default"
              description="Readers see the left article navigation when they open this article."
              checked={sidebarShownByDefault}
              disabled={isSubmitting}
              onToggle={() => setSidebarShownByDefault(!sidebarShownByDefault)}
            />
            <KxInFormPremiumRow
              title="Right-side panel shown by default"
              description="Readers see the author and on-chain metadata panel on load."
              checked={rightPanelShownByDefault}
              disabled={isSubmitting}
              onToggle={() => setRightPanelShownByDefault(!rightPanelShownByDefault)}
            />
          </div>
        </div>

        <div
          id="vblog-dashboard-modules"
          className={`${FORM_PANEL_CLASS} scroll-mt-24 my-2 py-10 sm:py-12 space-y-6`}
        >
          <div className="space-y-2">
            <p className={FORM_SECTION_HEADING_CLASS}>Premium modules</p>
            <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              Optional premium features
            </h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Toggle modules on to add them to your total. They activate when you pay and publish.
            </p>
          </div>
        {formModuleOffers.map((offer) => {
          const enabled = moduleEnabledMap[offer.id];
          const alreadyPaid = isEditMode && originalPaidModuleIds.includes(offer.id);
          const effectiveKas = getVBlogModuleEffectivePriceKas(offer.unlockPriceKas, tier, nftStatus);
          return (
            <div
              key={offer.id}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-sm"
            >
              <KxInFormPremiumRow
                flat
                title={offer.title}
                description={offer.description}
                priceLabel={alreadyPaid ? 'Paid' : `+${effectiveKas} KAS`}
                checked={enabled}
                disabled={isSubmitting}
                onToggle={() => setModuleEnabled(offer.id, !enabled)}
              />
              {enabled && offer.id === 'magazine_integration' ? (
                <div className="pt-3 mt-3 border-t border-zinc-200 dark:border-zinc-700">
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
                  bare
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
        </div>
      </div>

      <div className="flex flex-col gap-4 xl:sticky xl:top-6">
        <VBlogDashboardBenefitsPanel />
        <aside className="flex flex-col bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-[0_10px_30px_-18px_rgba(2,171,184,0.4)]">
        <h4 className="text-xs font-black uppercase tracking-[0.18em] text-[#02abb8]">Calculation breakdown</h4>
        <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
          <div className="flex justify-between"><span>Base fee</span><span className="font-semibold text-zinc-900 dark:text-zinc-100">{formQuote.baseFeeKas} KAS</span></div>
          <div className="flex justify-between"><span>Size fee</span><span className="font-semibold text-zinc-900 dark:text-zinc-100">{formQuote.sizeFeeKas} KAS</span></div>
          <div className="flex justify-between"><span>Network buffer</span><span className="font-semibold text-zinc-900 dark:text-zinc-100">{formQuote.networkFeeBufferKas} KAS</span></div>
          {formQuote.moduleLines.map((line) => (
            <div key={line.id} className="flex justify-between gap-2">
              <span className="truncate">{line.title}</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 shrink-0">+{line.kas} KAS</span>
            </div>
          ))}
          {formQuote.modulesFeeKas > 0 ? (
            <div className="flex justify-between border-t border-zinc-200 dark:border-zinc-700 pt-1.5">
              <span>Modules subtotal</span>
              <span className="font-semibold text-[#02abb8]">{formQuote.modulesFeeKas} KAS</span>
            </div>
          ) : null}
          {formQuote.discountKas > 0 ? (
            <div className="flex justify-between border-t border-zinc-200 dark:border-zinc-700 pt-1.5">
              <span>Subtotal</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formQuote.subtotalKas} KAS</span>
            </div>
          ) : null}
          <div className="flex justify-between"><span>Payload bytes</span><span className="font-semibold text-zinc-900 dark:text-zinc-100">{formQuote.payloadBytes}</span></div>
          <div className="flex justify-between"><span>Chunk estimate</span><span className="font-semibold text-zinc-900 dark:text-zinc-100">{formQuote.chunkCount}</span></div>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-3">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Total to pay</p>
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{formQuote.totalKas} KAS</p>
        </div>
        <div className="rounded-xl bg-[#02abb8]/10 border border-[#02abb8]/25 p-3 text-sm text-zinc-700 dark:text-zinc-300">
          {isEditMode
            ? 'Updating sends one Kaspa L1 payment transaction and refreshes on-chain metadata.'
            : 'One Kaspa L1 payment covers the article and any enabled modules. Ensure your wallet has enough KAS.'}
        </div>
        {pricing.tier.hasKREXDiscount && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-800 dark:text-emerald-300">
            KREX discount: -{discountKas.toFixed(2)} KAS ({discountPercent}% off total).
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
          {isSubmitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Article' : 'Create Article')}
        </button>
        <KxAlertRegion>
          {error ? (
            <Alert type="error" compact onDismiss={() => setError(null)} region>
              <p>{error}</p>
            </Alert>
          ) : null}
        </KxAlertRegion>
        </aside>
      </div>
      <KREXBuyWizard isOpen={isKrexWizardOpen} onClose={() => setIsKrexWizardOpen(false)} />
    </form>
  );
}
