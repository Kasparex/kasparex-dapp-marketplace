'use client';

import { VBlogArticle } from '@/lib/vblog/types';
import { formatAddress, formatDate } from '@/lib/vblog/utils';

interface ArticleDetailProps {
  article: VBlogArticle;
}

export function ArticleDetail({ article }: ArticleDetailProps) {
  const authorDisplay = formatAddress(article.author);

  return (
    <article className="max-w-4xl mx-auto">
      {/* Featured Image */}
      {article.featuredImage && (
        <div className="mb-8 rounded-lg overflow-hidden">
          <img
            src={article.featuredImage}
            alt={article.title}
            className="w-full h-64 object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Article Header */}
      <header className="mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          {article.title}
        </h1>

        {/* Meta Information */}
        <div className="flex flex-wrap items-center gap-4 text-base text-zinc-600 dark:text-zinc-400 mb-6">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="font-medium">Author:</span>
            <span className="font-mono">{authorDisplay}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formatDate(article.publishDate)}</span>
          </div>
          {article.category && (
            <div className="px-3 py-1 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300">
              {article.category}
            </div>
          )}
        </div>

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {article.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-lg"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Status Badge */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-lg border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {article.status === 'on-chain-ready' ? 'On-chain ready' : article.status}
          </div>
        </div>
      </header>

      {/* Article Content */}
      <div className="prose prose-zinc dark:prose-invert max-w-none mb-8">
        <div className="whitespace-pre-wrap text-base text-zinc-900 dark:text-zinc-100 leading-relaxed">
          {article.content}
        </div>
      </div>
    </article>
  );
}

