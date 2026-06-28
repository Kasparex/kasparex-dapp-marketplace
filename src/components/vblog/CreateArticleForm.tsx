'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { VBlogArticle, VBlogModuleId } from '@/lib/vblog/types';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useAccount } from 'wagmi';
import { useVBlogPricing } from '@/hooks/useVBlogPricing';
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
import { getAuthorUnlockedModules } from '@/lib/vblog/modules';
import { VBlogInlineModuleUnlockCard } from './VBlogModuleUnlockCards';

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

// Fee will be determined by useVBlogPricing hook

export function CreateArticleForm({ onSubmit, onCancel }: CreateArticleFormProps) {
  const { state: kaspaState } = useKaspaWallet();
  const { address: evmAddress, isConnected: isEVMConnected } = useAccount();
  const pricing = useVBlogPricing();

  // Support both Kaspa and EVM wallets
  const walletAddress = kaspaState.address || (evmAddress ? `evm:${evmAddress}` : null);
  const isWalletConnected = kaspaState.isConnected || isEVMConnected;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [tags, setTags] = useState('');
  const [cid, setCid] = useState('');
  const [linkedMagazineId, setLinkedMagazineId] = useState<string | undefined>();
  const [linkedIssueNumber, setLinkedIssueNumber] = useState<number | undefined>();
  const [primaryLink, setPrimaryLink] = useState('');
  const [socialLink1, setSocialLink1] = useState('');
  const [socialLink2, setSocialLink2] = useState('');
  const [socialLink3, setSocialLink3] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isKrexWizardOpen, setIsKrexWizardOpen] = useState(false);
  const [unlockedModules, setUnlockedModules] = useState<string[]>([]);
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
  const createQuote = pricing.estimateQuote({
    title,
    description,
    content,
    category,
    tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    featuredImage,
    linkedMagazineId,
    linkedIssueNumber,
    author: walletAddress ?? undefined,
  }, 'create');
  const fullBaseFee = getVBlogBaseFeeKas('create');
  const discountKas = Math.max(0, fullBaseFee - createQuote.baseFeeKas);
  const discountPercent = fullBaseFee > 0 ? Math.round((discountKas / fullBaseFee) * 100) : 0;

  useEffect(() => {
    if (!kaspaState.address) {
      setUnlockedModules([]);
      return;
    }
    setUnlockedModules(getAuthorUnlockedModules(kaspaState.address));
  }, [kaspaState.address]);

  type ModuleItem = {
    id: VBlogModuleId;
    title: string;
    description: string;
    unlocked: boolean;
    enabled: boolean;
    onToggle: (next: boolean) => void;
    fields: ReactNode;
    readOnly?: boolean;
  };

  const moduleItems: ModuleItem[] = [
    {
      id: 'premium_section',
      title: 'Premium section unlock',
      description: 'Adds paid premium content with custom payout settings.',
      unlocked: unlockedModules.includes('premium_section'),
      enabled: premiumSectionEnabled,
      onToggle: setPremiumSectionEnabled,
      fields: premiumSectionEnabled ? (
        <div className="space-y-2">
          <textarea value={premiumSectionContent} onChange={(e) => setPremiumSectionContent(e.target.value)} rows={4} className="k-textarea" placeholder="Premium section content" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input className="k-input" value={premiumSectionPriceKas} onChange={(e) => setPremiumSectionPriceKas(e.target.value)} placeholder="Unlock price KAS" />
            <input className="k-input" value={premiumSectionPayoutAddress} onChange={(e) => setPremiumSectionPayoutAddress(e.target.value)} placeholder="Payout Kaspa address" />
          </div>
        </div>
      ) : null,
    },
    {
      id: 'tip_box',
      title: 'Tip box',
      description: 'Lets readers support you with quick or custom tips.',
      unlocked: unlockedModules.includes('tip_box'),
      enabled: tipBoxEnabled,
      onToggle: setTipBoxEnabled,
      fields: null,
    },
    {
      id: 'tip_to_reveal',
      title: 'Tip-to-reveal bonus',
      description: 'Unlock hidden bonus content after a tip threshold.',
      unlocked: unlockedModules.includes('tip_to_reveal'),
      enabled: tipToRevealEnabled,
      onToggle: setTipToRevealEnabled,
      fields: tipToRevealEnabled ? (
        <div className="space-y-2">
          <textarea value={tipToRevealContent} onChange={(e) => setTipToRevealContent(e.target.value)} rows={3} className="k-textarea" placeholder="Bonus content" />
          <input className="k-input" value={tipToRevealThresholdKas} onChange={(e) => setTipToRevealThresholdKas(e.target.value)} placeholder="Reveal threshold KAS" />
        </div>
      ) : null,
    },
    {
      id: 'premium_poll',
      title: 'Premium poll',
      description: 'Enable paid-reader voting and private poll insights.',
      unlocked: unlockedModules.includes('premium_poll'),
      enabled: premiumPollEnabled,
      onToggle: setPremiumPollEnabled,
      fields: premiumPollEnabled ? (
        <div className="space-y-2">
          <input className="k-input" value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} placeholder="Poll question" />
          <input className="k-input" value={pollOptions} onChange={(e) => setPollOptions(e.target.value)} placeholder="Options comma-separated" />
        </div>
      ) : null,
    },
    {
      id: 'reading_receipts_badges',
      title: 'Reading receipts + badges',
      description: 'Track reader streaks with on-chain receipt proofs.',
      unlocked: unlockedModules.includes('reading_receipts_badges'),
      enabled: readingReceiptsEnabled,
      onToggle: setReadingReceiptsEnabled,
      fields: null,
    },
    {
      id: 'magazine_integration',
      title: 'Magazine integration',
      description: 'Connect article directly to a magazine issue.',
      unlocked: unlockedModules.includes('magazine_integration'),
      enabled: Boolean(linkedMagazineId && linkedIssueNumber),
      onToggle: () => {},
      fields: null,
      readOnly: true,
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation with word limits
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

    if (premiumSectionEnabled) {
      if (!premiumSectionContent.trim() || !premiumSectionPayoutAddress.trim()) {
        setError('Premium section needs content and payout wallet address.');
        return;
      }
    }
    if (tipToRevealEnabled && !tipToRevealContent.trim()) {
      setError('Tip-to-reveal bonus content is required when enabled.');
      return;
    }
    if (premiumPollEnabled) {
      const options = pollOptions.split(',').map((x) => x.trim()).filter(Boolean);
      if (!pollQuestion.trim() || options.length < 2) {
        setError('Premium poll requires a question and at least 2 options.');
        return;
      }
    }

    void handleConfirm();
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);

    try {
      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

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
        featuredImage: featuredImage.trim() || undefined,
        linkedMagazineId,
        linkedIssueNumber,
        primaryLink: primaryLink.trim() || undefined,
        socialLinks: [socialLink1, socialLink2, socialLink3].map((x) => x.trim()).filter(Boolean),
        modules: {
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
        },
        // Note: cid is auto-generated by createArticle, but we keep the input field for future IPFS integration
      });

      // Reset form
      setTitle('');
      setDescription('');
      setContent('');
      setFeaturedImage('');
      setCategory(CATEGORIES[0]);
      setTags('');
      setCid('');
      setPrimaryLink('');
      setSocialLink1('');
      setSocialLink2('');
      setSocialLink3('');
    } catch (err) {
      console.error('Error creating article:', err);
      setError(err instanceof Error ? err.message : 'Failed to create article. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        <div className="space-y-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8">
        <div>
          <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-4 tracking-tight">
            Create New Article
          </h3>
          <p className="kx-body mb-6">
            Fill in the details below to create a new article. Estimated cost: {createQuote.totalKas} KAS ({createQuote.chunkCount} chunk{createQuote.chunkCount === 1 ? '' : 's'}, {createQuote.payloadBytes} bytes){pricing.tier.hasKREXDiscount ? ' (KREX holder discount)' : ''}.
          </p>
          {pricing.tier.hasNFTPerks && (
            <Alert type="success" compact className="mb-4">
              <p>NFT Perks Active: Increased text limits enabled ({pricing.tier.nftCollections.join(', ')})</p>
            </Alert>
          )}
        </div>

        {error && (
          <Alert type="error" title="Error" onDismiss={() => setError(null)}>
            <p>{error}</p>
          </Alert>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="k-label">
              Title <span className="text-red-500">*</span>
            </label>
            <span className={`text-xs ${getCharacterCount(title) > (pricing.isPremium ? CONTENT_LIMITS.premium.title.max : CONTENT_LIMITS.title.max)
              ? 'text-red-500'
              : 'text-zinc-500 dark:text-zinc-400'
              }`}>
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
            <span className={`text-xs ${getCharacterCount(description) > (pricing.isPremium ? CONTENT_LIMITS.premium.description.max : CONTENT_LIMITS.description.max)
              ? 'text-red-500'
              : 'text-zinc-500 dark:text-zinc-400'
              }`}>
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

        <div>
          <label className="k-label">
            Featured Image URL or CID
            <span className="text-red-500 ml-1">*</span>
          </label>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-2">
            Recommended size: 1200x630px (1.91:1 aspect ratio) for optimal display
          </p>
          <input
            type="text"
            value={featuredImage}
            onChange={(e) => setFeaturedImage(e.target.value)}
            placeholder="Enter image URL or CID"
            className="k-input text-base"
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="k-label">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="k-select"
              disabled={isSubmitting}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="k-label">
              Tags (comma-separated)
            </label>
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

        <VBlogMagazineIntegration
          linkedMagazineId={linkedMagazineId}
          linkedIssueNumber={linkedIssueNumber}
          onChange={(magId, issueNum) => {
            setLinkedMagazineId(magId);
            setLinkedIssueNumber(issueNum);
          }}
          disabled={isSubmitting || !unlockedModules.includes('magazine_integration')}
        />
        {!unlockedModules.includes('magazine_integration') && (
          <p className="text-xs text-amber-700 dark:text-amber-300">Unlock the Magazine Integration module to enable article-to-issue linking.</p>
        )}

        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-base font-black uppercase tracking-widest text-[#0884a4] dark:text-[#4db8d4]">Vault modules & unlocks</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Interactive modules with unlock + configure states</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {moduleItems.map((module) => (
              <div key={module.id} className={`rounded-2xl border p-4 space-y-3 ${module.unlocked ? 'border-cyan-400/35 bg-cyan-500/[0.03]' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-zinc-900 dark:text-zinc-100">{module.title}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{module.description}</p>
                  </div>
                  {module.unlocked ? (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={module.enabled}
                      onClick={() => !module.readOnly && module.onToggle(!module.enabled)}
                      disabled={Boolean(module.readOnly) || isSubmitting}
                      className={`k-switch ${module.enabled ? 'k-switch-on' : ''} ${module.readOnly ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      <span className="k-switch-thumb" />
                    </button>
                  ) : (
                    <span className="text-[10px] uppercase tracking-widest font-black text-amber-600 dark:text-amber-300">Locked</span>
                  )}
                </div>
                {module.unlocked ? module.fields : (
                  <div className="pt-1">
                    <VBlogInlineModuleUnlockCard moduleId={module.id as VBlogModuleId} onUnlocked={(ids) => setUnlockedModules(ids)} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <div>
          <label className="k-label">
            Content CID (optional)
          </label>
          <input
            type="text"
            value={cid}
            onChange={(e) => setCid(e.target.value)}
            placeholder="Paste the content CID or reference hash"
            className="k-input font-mono"
            disabled={isSubmitting}
          />
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
            If you&apos;ve already uploaded your content to IPFS or another decentralized storage, paste the CID here.
          </p>
        </div>

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
        </div>
        <aside className="xl:sticky xl:top-6 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-[0_10px_30px_-18px_rgba(2,171,184,0.4)]">
          <h4 className="text-xs font-black uppercase tracking-[0.18em] text-[#02abb8]">Calculation breakdown</h4>
          <div className="space-y-2 kx-body">
            <div className="flex justify-between"><span>Base fee</span><span className="font-bold text-zinc-900 dark:text-zinc-100">{createQuote.baseFeeKas} KAS</span></div>
            <div className="flex justify-between"><span>Size fee</span><span className="font-bold text-zinc-900 dark:text-zinc-100">{createQuote.sizeFeeKas} KAS</span></div>
            <div className="flex justify-between"><span>Network buffer</span><span className="font-bold text-zinc-900 dark:text-zinc-100">{createQuote.networkFeeBufferKas} KAS</span></div>
            <div className="flex justify-between"><span>Payload bytes</span><span className="font-bold text-zinc-900 dark:text-zinc-100">{createQuote.payloadBytes}</span></div>
            <div className="flex justify-between"><span>Chunk estimate</span><span className="font-bold text-zinc-900 dark:text-zinc-100">{createQuote.chunkCount}</span></div>
          </div>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-3">
            <p className="text-xs uppercase tracking-widest text-zinc-500">Total to pay</p>
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{createQuote.totalKas} KAS</p>
          </div>
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-sm text-amber-800 dark:text-amber-300">
            One Kaspa L1 payment will be requested. Ensure your wallet has enough KAS for fee + network cost.
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
            disabled={isSubmitting}
            className="w-full px-4 py-2.5 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Create Article'}
          </button>
        </aside>
        <KREXBuyWizard isOpen={isKrexWizardOpen} onClose={() => setIsKrexWizardOpen(false)} />
      </form>
  );
}

