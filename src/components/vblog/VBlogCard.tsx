'use client';

import { useRouter } from 'next/navigation';
import { useState, type MouseEvent, type ReactNode } from 'react';
import { useAccount } from 'wagmi';
import { VBlogArticle } from '@/lib/vblog/types';
import { formatAddress, formatDate, getArticleExcerpt } from '@/lib/vblog/utils';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';
import { KxListingCategoryChip } from '@/components/ui/KxListingCategoryChip';
import { KX_LISTING_PLACEHOLDER_GRADIENT } from '@/lib/ui/kxListingPlaceholder';
import { VBlogFeaturedImage } from '@/components/vblog/VBlogFeaturedImage';
import { VBlogArticleMetaBadges } from '@/components/vblog/VBlogArticleBadges';
import { VBlogPremiumBadge } from '@/components/vblog/VBlogPremiumBadge';
import { AuthorInline } from '@/components/ui/AuthorInline';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useVBlog } from '@/hooks/useVBlog';
import { articleHasPremiumContent } from '@/lib/vblog/listing';

interface VBlogCardProps {
  article: VBlogArticle;
  /** Optional action row rendered inside the card body (e.g. archive Edit / Delete). */
  footer?: ReactNode;
}

function CategoryIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}

function ArticleIcon() {
  return (
    <svg
      className="h-8 w-8 text-cyan-600 dark:text-cyan-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
      />
    </svg>
  );
}

function stopCardNavigation(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
}

export function VBlogCard({ article, footer }: VBlogCardProps) {
  const router = useRouter();
  const { state: kaspaState } = useKaspaWallet();
  const { address: evmAddress } = useAccount();
  const { deleteExistingArticle } = useVBlog();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const excerpt = getArticleExcerpt(article, 90);
  const authorDisplay = formatAddress(article.author);
  const authorHubUrl = `/u/${encodeURIComponent(article.author)}?tab=my-articles`;
  const hasImage = Boolean(article.featuredImage?.trim());
  const hasPremium = articleHasPremiumContent(article);

  const walletAddress = kaspaState.address || (evmAddress ? `evm:${evmAddress}` : null);
  const isAuthor = Boolean(
    walletAddress &&
      (article.author.toLowerCase() === walletAddress.toLowerCase() ||
        article.author.toLowerCase() === `evm:${evmAddress?.toLowerCase()}` ||
        (kaspaState.address && article.author.toLowerCase() === kaspaState.address.toLowerCase())),
  );

  const handleEdit = () => {
    router.push(`/vblog/dashboard?edit=${article.id}`);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteExistingArticle(article.id);
      setConfirmDelete(false);
    } catch (error) {
      console.error('Error deleting article:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <KxListingCard href={`/vblog/${article.slug}`} accent="vblog" className="h-full flex flex-col font-sans">
      <KxListingCardMedia aspectClass="aspect-[16/10]">
        {hasImage ? (
          <VBlogFeaturedImage
            src={article.featuredImage}
            title={article.title}
            variant="card"
            className="h-full w-full"
            imgClassName="h-full w-full object-cover"
          />
        ) : (
          <div className={`flex h-full w-full items-center justify-center ${KX_LISTING_PLACEHOLDER_GRADIENT}`}>
            <ArticleIcon />
          </div>
        )}

        <div
          className="absolute bottom-2 left-2 z-10 max-w-[calc(100%-1rem)]"
          onClick={stopCardNavigation}
          onMouseDown={stopCardNavigation}
        >
          <VBlogArticleMetaBadges article={article} />
        </div>

        {isAuthor ? (
          <div
            className="absolute top-2 right-2 z-20 flex items-center gap-1.5"
            onClick={stopCardNavigation}
            onMouseDown={stopCardNavigation}
          >
            {
              confirmDelete ? (
              <>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="rounded-lg bg-red-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white hover:bg-red-600 disabled:opacity-50"
                >
                  {isDeleting ? '...' : 'Delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={isDeleting}
                  className="rounded-lg border border-zinc-200 bg-white/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-700 backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-200"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleEdit}
                  aria-label="Edit article"
                  className="rounded-lg border border-zinc-200 bg-white/90 p-1.5 text-zinc-900 backdrop-blur-md transition-all hover:scale-105 dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-100"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  aria-label="Delete article"
                  className="rounded-lg bg-red-500 p-1.5 text-white transition-all hover:scale-105"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </>
              )
            }
          </div>
        ) : null}
      </KxListingCardMedia>

      <KxListingCardBody comfortable className="flex-1">
        <div className="mb-3.5 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-[17px] font-semibold leading-snug text-zinc-900 dark:text-white">
              {article.title}
            </h3>
            {hasPremium ? <VBlogPremiumBadge size="sm" className="mt-0.5 shrink-0" /> : null}
          </div>
          <AuthorInline
            address={article.author}
            displayName={authorDisplay}
            href={authorHubUrl}
            className="mt-3.5"
          />
        </div>

        <p className="mb-4 line-clamp-2 text-base leading-7 text-zinc-600 dark:text-zinc-400">{excerpt}</p>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <KxListingCategoryChip
            icon={<CategoryIcon />}
            className="shrink-0"
            title={`Filter by ${article.category}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              router.push(`/vblog?category=${encodeURIComponent(article.category)}`);
            }}
          >
            {article.category}
          </KxListingCategoryChip>
          <span className="shrink-0 text-xs font-semibold text-zinc-700 dark:text-zinc-300">{formatDate(article.publishDate)}</span>
        </div>

        {footer ? (
          <div
            className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800"
            onClick={stopCardNavigation}
            onMouseDown={stopCardNavigation}
          >
            {footer}
          </div>
        ) : null}
      </KxListingCardBody>
    </KxListingCard>
  );
}
