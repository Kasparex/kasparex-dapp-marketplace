'use client';

import type { ReactNode } from 'react';
import { KxBadge } from '@/components/ui/KxBadge';
import { KxListingCategoryChip } from '@/components/ui/KxListingCategoryChip';
import { Tooltip, TooltipProvider } from '@/components/ui/Tooltip';
import type { VBlogArticle } from '@/lib/vblog/types';
import { getVBlogArticleSource } from '@/lib/vblog/source';
import {
  vblogMagazineBadgeTooltip,
  vblogSourceBadgeTooltip,
  vblogSourceBadgeVariant,
  vblogStatusBadgeTooltip,
  vblogStatusBadgeVariant,
  vblogStatusLabel,
} from '@/lib/vblog/badges';

/** Stronger fill so listing badges read clearly on card imagery. */
const VBLOG_BADGE_FILL = {
  cyan: '!bg-cyan-500/35 dark:!bg-cyan-500/30',
  emerald: '!bg-emerald-500/35 dark:!bg-emerald-500/30',
  amber: '!bg-amber-500/35 dark:!bg-amber-500/30',
  violet: '!bg-violet-500/35 dark:!bg-violet-500/30',
  zinc: '!bg-zinc-300/90 dark:!bg-zinc-600/80',
} as const;

function CategoryIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}

function BadgeWithTooltip({
  tooltip,
  children,
}: {
  tooltip: string;
  children: ReactNode;
}) {
  return (
    <Tooltip content={tooltip}>
      <span className="inline-flex cursor-help">{children}</span>
    </Tooltip>
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
  const sourceVariant = vblogSourceBadgeVariant(source);
  const statusVariant = vblogStatusBadgeVariant(article);

  return (
    <TooltipProvider>
      <div className={`flex flex-wrap items-center gap-1.5 ${className}`.trim()}>
        <BadgeWithTooltip tooltip={vblogSourceBadgeTooltip(source)}>
          <KxBadge variant={sourceVariant} className={VBLOG_BADGE_FILL[sourceVariant]}>
            {source === 'kasparex' ? 'Kasparex' : 'Community'}
          </KxBadge>
        </BadgeWithTooltip>
        <BadgeWithTooltip tooltip={vblogStatusBadgeTooltip(article)}>
          <KxBadge variant={statusVariant} className={VBLOG_BADGE_FILL[statusVariant]}>
            {vblogStatusLabel(article)}
          </KxBadge>
        </BadgeWithTooltip>
        {isLinked ? (
          <BadgeWithTooltip tooltip={vblogMagazineBadgeTooltip(article.linkedIssueNumber!)}>
            <KxBadge variant="violet" className={`tracking-wider ${VBLOG_BADGE_FILL.violet}`}>
              Mag #{article.linkedIssueNumber}
            </KxBadge>
          </BadgeWithTooltip>
        ) : null}
      </div>
    </TooltipProvider>
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
