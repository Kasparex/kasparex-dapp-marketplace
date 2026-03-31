'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VBlogArticle } from '@/lib/vblog/types';
import { formatAddress, formatDate, parseMarkdown } from '@/lib/vblog/utils';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useAccount } from 'wagmi';
import { useVBlog } from '@/hooks/useVBlog';
import { Avatar } from '@/components/Avatar';
import { ArticleSidebar } from './ArticleSidebar';

interface ArticleDetailProps {
  article: VBlogArticle;
  onEdit?: (article: VBlogArticle) => void;
}

export function ArticleDetail({ article, onEdit }: ArticleDetailProps) {
  const { state: kaspaState } = useKaspaWallet();
  const { address: evmAddress } = useAccount();
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
      <div className="relative mb-10 rounded-2xl overflow-hidden bg-zinc-50/80 dark:bg-zinc-900/45 border border-zinc-200 dark:border-zinc-800 select-text">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent" />

        <div className="relative flex flex-col lg:flex-row min-h-[360px]">
          <div className="flex-1 p-8 sm:p-10 lg:p-12 flex flex-col justify-center">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#02abb8] mb-4">
              {article.category}
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-900 dark:text-zinc-100 mb-6 leading-tight tracking-tight">
              {article.title}
            </h1>
            <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl mb-8 select-text">
              {article.description}
            </p>

            <div className="flex flex-wrap items-center gap-8">
              <div className="flex items-center gap-3">
                <Avatar address={authorAddress} size={44} className="ring-2 ring-cyan-500/20" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-tighter text-zinc-400">By</span>
                  <Link href={authorProfileUrl} className="text-sm font-bold text-zinc-900 dark:text-zinc-100 hover:text-[#02abb8] transition-colors">
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

          <div className="w-full lg:w-[40%] relative min-h-[260px] lg:min-h-full bg-zinc-100 dark:bg-zinc-800 border-l border-zinc-200 dark:border-zinc-800">
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
                  'from-[#02abb8] to-cyan-700'
                }`}>
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                <svg className="w-24 h-24 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {isAuthor && (
          <div className="absolute top-6 right-6 flex items-center gap-3 z-30">
            <button
              onClick={handleEdit}
              className="p-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:scale-105 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-3 bg-red-500 text-white rounded-xl hover:scale-105 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-10 xl:gap-12">
        <div className="flex-1 min-w-0">
          <div
            className="prose prose-zinc dark:prose-invert max-w-none 
              prose-headings:text-zinc-900 dark:prose-headings:text-zinc-100 prose-headings:font-black prose-headings:tracking-tight
              prose-p:text-zinc-700 dark:prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:text-xl sm:prose-p:text-2xl prose-p:mb-5
              prose-a:text-[#02abb8] prose-a:font-bold prose-a:no-underline hover:prose-a:underline
              prose-strong:text-zinc-900 dark:prose-strong:text-zinc-100 prose-strong:font-black
              prose-blockquote:border-l-[#02abb8] prose-blockquote:bg-[#02abb8]/5 prose-blockquote:rounded-2xl prose-blockquote:px-6 prose-blockquote:py-4 prose-blockquote:font-medium prose-blockquote:italic
              prose-img:rounded-2xl select-text cursor-text"
            onClick={(e) => {
              const selection = window.getSelection()?.toString().trim();
              if (!selection) return;
              void navigator.clipboard.writeText(selection).catch(() => undefined);
            }}
            dangerouslySetInnerHTML={{ __html: parseMarkdown(article.content) }}
          />
        </div>

        <div className="w-full lg:w-[320px] xl:w-[340px] shrink-0">
          <ArticleSidebar article={article} />
        </div>
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
