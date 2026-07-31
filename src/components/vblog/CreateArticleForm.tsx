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
import { ArticlePreviewModal } from './ArticlePreviewModal';
import { registerMagazineSubmission } from '@/lib/magazines/submissions';
import { getVBlogModuleEffectivePriceKas, getEnabledVBlogModuleIds, getArticlePaidModuleIds, VBLOG_MODULE_OFFERS } from '@/lib/vblog/modules';
import { useIPFSUpload } from '@/lib/ipfs/hooks';
import { getBestGatewayUrl, normalizeIpfsUrlForForm } from '@/lib/hub/ipfsStandard';
import { KxImageSourceField } from '@/components/ui/KxImageSourceField';
import { KxRichTextEditor } from '@/components/ui/KxRichTextEditor';
import { KxInFormPremiumRow } from '@/components/ui/KxInFormPremiumRow';
import { KxAlertRegion } from '@/components/ui/KxAlertRegion';
import { VBlogModuleConfigFields } from './VBlogModuleConfigFields';
import { VBlogCategoryField } from './VBlogCategoryField';
import { VBlogDashboardBenefitsPanel } from './VBlogDashboardBenefitsPanel';
import { HubAsideRail } from '@/components/hub/HubAsideRail';
import { DEFAULT_VBLOG_CATEGORIES, addAuthorCustomCategory, isCustomCategory } from '@/lib/vblog/categories';
import { cleanVBlogSocialLinks, vBlogSocialLinksToRows, VBLOG_SOCIAL_LABEL_MAX } from '@/lib/vblog/socialLinks';
import { cleanPollOptions, defaultPollOptions } from '@/components/vblog/VBlogPollOptionsEditor';
import { cleanPayoutSplitRows, payoutSplitRowsFromModules, DEFAULT_PAYOUT_SPLIT_ROWS } from '@/lib/vblog/paymentSplit';
import type { PayoutSplitRow } from '@/components/vblog/VBlogModuleConfigFields';
import { validateVBlogModulesForPublish } from '@/lib/vblog/formValidation';
import { KxLinkRowsEditor, type KxLinkRow } from '@/components/ui/KxLinkRowsEditor';
import { IPFS_MAX_UPLOAD_MB } from '@/lib/ipfs/limits';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { HubFlowProgress } from '@/components/hub/HubFlowProgress';
import { getHubFlowPreset } from '@/lib/hub/hubFlowProgress';
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';
import { HubListingCalculationBreakdown } from '@/components/hub/HubListingCalculationBreakdown';
import { hubCatalogSelectionToStoreCurrency } from '@/hooks/useHubPayWithCatalog';
import type { HubListingPriceQuote } from '@/lib/hub/listingPricing';
import { formatHubPaymentAmount, buildKasKrexCurrencyOptions } from '@/lib/payments/hubPaymentTypes';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import type { StorePaymentCurrency } from '@/lib/store/currencies';

const FORM_PANEL_CLASS =
  'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8';

