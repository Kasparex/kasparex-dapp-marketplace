'use client';

import { VBlogArticle } from '@/lib/vblog/types';
import { formatAddress, formatDate, getArticleExcerpt } from '@/lib/vblog/utils';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';
import Link from 'next/link';

interface VBlogCardProps {
  article: VBlogArticle;
}

export function VBlogCard({ article }: VBlogCardProps) {
  const excerpt = getArticleExcerpt(article, 90);
  const authorDisplay = formatAddress(article.author);
  const isLinked = article.linkedMagazineId && article.linkedIssueNumber;
  const authorHubUrl = `/u/${encodeURIComponent(article.author)}?tab=content&view=articles`;

  return (
    <KxListingCard href={`/vblog/${article.slug}`} accent="vblog" className="h-full flex flex-col font-sans">
      <KxListingCardMedia className="relative">

          {/* Badges Overlay */}
          <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2">
            <span className="px-2.5 py-1 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md text-zinc-900 dark:text-zinc-100 text-[9px] font-black uppercase tracking-widest rounded-lg shadow-sm">
              {article.category}
            </span>
            {isLinked && (
              <span className="px-2.5 py-1 bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg flex items-center gap-1">
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                {article.linkedIssueNumber}
              </span>
            )}
            {/* Status Badge */}
            <span className={`px-2.5 py-1 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg ${article.status === 'published' || article.status === 'on-chain-ready'
              ? 'bg-emerald-500'
              : article.status === 'pending'
                ? 'bg-amber-500'
                : 'bg-zinc-500'
              }`}>
              {article.status === 'on-chain-ready' ? 'Published' : article.status}
            </span>
          </div>

          {article.featuredImage ? (
            <img
              src={article.featuredImage}
              alt={article.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#02abb8]/15 via-zinc-100 to-zinc-200 dark:from-[#02abb8]/20 dark:via-zinc-900 dark:to-zinc-950 transition-transform duration-700 group-hover:scale-105">
              <div className="text-center px-6">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mb-3">
                  vBlog
                </div>
                <div className="text-lg font-black text-zinc-900 dark:text-zinc-100 leading-tight line-clamp-2">
                  {article.title}
                </div>
              </div>
            </div>
          )}

      </KxListingCardMedia>

      <KxListingCardBody comfortable className="flex flex-col flex-1">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-snug mb-2">
            {article.title}
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6 line-clamp-3 leading-relaxed flex-1">
            {excerpt}
          </p>

          <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-5">
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Author</span>
              <Link
                href={authorHubUrl}
                className="text-sm font-semibold text-zinc-900 dark:text-zinc-200 hover:text-[#02abb8] dark:hover:text-[#66dfe8] transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {authorDisplay}
              </Link>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Published</span>
              <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-200">{formatDate(article.publishDate)}</span>
            </div>
          </div>
      </KxListingCardBody>
    </KxListingCard>
  );
}

