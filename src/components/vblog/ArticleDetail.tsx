'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VBlogArticle } from '@/lib/vblog/types';
import { formatAddress, formatDate, parseMarkdown } from '@/lib/vblog/utils';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useAccount } from 'wagmi';
import { useVBlog } from '@/hooks/useVBlog';
import { Alert } from '@/components/Alert';
import { Avatar } from '@/components/Avatar';

interface ArticleDetailProps {
  article: VBlogArticle;
  onEdit?: (article: VBlogArticle) => void;
}

export function ArticleDetail({ article, onEdit }: ArticleDetailProps) {
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

  // Format author address (last 5 digits)
  const authorDisplay = formatAddress(article.author);
  const authorAddress = article.author.replace(/^(evm:|kaspa:)/, '');
  const authorProfileUrl = `/user/${authorAddress}`;

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
    <article className="max-w-6xl mx-auto">
      {/* Premium Header / Hero Section */}
      <div className="relative mb-16 rounded-[40px] overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-2xl shadow-orange-500/5">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-amber-500/5" />

        <div className="relative flex flex-col lg:flex-row min-h-[400px]">
          {/* Article Info Panel */}
          <div className="flex-1 p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <span className="px-3 py-1 bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-orange-500/20">
                {article.category}
              </span>
              <span className={`px-3 py-1 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg ${article.status === 'published' || article.status === 'on-chain-ready' ? 'bg-emerald-500' :
                  article.status === 'pending' ? 'bg-amber-500' : 'bg-zinc-500'
                }`}>
                {article.status === 'on-chain-ready' ? 'Published' : article.status}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-900 dark:text-zinc-100 mb-8 leading-[1.1] uppercase tracking-tight">
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-8">
              <div className="flex items-center gap-3">
                <Avatar address={authorAddress} size={48} className="ring-2 ring-orange-500/20" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-tighter text-zinc-400">Worded by</span>
                  <Link href={authorProfileUrl} className="text-sm font-bold text-zinc-900 dark:text-zinc-100 hover:text-orange-500 transition-colors">
                    {authorDisplay}
                  </Link>
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-tighter text-zinc-400">Timestamped</span>
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{formatDate(article.publishDate)}</span>
              </div>
            </div>
          </div>

          {/* Hero Image Panel */}
          <div className="w-full lg:w-[40%] relative min-h-[300px] lg:min-h-full bg-zinc-100 dark:bg-zinc-800 border-l border-zinc-100 dark:border-zinc-800">
            {article.featuredImage ? (
              <img
                src={article.featuredImage}
                alt={article.title}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${article.category === 'Development' ? 'from-cyan-500 to-blue-600' :
                  article.category === 'Ecosystem' ? 'from-emerald-500 to-teal-600' :
                    'from-orange-500 to-red-600'
                }`}>
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                <svg className="w-24 h-24 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Global Author Controls */}
        {isAuthor && (
          <div className="absolute top-8 right-8 flex items-center gap-3 z-30">
            <button
              onClick={handleEdit}
              className="p-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md text-zinc-900 dark:text-zinc-100 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:scale-110 transition-all shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-3 bg-red-500 text-white rounded-2xl hover:scale-110 transition-all shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Article Content Panel */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[40px] p-8 sm:p-12 lg:p-20 shadow-2xl shadow-orange-500/5 mb-16">
        <div
          className="prose prose-zinc dark:prose-invert max-w-none 
            prose-headings:text-zinc-900 dark:prose-headings:text-zinc-100 prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight
            prose-p:text-zinc-700 dark:prose-p:text-zinc-300 prose-p:leading-[1.8] prose-p:text-xl
            prose-a:text-orange-500 prose-a:font-bold prose-a:no-underline hover:prose-a:underline
            prose-strong:text-zinc-900 dark:prose-strong:text-zinc-100 prose-strong:font-black
            prose-blockquote:border-l-orange-500 prose-blockquote:bg-orange-500/5 prose-blockquote:rounded-3xl prose-blockquote:px-8 prose-blockquote:py-4 prose-blockquote:font-medium prose-blockquote:italic
            prose-img:rounded-[32px] prose-img:shadow-2xl"
          dangerouslySetInnerHTML={{ __html: parseMarkdown(article.content) }}
        />
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white dark:bg-zinc-900 rounded-[32px] shadow-2xl max-w-sm w-full border border-zinc-200 dark:border-zinc-800 p-8">
            <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 mb-4 uppercase tracking-tight">Confirm Deletion</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-8 font-medium">Are you sure you want to delete this article? This action cannot be revoked from the chain.</p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-2xl font-bold uppercase tracking-widest text-[10px]"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-red-500/20"
              >
                {isDeleting ? 'Deleting...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
