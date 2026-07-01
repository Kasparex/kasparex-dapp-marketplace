'use client';

import { KxBadge } from '@/components/ui/KxBadge';
import { KxListingCategoryChip } from '@/components/ui/KxListingCategoryChip';
import type { VBlogArticle } from '@/lib/vblog/types';
import { getVBlogArticleSource } from '@/lib/vblog/source';
import {
  vblogSourceBadgeVariant,
  vblogStatusBadgeVariant,
  vblogStatusLabel,
} from '@/lib/vblog/badges';

function CategoryIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}

export function VBlogArticleMetaBadges({
  article,
  className = '',
}: {
  article: VBlogArticle;
  className?: string;
}) {
  const source = getVBlogArticleSource(article);
  const isLinked = article.linkedMagazineId && article.linkedIssueNumber;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`.trim()}>
      <KxBadge variant={vblogSourceBadgeVariant(source)}>
        {source === 'kasparex' ? 'Kasparex' : 'Community'}
      </KxBadge>
      <KxBadge variant={vblogStatusBadgeVariant(article)}>{vblogStatusLabel(article)}</KxBadge>
      {isLinked ? (
        <KxBadge variant="violet" className="tracking-wider">
          Mag #{article.linkedIssueNumber}
        </KxBadge>
      ) : null}
    </div>
  );
}

export function VBlogArticleBadges({
  article,
  includeCategory = false,
  className = '',
}: {
  article: VBlogArticle;
  includeCategory?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`.trim()}>
      <VBlogArticleMetaBadges article={article} />
      {includeCategory ? (
        <KxListingCategoryChip icon={<CategoryIcon />}>{article.category}</KxListingCategoryChip>
      ) : null}
    </div>
  );
}
