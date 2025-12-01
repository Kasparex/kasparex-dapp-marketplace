'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VBlogArticle } from '@/lib/vblog/types';
import { formatAddress, formatDate } from '@/lib/vblog/utils';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useAccount } from 'wagmi';
import { useVBlog } from '@/hooks/useVBlog';
import { Alert } from '@/components/Alert';

interface ArticleDetailProps {
  article: VBlogArticle;
  onEdit?: (article: VBlogArticle) => void;
}

export function ArticleDetail({ article, onEdit }: ArticleDetailProps) {
  const authorDisplay = formatAddress(article.author);
  const { state: kaspaState } = useKaspaWallet();
  const { address: evmAddress, isConnected: isEVMConnected } = useAccount();
  const { deleteExistingArticle } = useVBlog();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Check if current user is the author
  const walletAddress = kaspaState.address || (evmAddress ? `evm:${evmAddress}` : null);
  const isAuthor = walletAddress && (
    article.author.toLowerCase() === walletAddress.toLowerCase() ||
    article.author.toLowerCase() === `evm:${evmAddress?.toLowerCase()}` ||
    (kaspaState.address && article.author.toLowerCase() === kaspaState.address.toLowerCase())
  );

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteExistingArticle(article.id);
      router.push('/vblog');
    } catch (error) {
      console.error('Error deleting article:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(article);
    } else {
      router.push(`/vblog/dashboard?edit=${article.id}`);
    }
  };

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
            <Link
              href={article.author.startsWith('evm:') 
                ? `/user/${article.author.replace('evm:', '')}`
                : `/user/${article.author.replace('kaspa:', '')}`}
              className="font-mono text-[#02abb8] hover:text-[#028a94] hover:underline transition-colors"
            >
              {authorDisplay}
            </Link>
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
        <div className="mb-6 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-lg border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {article.status === 'on-chain-ready' ? 'On-chain ready' : article.status}
          </div>
          
          {/* Edit/Delete Buttons (Author Only) */}
          {isAuthor && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleEdit}
                className="px-4 py-2 text-sm font-medium bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-sm w-full border border-zinc-200 dark:border-zinc-800 p-6">
            <Alert
              type="warning"
              title="Confirm Deletion"
              onDismiss={() => setShowDeleteConfirm(false)}
              actionButton={{
                label: isDeleting ? 'Deleting...' : 'Delete',
                onClick: handleDelete,
              }}
            >
              Are you sure you want to delete &quot;{article.title}&quot;? This action cannot be undone.
            </Alert>
          </div>
        </div>
      )}

      {/* Article Content */}
      <div className="prose prose-zinc dark:prose-invert max-w-none mb-8">
        <div 
          className="text-base text-zinc-900 dark:text-zinc-100 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </div>
    </article>
  );
}

