'use client';

import { useState, useEffect } from 'react';
import { VBlogArticle } from '@/lib/vblog/types';
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

interface EditArticleFormProps {
  article: VBlogArticle;
  onSubmit: (articleId: string, updates: Partial<Omit<VBlogArticle, 'id' | 'author' | 'publishDate'>>) => Promise<void>;
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

export function EditArticleForm({ article, onSubmit, onCancel }: EditArticleFormProps) {
  const pricing = useVBlogPricing();
  const [title, setTitle] = useState(article.title);
  const [description, setDescription] = useState(article.description);
  const [content, setContent] = useState(article.content);
  const [featuredImage, setFeaturedImage] = useState(article.featuredImage || '');
  const [category, setCategory] = useState(article.category);
  const [tags, setTags] = useState(article.tags.join(', '));
  const [cid, setCid] = useState(article.cid || '');
  const [linkedMagazineId, setLinkedMagazineId] = useState<string | undefined>(article.linkedMagazineId);
  const [linkedIssueNumber, setLinkedIssueNumber] = useState<number | undefined>(article.linkedIssueNumber);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updateQuote = pricing.estimateQuote({
    title,
    description,
    content,
    category,
    tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    featuredImage,
    linkedMagazineId,
    linkedIssueNumber,
    author: article.author,
  }, 'edit');

  useEffect(() => {
    setTitle(article.title);
    setDescription(article.description);
    setContent(article.content);
    setFeaturedImage(article.featuredImage || '');
    setCategory(article.category);
    setTags(article.tags.join(', '));
    setCid(article.cid || '');
    setLinkedMagazineId(article.linkedMagazineId);
    setLinkedIssueNumber(article.linkedIssueNumber);
  }, [article]);

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

    void handleConfirm();
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);

    try {
      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      await onSubmit(article.id, {
        title: title.trim(),
        description: description.trim(),
        content: content.trim(),
        category,
        tags: tagsArray,
        featuredImage: featuredImage.trim() || undefined,
        cid: cid.trim() || undefined,
        linkedMagazineId,
        linkedIssueNumber,
      });
    } catch (err) {
      console.error('Error updating article:', err);
      setError(err instanceof Error ? err.message : 'Failed to update article. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        <div className="space-y-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8">
        <div>
          <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-4 tracking-tight">
            Edit Article
          </h3>
          <p className="text-base text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
            Update your article details. Estimated cost: {updateQuote.totalKas} KAS ({updateQuote.chunkCount} chunk{updateQuote.chunkCount === 1 ? '' : 's'}, {updateQuote.payloadBytes} bytes){pricing.tier.hasKREXDiscount ? ' (KREX holder discount)' : ''}.
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

        <VBlogMagazineIntegration
          linkedMagazineId={linkedMagazineId}
          linkedIssueNumber={linkedIssueNumber}
          onChange={(magId, issueNum) => {
            setLinkedMagazineId(magId);
            setLinkedIssueNumber(issueNum);
          }}
          disabled={isSubmitting}
        />

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
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="mr-auto text-xs text-zinc-500 dark:text-zinc-400">
            Base {updateQuote.baseFeeKas} + Size {updateQuote.sizeFeeKas} + Network {updateQuote.networkFeeBufferKas} = {updateQuote.totalKas} KAS
          </div>
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
        <aside className="xl:sticky xl:top-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
          <h4 className="text-sm font-black uppercase tracking-widest text-[#02abb8]">Calculation breakdown</h4>
          <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <div className="flex justify-between"><span>Base fee</span><span className="font-bold text-zinc-900 dark:text-zinc-100">{updateQuote.baseFeeKas} KAS</span></div>
            <div className="flex justify-between"><span>Size fee</span><span className="font-bold text-zinc-900 dark:text-zinc-100">{updateQuote.sizeFeeKas} KAS</span></div>
            <div className="flex justify-between"><span>Network buffer</span><span className="font-bold text-zinc-900 dark:text-zinc-100">{updateQuote.networkFeeBufferKas} KAS</span></div>
            <div className="flex justify-between"><span>Payload bytes</span><span className="font-bold text-zinc-900 dark:text-zinc-100">{updateQuote.payloadBytes}</span></div>
            <div className="flex justify-between"><span>Chunk estimate</span><span className="font-bold text-zinc-900 dark:text-zinc-100">{updateQuote.chunkCount}</span></div>
          </div>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-3">
            <p className="text-xs uppercase tracking-widest text-zinc-500">Total to pay</p>
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{updateQuote.totalKas} KAS</p>
          </div>
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-sm text-amber-800 dark:text-amber-300">
            Updating sends one Kaspa L1 payment transaction and refreshes on-chain metadata.
          </div>
          {pricing.tier.hasKREXDiscount && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-800 dark:text-emerald-300">
              KREX discount applied to the base fee.
            </div>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-2.5 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Updating...' : 'Update Article'}
          </button>
        </aside>
      </form>
    </>
  );
}

