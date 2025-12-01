'use client';

import Link from 'next/link';
import { VBlogArticle } from '@/lib/vblog/types';
import { formatDate, getArticleExcerpt } from '@/lib/vblog/utils';

interface ArticleListProps {
  articles: VBlogArticle[];
  onEdit: (article: VBlogArticle) => void;
}

export function ArticleList({ articles, onEdit }: ArticleListProps) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
          You haven't created any articles yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article) => {
        const excerpt = getArticleExcerpt(article, 100);
        return (
          <div
            key={article.id}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col"
          >
            {/* Featured Image */}
            <div className="relative w-full h-32 bg-zinc-100/80 dark:bg-zinc-900/95 flex items-center justify-center border-b border-zinc-200/50 dark:border-zinc-800/50">
              {article.featuredImage ? (
                <img
                  src={article.featuredImage}
                  alt={article.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <svg className="w-12 h-12 text-zinc-400 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </div>

            <div className="p-4 flex flex-col flex-1">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2 line-clamp-2">
                {article.title}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3 line-clamp-2 flex-grow">
                {excerpt}
              </p>

              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{formatDate(article.publishDate)}</span>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <Link
                  href={`/vblog/${article.slug}`}
                  className="flex-1 px-3 py-2 text-center text-sm font-medium border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                >
                  View
                </Link>
                <button
                  onClick={() => onEdit(article)}
                  className="flex-1 px-3 py-2 text-sm font-medium bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

