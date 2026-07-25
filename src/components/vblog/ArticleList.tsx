'use client';

import { useState } from 'react';
import { VBlogArticle } from '@/lib/vblog/types';
import { VBlogCard } from '@/components/vblog/VBlogCard';

interface ArticleListProps {
  articles: VBlogArticle[];
  onEdit: (article: VBlogArticle) => void;
  onDelete?: (articleId: string) => void;
  deleteFeeKas?: number;
}

export function ArticleList({ articles, onEdit, onDelete, deleteFeeKas }: ArticleListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
      {articles.map((article) => (
        <VBlogCard
          key={article.id}
          article={article}
          footer={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onEdit(article)}
                className="flex-1 k-control-btn justify-center !bg-[#e30d1b] !text-white !border-[#e30d1b] hover:!bg-[#c40b17]"
              >
                Edit
              </button>
              {onDelete ? (
                confirmDeleteId === article.id ? (
                  <>
                    <button
                      type="button"
                      onClick={handleConfirmDelete}
                      disabled={deletingId === article.id}
                      className="flex-1 k-control-btn justify-center !bg-red-600 !text-white !border-red-600 hover:!bg-red-700 disabled:opacity-50"
                    >
                      {deletingId === article.id ? 'Deleting...' : 'Confirm'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      disabled={deletingId === article.id}
                      className="k-control-btn"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(article.id)}
                    disabled={deletingId === article.id}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/40"
                  >
                    Delete{typeof deleteFeeKas === 'number' ? ` (${deleteFeeKas} KAS)` : ''}
                  </button>
                )
              ) : null}
            </div>
          }
        />
      ))}
    </div>
  );
}
