'use client';

import { useState, useEffect } from 'react';
import { VBlogArticle } from '@/lib/vblog/types';
import { KASFeeConfirmation } from './KASFeeConfirmation';
import { KASFeeInfo } from '@/lib/vblog/types';
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
  const [showFeeConfirmation, setShowFeeConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    // Show fee confirmation
    setShowFeeConfirmation(true);
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setShowFeeConfirmation(false);

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
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Edit Article
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
            Update your article details. Updating an article costs {pricing.editFee} KAS{pricing.tier.hasKREXDiscount ? ' (KREX holder discount)' : ''}.
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
            className="k-input"
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
            className="k-textarea min-h-[80px]"
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
            rows={10}
            className="k-textarea"
          />
        </div>

        <div>
          <label className="k-label">
            Featured Image URL or CID
          </label>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-2">
            Recommended size: 1200x630px (1.91:1 aspect ratio) for optimal display
          </p>
          <input
            type="text"
            value={featuredImage}
            onChange={(e) => setFeaturedImage(e.target.value)}
            placeholder="Enter image URL or CID"
            className="k-input"
            disabled={isSubmitting}
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
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Updating...' : 'Update Article'}
          </button>
        </div>
      </form>

      <KASFeeConfirmation
        isOpen={showFeeConfirmation}
        onClose={() => setShowFeeConfirmation(false)}
        onConfirm={handleConfirm}
        feeInfo={{
          amount: pricing.editFee,
          action: 'update',
          description: `This action will cost ${pricing.editFee} KAS (article update fee)${pricing.tier.hasKREXDiscount ? '. KREX holder discount applied.' : '.'}`,
        }}
        isProcessing={isSubmitting}
      />
    </>
  );
}

