'use client';

import { useState } from 'react';
import { VBlogArticle } from '@/lib/vblog/types';
import { VBlogCard } from '@/components/vblog/VBlogCard';

interface ArticleListProps {
  articles: VBlogArticle[];
  onEdit: (article: VBlogArticle) => void;
  onDelete?: (articleId: string) => void;
}

export function ArticleList({ articles, onEdit, onDelete }: ArticleListProps) {
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
                className="flex-1 k-control-btn justify-center !bg-[#02abb8] !text-white !border-[#02abb8] hover:!bg-[#028a94]"
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
                    className="k-control-btn !border-red-300 !text-red-700 dark:!border-red-800 dark:!text-red-300"
                  >
                    Delete
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
