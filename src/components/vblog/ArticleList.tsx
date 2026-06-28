'use client';

import { useState } from 'react';
import Link from 'next/link';
import { VBlogArticle } from '@/lib/vblog/types';
import { formatDate, getArticleExcerpt } from '@/lib/vblog/utils';
import { VBlogFeaturedImage } from '@/components/vblog/VBlogFeaturedImage';

interface ArticleListProps {
  articles: VBlogArticle[];
  onEdit: (article: VBlogArticle) => void;
  onDelete?: (articleId: string) => void;
}

export function ArticleList({ articles, onEdit, onDelete }: ArticleListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDeleteClick = (articleId: string) => {
    setConfirmDeleteId(articleId);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId || !onDelete) return;

    setDeletingId(confirmDeleteId);
    try {
      await onDelete(confirmDeleteId);
      setConfirmDeleteId(null);
    } catch (error) {
      console.error('Error deleting article:', error);
    } finally {
      setDeletingId(null);
    }
  };
  if (articles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
          You haven&apos;t created any articles yet.
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
            <div className="relative w-full h-32 overflow-hidden flex items-center justify-center border-b border-zinc-200/50 dark:border-zinc-800/50">
              {/* Status Badge Overlay */}
              <div className="absolute top-2 left-2 z-10">
                <span className={`px-2 py-0.5 text-white text-[8px] font-black uppercase tracking-widest rounded-md shadow-lg ${article.status === 'published' || article.status === 'on-chain-ready'
                    ? 'bg-emerald-500'
                    : article.status === 'pending'
                      ? 'bg-amber-500'
                      : 'bg-zinc-500'
                  }`}>
                  {article.status === 'on-chain-ready' ? 'Published' : article.status}
                </span>
              </div>

              <VBlogFeaturedImage
                src={article.featuredImage}
                title={article.title}
                variant="list"
                className="h-full w-full"
                imgClassName="h-full w-full object-cover"
              />
            </div>

            <div className="p-4 flex flex-col flex-1">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2 line-clamp-2">
                {article.title}
              </h3>
              <p className="kx-body mb-3 line-clamp-2 flex-grow">
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
                  className="px-3 py-2 text-sm font-medium bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg transition-colors"
                >
                  Edit
                </button>
                {onDelete && (
                  <>
                    {confirmDeleteId === article.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleConfirmDelete}
                          disabled={deletingId === article.id}
                          className="px-3 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                          {deletingId === article.id ? 'Deleting...' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={deletingId === article.id}
                          className="px-3 py-2 text-sm font-medium border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDeleteClick(article.id)}
                        disabled={deletingId === article.id}
                        className="px-3 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        Delete
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

