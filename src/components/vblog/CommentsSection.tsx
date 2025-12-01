'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { VBlogComment } from '@/lib/vblog/types';
import { useVBlog } from '@/hooks/useVBlog';
import { useCommentCredits } from '@/hooks/useCommentCredits';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useAccount } from 'wagmi';
import { formatAddress, formatDateTime } from '@/lib/vblog/utils';
import { CommentCreditInfo } from './CommentCreditInfo';
import { Alert } from '@/components/Alert';

interface CommentsSectionProps {
  articleId: string;
}

export function CommentsSection({ articleId }: CommentsSectionProps) {
  const { state: kaspaState } = useKaspaWallet();
  const { address: evmAddress, isConnected: isEVMConnected } = useAccount();
  const { getArticleComments, addArticleComment } = useVBlog();
  
  // Support both Kaspa and EVM wallets
  const walletAddress = kaspaState.address || (evmAddress ? `evm:${evmAddress}` : null);
  const isWalletConnected = kaspaState.isConnected || isEVMConnected;
  
  const { credits, useCredit: deductCredit, hasCredits, isLoading: creditsLoading } = useCommentCredits(walletAddress);
  const [comments, setComments] = useState<VBlogComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load comments
  useEffect(() => {
    const articleComments = getArticleComments(articleId);
    setComments(articleComments);
  }, [articleId, getArticleComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isWalletConnected || !walletAddress) {
      setError('Please connect your wallet (Kaspa or EVM) to comment');
      return;
    }

    if (!newComment.trim()) {
      setError('Please enter a comment');
      return;
    }

    if (!hasCredits()) {
      setError('You have no comment credits remaining. Please purchase more credits.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      // Check and use credit
      // TODO: Replace with actual smart contract call for credit checking
      const creditUsed = deductCredit();
      if (!creditUsed) {
        setError('Failed to use credit. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Add comment
      // TODO: Replace with actual smart contract call
      const comment = await addArticleComment({
        articleId,
        author: walletAddress,
        content: newComment.trim(),
      });

      // Add to local state
      setComments([comment, ...comments]);
      setNewComment('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error adding comment:', err);
      setError(err instanceof Error ? err.message : 'Failed to add comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
        Comments ({comments.length})
      </h2>

      <CommentCreditInfo />

      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="space-y-4 mb-8">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#02abb8]/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#02abb8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <Link
                      href={comment.author.startsWith('evm:') 
                        ? `/user/${comment.author.replace('evm:', '')}`
                        : `/user/${comment.author.replace('kaspa:', '')}`}
                      className="text-base font-medium text-[#02abb8] hover:text-[#028a94] hover:underline font-mono transition-colors"
                    >
                      {formatAddress(comment.author)}
                    </Link>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {formatDateTime(comment.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-base text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 mb-8">
          <p className="text-base text-zinc-600 dark:text-zinc-400">
            No comments yet. Be the first to comment!
          </p>
        </div>
      )}

      {/* Comment Form */}
      {isWalletConnected ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="comment" className="block text-base font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Add a Comment
            </label>
            <textarea
              id="comment"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write your comment here..."
              rows={4}
              className="w-full px-3 py-2 text-base border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8] resize-none"
              disabled={isSubmitting || !hasCredits()}
            />
            {error && (
              <div className="mt-2">
                <Alert type="error" compact onDismiss={() => setError(null)}>
                  {error}
                </Alert>
              </div>
            )}
            {success && (
              <div className="mt-2">
                <Alert type="success" compact>
                  Comment added successfully!
                </Alert>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {hasCredits() ? (
                <>You have {credits?.creditsRemaining || 0} comment credit{credits?.creditsRemaining !== 1 ? 's' : ''} remaining</>
              ) : (
                <>No credits remaining. Purchase more to continue commenting.</>
              )}
            </p>
            <button
              type="submit"
              disabled={isSubmitting || !hasCredits() || !newComment.trim()}
              className="px-4 py-2 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Comment'}
            </button>
          </div>
        </form>
      ) : (
        <Alert type="info" title="Wallet Required">
          Connect your wallet (Kaspa or EVM) to add a comment
        </Alert>
      )}
    </div>
  );
}

