'use client';

import Link from 'next/link';
import { VBlogArticle } from '@/lib/vblog/types';
import { formatAddress, formatDate, getArticleExcerpt } from '@/lib/vblog/utils';
import { getVBlogArticleSource } from '@/lib/vblog/source';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';
import { KxBadge } from '@/components/ui/KxBadge';
import { KX_LISTING_PLACEHOLDER_GRADIENT } from '@/lib/ui/kxListingPlaceholder';
import { VBlogFeaturedImage } from '@/components/vblog/VBlogFeaturedImage';

interface VBlogCardProps {
  article: VBlogArticle;
}

function statusVariant(article: VBlogArticle): 'emerald' | 'amber' | 'zinc' | 'cyan' {
  if (article.status === 'published' || article.status === 'on-chain-ready' || article.status === 'verified') {
    return 'emerald';
  }
  if (article.status === 'pending' || article.status === 'paying_chunks' || article.status === 'committing') {
    return 'amber';
  }
  return 'zinc';
}

function statusLabel(article: VBlogArticle): string {
  if (article.status === 'on-chain-ready') return 'Published';
  if (article.status === 'verified') return 'Verified';
  return article.status.replace(/_/g, ' ');
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

export function VBlogCard({ article }: VBlogCardProps) {
  const excerpt = getArticleExcerpt(article, 90);
  const authorDisplay = formatAddress(article.author);
  const authorHubUrl = `/u/${encodeURIComponent(article.author)}?tab=my-articles`;
  const source = getVBlogArticleSource(article);
  const isLinked = article.linkedMagazineId && article.linkedIssueNumber;
  const hasImage = Boolean(article.featuredImage?.trim());

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
        <div className="absolute bottom-3 left-3 z-20 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-1.5">
          <KxBadge variant={source === 'kasparex' ? 'cyan' : 'zinc'}>
            {source === 'kasparex' ? 'Kasparex' : 'Community'}
          </KxBadge>
          <KxBadge variant={statusVariant(article)}>{statusLabel(article)}</KxBadge>
          {isLinked ? (
            <KxBadge variant="violet-solid" className="tracking-wider">
              Mag #{article.linkedIssueNumber}
            </KxBadge>
          ) : null}
        </div>
      </KxListingCardMedia>

      <KxListingCardBody comfortable>
        <div className="mb-2 min-w-0">
          <h3 className="truncate text-[17px] font-semibold leading-snug text-zinc-900 dark:text-white">{article.title}</h3>
          <p className="text-xs font-medium text-zinc-500">{article.category}</p>
        </div>

        <p className="mb-4 line-clamp-2 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">{excerpt}</p>

        <div className="flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <p className="text-xs text-zinc-500">
            by{' '}
            <Link
              href={authorHubUrl}
              className="font-semibold text-zinc-700 dark:text-zinc-300 hover:text-[#02abb8] dark:hover:text-[#66dfe8] transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {authorDisplay}
            </Link>
          </p>
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{formatDate(article.publishDate)}</span>
        </div>
      </KxListingCardBody>
    </KxListingCard>
  );
}