/** Premium module card: amber dashed accent + subtle gradient so paid features stand out. */
const PREMIUM_MODULE_CARD_CLASS =
  'rounded-2xl border-2 border-dashed border-amber-400/60 dark:border-amber-300/40 bg-gradient-to-b from-amber-50/70 to-white dark:from-amber-500/[0.08] dark:to-zinc-900 p-5 sm:p-6 shadow-sm';

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
  return id === 'premium_section' || id === 'tip_to_reveal' || id === 'premium_poll' || id === 'tip_box';
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
  const [paymentCurrency, setPaymentCurrency] = useState<StorePaymentCurrency>('KAS');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [magazineIntegrationEnabled, setMagazineIntegrationEnabled] = useState(Boolean(article?.linkedMagazineId && article?.linkedIssueNumber));
  const [premiumSectionEnabled, setPremiumSectionEnabled] = useState(Boolean(article?.modules?.premiumSectionEnabled));
  const [premiumSectionContent, setPremiumSectionContent] = useState(() => contentForRichEditor(article?.modules?.premiumSectionContent ?? ''));
  const [premiumSectionPriceKas, setPremiumSectionPriceKas] = useState(String(article?.modules?.premiumSectionPriceKas ?? 10));
  const [premiumPayoutSplitRows, setPremiumPayoutSplitRows] = useState<PayoutSplitRow[]>(() =>
    payoutSplitRowsFromModules(article?.modules),
  );
  const [tipBoxEnabled, setTipBoxEnabled] = useState(Boolean(article?.modules?.tipBoxEnabled));
  const [tipBoxPresets, setTipBoxPresets] = useState(() =>
    (article?.modules?.tipBox?.presets ?? [10, 50, 100]).join(', '),
  );
  const [tipBoxCurrencies, setTipBoxCurrencies] = useState<string[]>(
    () => article?.modules?.tipBox?.currencies ?? ['KAS'],
  );
  const [tipToRevealEnabled, setTipToRevealEnabled] = useState(Boolean(article?.modules?.tipToRevealEnabled));
  const [tipToRevealContent, setTipToRevealContent] = useState(() => contentForRichEditor(article?.modules?.tipToRevealContent ?? ''));
  const [tipToRevealThresholdKas, setTipToRevealThresholdKas] = useState(String(article?.modules?.tipToRevealThresholdKas ?? 25));
  const [premiumPollEnabled, setPremiumPollEnabled] = useState(Boolean(article?.modules?.premiumPollEnabled));
  const [pollQuestion, setPollQuestion] = useState(article?.modules?.premiumPoll?.question ?? '');
  const [pollOptions, setPollOptions] = useState<string[]>(() => {
    const saved = article?.modules?.premiumPoll?.options;
    return saved?.length ? [...saved] : defaultPollOptions();
  });
  const [readingReceiptsEnabled, setReadingReceiptsEnabled] = useState(Boolean(article?.modules?.readingReceiptsEnabled));
  const [sidebarShownByDefault, setSidebarShownByDefault] = useState(article?.layoutPreferences?.sidebarShownByDefault ?? true);
  const [rightPanelShownByDefault, setRightPanelShownByDefault] = useState(article?.layoutPreferences?.rightPanelShownByDefault ?? true);

  const resolvedFeaturedImage = useMemo(() => {
    if (featuredImageSource === 'url') return featuredImageUrl.trim();
    return featuredImageCid ? getBestGatewayUrl(featuredImageCid) : '';
  }, [featuredImageSource, featuredImageUrl, featuredImageCid]);

  const resolvedSocialLinks = useMemo(() => cleanVBlogSocialLinks(socialLinks), [socialLinks]);

  const resolvedPremiumPayoutSplits = useMemo(
    () => cleanPayoutSplitRows(premiumPayoutSplitRows),
    [premiumPayoutSplitRows],
  );

  const parsedTipPresets = useMemo(() => {
    const nums = tipBoxPresets
      .split(',')
      .map((v) => Number(v.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);
    return nums.length > 0 ? nums.slice(0, 6) : [10, 50, 100];
  }, [tipBoxPresets]);

  const modulesPayload = useMemo(
    () => ({
      premiumSectionEnabled,
      premiumSectionContent: premiumSectionEnabled ? premiumSectionContent.trim() : undefined,
      premiumSectionPriceKas: premiumSectionEnabled ? Number(premiumSectionPriceKas) : undefined,
      premiumSectionPayoutAddress: premiumSectionEnabled ? resolvedPremiumPayoutSplits[0]?.address : undefined,
      premiumSectionPayoutSplits: premiumSectionEnabled ? resolvedPremiumPayoutSplits : undefined,
      tipBoxEnabled,
      tipBox: tipBoxEnabled
        ? { presets: parsedTipPresets, allowCustom: true, currencies: tipBoxCurrencies }
        : undefined,
      tipToRevealEnabled,
      tipToRevealContent: tipToRevealEnabled ? tipToRevealContent.trim() : undefined,
      tipToRevealThresholdKas: tipToRevealEnabled ? Number(tipToRevealThresholdKas) : undefined,
      premiumPollEnabled,
      premiumPoll: premiumPollEnabled
        ? { question: pollQuestion.trim(), options: cleanPollOptions(pollOptions) }
        : undefined,
      readingReceiptsEnabled,
    }),
    [
      premiumSectionEnabled,
      premiumSectionContent,
      premiumSectionPriceKas,
      resolvedPremiumPayoutSplits,
      premiumPayoutSplitRows,
      tipBoxEnabled,
      parsedTipPresets,
      tipBoxCurrencies,
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
      priorPricingSnapshot:
        isEditMode && article?.pricingSnapshot?.payloadBytes != null && article?.pricingSnapshot?.chunkCount != null
          ? {
              payloadBytes: article.pricingSnapshot.payloadBytes,
              chunkCount: article.pricingSnapshot.chunkCount,
            }
          : undefined,
    },
    isEditMode ? 'edit' : 'create',
  );

  const discountKas = formQuote.discountKas;
  const discountPercent =
    formQuote.subtotalKas > 0 ? Math.round((discountKas / formQuote.subtotalKas) * 100) : 0;
  const listingQuote = useMemo(
    (): HubListingPriceQuote => ({
      action: formQuote.action,
      payloadBytes: formQuote.payloadBytes,
      chunkCount: formQuote.chunkCount,
      baseFeeKas: formQuote.baseFeeKas,
      sizeFeeKas: formQuote.sizeFeeKas,
      networkFeeBufferKas: formQuote.networkFeeBufferKas,
      modulesFeeKas: formQuote.modulesFeeKas,
      moduleLines: formQuote.moduleLines,
      subtotalKas: formQuote.subtotalKas,
      discountPercent,
      discountKas,
      totalKas: formQuote.totalKas,
      contentHash: '',
    }),
    [formQuote, discountKas, discountPercent],
  );

  const tagsArray = useMemo(
    () => tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    [tags],
  );

  const previewArticle = useMemo((): VBlogArticle => {
    const author = walletAddress ?? article?.author ?? 'preview';
    return {
      id: article?.id ?? 'preview',
      slug: article?.slug ?? 'preview',
      title: title.trim() || 'Untitled article',
      description: description.trim() || 'No description yet.',
      content: content.trim() || '<p>No content yet.</p>',
      author,
      publishDate: article?.publishDate ?? new Date().toISOString(),
      category: category || DEFAULT_VBLOG_CATEGORIES[0],
      tags: tagsArray,
      featuredImage: resolvedFeaturedImage || undefined,
      status: article?.status ?? 'draft',
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
  }, [
    walletAddress,
    article,
    title,
    description,
    content,
    category,
    tagsArray,
    resolvedFeaturedImage,
    magazineIntegrationEnabled,
    linkedMagazineId,
    linkedIssueNumber,
    primaryLink,
    resolvedSocialLinks,
    modulesPayload,
    sidebarShownByDefault,
    rightPanelShownByDefault,
  ]);

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
    setFeaturedImageUrl(normalizeIpfsUrlForForm(article.featuredImage));
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
    setPremiumPayoutSplitRows(payoutSplitRowsFromModules(article.modules));
    setTipBoxEnabled(Boolean(article.modules?.tipBoxEnabled));
    setTipBoxPresets((article.modules?.tipBox?.presets ?? [10, 50, 100]).join(', '));
    setTipBoxCurrencies(article.modules?.tipBox?.currencies ?? ['KAS']);
    setTipToRevealEnabled(Boolean(article.modules?.tipToRevealEnabled));
    setTipToRevealContent(contentForRichEditor(article.modules?.tipToRevealContent ?? ''));
    setTipToRevealThresholdKas(String(article.modules?.tipToRevealThresholdKas ?? 25));
    setPremiumPollEnabled(Boolean(article.modules?.premiumPollEnabled));
    setPollQuestion(article.modules?.premiumPoll?.question ?? '');
    const savedOptions = article.modules?.premiumPoll?.options;
    setPollOptions(savedOptions?.length ? [...savedOptions] : defaultPollOptions());
    setReadingReceiptsEnabled(Boolean(article.modules?.readingReceiptsEnabled));
    setSidebarShownByDefault(article.layoutPreferences?.sidebarShownByDefault ?? true);
    setRightPanelShownByDefault(article.layoutPreferences?.rightPanelShownByDefault ?? true);
  }, [article]);

  useEffect(() => {
    if (!premiumSectionEnabled || !kaspaState.address) return;
    setPremiumPayoutSplitRows((rows) => {
      if (rows[0]?.address.trim()) return rows;
      const next = [...rows];
      next[0] = { ...next[0], address: kaspaState.address ?? '', sharePercent: next[0]?.sharePercent || '100' };
      return next;
    });
  }, [premiumSectionEnabled, kaspaState.address]);

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
      setFeaturedImageUrl(normalizeIpfsUrlForForm(null, uploadedCid));
      setFeaturedImageSource('url');
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

    const tipPresetNums = tipBoxPresets
      .split(',')
      .map((v) => Number(v.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);
    const modulesErr = validateVBlogModulesForPublish({
      premiumSectionEnabled,
      premiumSectionContent,
      premiumSectionPriceKas,
      premiumPayoutSplits: resolvedPremiumPayoutSplits,
      tipBoxEnabled,
      tipBoxPresets: tipPresetNums,
      tipBoxCurrencies: tipBoxCurrencies,
      tipToRevealEnabled,
      tipToRevealContent,
      tipToRevealThresholdKas,
      premiumPollEnabled,
      pollQuestion,
      pollOptions: cleanPollOptions(pollOptions),
      magazineIntegrationEnabled,
      linkedMagazineId,
      linkedIssueNumber,
    });
    if (modulesErr) {
      setError(modulesErr);
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
        if (magazineIntegrationEnabled && linkedMagazineId && linkedIssueNumber) {
          registerMagazineSubmission(article.id);
        }
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
      setPremiumPayoutSplitRows(DEFAULT_PAYOUT_SPLIT_ROWS());
      setTipBoxEnabled(false);
      setTipBoxPresets('10, 50, 100');
      setTipBoxCurrencies(['KAS']);
      setTipToRevealEnabled(false);
      setTipToRevealContent('');
      setTipToRevealThresholdKas('25');
      setPremiumPollEnabled(false);
      setPollQuestion('');
      setPollOptions(defaultPollOptions());
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
    <form onSubmit={handleSubmit} className="grid grid-cols-1 items-stretch xl:grid-cols-[minmax(0,1fr)_340px] gap-6">
      <div className="flex flex-col gap-6 min-w-0">
        <div className={`${FORM_PANEL_CLASS} space-y-6`}>
          <div>
            <DAppSectionHeader title="Main content" className="mb-3" />
            <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-4 tracking-tight">
              {isEditMode ? 'Edit Article' : 'Create New Article'}
            </h3>
            <p className="kx-body">
              {isEditMode
                ? `Updates commit on-chain from 1 KAS. Extra charges apply only for new modules or larger payload. Estimated cost: ${formQuote.totalKas} KAS.`
                : `Fill in the details below to create a new article. Estimated cost: ${formQuote.totalKas} KAS (${formQuote.chunkCount} chunk${formQuote.chunkCount === 1 ? '' : 's'}, ${formQuote.payloadBytes} bytes)${pricing.tier.hasKREXDiscount ? ' (KREX holder discount)' : ''}.`}
            </p>
          </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <KxFormFieldLabel>
              Title <span className="text-red-500">*</span>
            </KxFormFieldLabel>
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
            <KxFormFieldLabel>
              Short Description <span className="text-red-500">*</span>
            </KxFormFieldLabel>
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
            <KxFormFieldLabel>
              Main Content <span className="text-red-500">*</span>
            </KxFormFieldLabel>
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
          <div className={PREMIUM_MODULE_CARD_CLASS}>
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
                premiumPayoutSplitRows={premiumPayoutSplitRows}
                onPremiumPayoutSplitRowsChange={setPremiumPayoutSplitRows}
              />
            ) : null}
          </div>
        ) : null}

        <div className="k-form-group !mb-0">
          <KxFormFieldLabel>
            Featured image <span className="text-red-500">*</span>
          </KxFormFieldLabel>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-2">
            Recommended size: 1200x630px (1.91:1 aspect ratio) for optimal display
          </p>
          <KxImageSourceField
            source={featuredImageSource}
            onSourceChange={setFeaturedImageSource}
            url={featuredImageUrl}
            onUrlChange={(next) => {
              setFeaturedImageUrl(normalizeIpfsUrlForForm(next));
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
            <KxFormFieldLabel>Category</KxFormFieldLabel>
            <VBlogCategoryField
              authorAddress={walletAddress}
              value={category}
              onChange={setCategory}
              disabled={isSubmitting}
            />
          </div>
          <div>
            <KxFormFieldLabel>Tags (comma-separated)</KxFormFieldLabel>
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
          <KxFormFieldLabel>Website</KxFormFieldLabel>
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
            <DAppSectionHeader title="Advanced options" className="mb-0" />
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
            <DAppSectionHeader title="Premium modules" className="mb-0" />
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
            <div key={offer.id} className={PREMIUM_MODULE_CARD_CLASS}>
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
                <div className="pt-5 mt-5 border-t border-zinc-200 dark:border-zinc-700">
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
                  premiumPayoutSplitRows={premiumPayoutSplitRows}
                  onPremiumPayoutSplitRowsChange={setPremiumPayoutSplitRows}
                  tipToRevealContent={tipToRevealContent}
                  onTipToRevealContentChange={setTipToRevealContent}
                  tipToRevealThresholdKas={tipToRevealThresholdKas}
                  onTipToRevealThresholdKasChange={setTipToRevealThresholdKas}
                  tipBoxPresets={tipBoxPresets}
                  onTipBoxPresetsChange={setTipBoxPresets}
                  tipBoxCurrencies={tipBoxCurrencies}
                  onTipBoxCurrenciesChange={setTipBoxCurrencies}
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

      <HubAsideRail adSlotId="HALO_VBLOG_RIGHT" adId="ad-slot-vblog-article-form-rail">
        <VBlogDashboardBenefitsPanel />
        <aside className="flex flex-col bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-[0_10px_30px_-18px_rgba(227, 13, 27,0.4)]">
        <HubListingCalculationBreakdown
          quote={listingQuote}
          hubPoints={isEditMode ? undefined : HUB_EARN_POINTS.vblogArticleCreate}
          footerNote={
            isEditMode
              ? 'One Kaspa L1 payment refreshes on-chain metadata. Module and payload growth add to the 1 KAS base fee.'
              : 'One Kaspa L1 payment covers the article and any enabled modules. Ensure your wallet has enough KAS.'
          }
          selectedCurrencyId={paymentCurrency}
          onCurrencySelect={(opt) => {
            const next = hubCatalogSelectionToStoreCurrency(opt);
            if (next === 'KAS' || next === 'KREX') setPaymentCurrency(next);
            else setPaymentCurrency('KAS');
          }}
        />
        <button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="w-full k-control-btn hub-cta-btn disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? isEditMode
              ? 'Updating...'
              : 'Creating...'
            : `${isEditMode ? 'Update Article' : 'Create Article'} (${formatHubPaymentAmount(
                buildKasKrexCurrencyOptions().find((c) => c.id === paymentCurrency) ??
                  buildKasKrexCurrencyOptions()[0],
                formQuote.totalKas,
              )})`}
        </button>
        <button
          type="button"
          onClick={() => setIsPreviewOpen(true)}
          disabled={isSubmitting}
          className="w-full k-control-btn disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Preview Article
        </button>
        <KxAlertRegion>
          {error ? (
            <Alert type="error" compact onDismiss={() => setError(null)} region>
              <p>{error}</p>
            </Alert>
          ) : null}
        </KxAlertRegion>
        <HubFlowProgress
          steps={getHubFlowPreset('hubPublish')}
          busy={isSubmitting || isUploading}
        />
        </aside>
        </HubAsideRail>
      <ArticlePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        article={previewArticle}
      />
    </form>
  );
}
