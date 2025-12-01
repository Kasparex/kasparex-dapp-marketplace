'use client';

import Link from 'next/link';
import { VBlogArticle } from '@/lib/vblog/types';
import { formatAddress, formatDate, getArticleExcerpt } from '@/lib/vblog/utils';

interface VBlogCardProps {
  article: VBlogArticle;
}

export function VBlogCard({ article }: VBlogCardProps) {
  const excerpt = getArticleExcerpt(article, 120);
  const authorDisplay = formatAddress(article.author);

  return (
    <Link
      href={`/vblog/${article.slug}`}
      className="block w-full text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-all relative flex flex-col min-h-[280px]"
    >
      {/* Featured Image Placeholder */}
      <div className="relative w-full h-32 bg-zinc-100/80 dark:bg-zinc-900/95 flex items-center justify-center border-b border-zinc-200/50 dark:border-zinc-800/50">
        {article.featuredImage ? (
          <img
            src={article.featuredImage}
            alt={article.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <svg className="w-12 h-12 text-zinc-400 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
        {/* Status Badge - Top Right Corner of Image */}
        <div className="absolute top-2 right-2 z-10">
          <div className="px-2 py-1 text-xs font-medium rounded-lg border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300">
            {article.status === 'on-chain-ready' ? 'On-chain ready' : article.status}
          </div>
        </div>
      </div>

      <div className="p-4 relative z-10 flex flex-col flex-1 min-h-0">

        {/* Title */}
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2 line-clamp-2">
          {article.title}
        </h3>

        {/* Description */}
        <p className="text-base text-zinc-600 dark:text-zinc-400 mb-3 line-clamp-3 flex-grow">
          {excerpt}
        </p>

        {/* Meta Information */}
        <div className="mt-auto space-y-2">
          {/* Author and Date */}
          <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{authorDisplay}</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatDate(article.publishDate)}</span>
            </div>
          </div>

          {/* Category and Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            {article.category && (
              <div className="px-3 py-1 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300">
                {article.category}
              </div>
            )}
            {article.tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded"
              >
                #{tag}
              </span>
            ))}
            {article.tags.length > 2 && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                +{article.tags.length - 2} more
              </span>
            )}
          </div>

          {/* Read Article Button */}
          <div className="pt-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg text-sm font-medium transition-colors">
              <span>Read article</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

