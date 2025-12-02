'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { VBlogComment } from '@/lib/vblog/types';
import { useVBlog } from '@/hooks/useVBlog';
import { useCommentCredits } from '@/hooks/useCommentCredits';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useAccount } from 'wagmi';
import { formatAddress, formatDateTime } from '@/lib/vblog/utils';
import { CommentCreditInfo } from './CommentCreditInfo';
import { CommentCreditsModal } from './CommentCreditsModal';
import { Alert } from '@/components/Alert';
import { Avatar } from '@/components/Avatar';

interface CommentsSectionProps {
  articleId: string;
}

const COMMENTS_PER_PAGE = 5;
const COMMENTS_LOAD_MORE = 10;

export function CommentsSection({ articleId }: CommentsSectionProps) {
  const { state: kaspaState } = useKaspaWallet();
  const { address: evmAddress, isConnected: isEVMConnected } = useAccount();
  const { getArticleComments, addArticleComment } = useVBlog();
  
  // Support both Kaspa and EVM wallets
  const walletAddress = kaspaState.address || (evmAddress ? `evm:${evmAddress}` : null);
  const isWalletConnected = kaspaState.isConnected || isEVMConnected;
  
  const { credits, useCredit: deductCredit, hasCredits, isLoading: creditsLoading, refreshCredits } = useCommentCredits(walletAddress);
  const [allComments, setAllComments] = useState<VBlogComment[]>([]);
  const [displayedComments, setDisplayedComments] = useState<VBlogComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load all comments
  useEffect(() => {
    const articleComments = getArticleComments(articleId);
    setAllComments(articleComments);
    // Load initial batch
    setDisplayedComments(articleComments.slice(0, COMMENTS_PER_PAGE));
  }, [articleId, getArticleComments]);

  // Format address to show last 5 digits
  const formatAuthorAddress = useCallback((address: string): string => {
    if (!address) return '';
    // Remove prefixes if present
    const cleanAddress = address.replace(/^(evm:|kaspa:)/, '');
    if (cleanAddress.length <= 5) return cleanAddress;
    return cleanAddress.slice(-5);
  }, []);

  // Get profile URL for author
  const getAuthorProfileUrl = useCallback((authorAddress: string): string => {
    const cleanAddress = authorAddress.replace(/^(evm:|kaspa:)/, '');
    return `/user/${cleanAddress}`;
  }, []);

  // Check if current user is comment author
  const isCommentAuthor = useCallback((commentAuthor: string): boolean => {
    if (!walletAddress) return false;
    return commentAuthor.toLowerCase() === walletAddress.toLowerCase() ||
           commentAuthor.toLowerCase() === `evm:${evmAddress?.toLowerCase()}` ||
           (kaspaState.address && commentAuthor.toLowerCase() === kaspaState.address.toLowerCase());
  }, [walletAddress, evmAddress, kaspaState.address]);

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
      setShowModal(true);
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
      const updatedComments = [comment, ...allComments];
      setAllComments(updatedComments);
      setDisplayedComments(updatedComments.slice(0, displayedComments.length + 1));
      setNewComment('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      // Refresh credits display
      refreshCredits();
    } catch (err) {
      console.error('Error adding comment:', err);
      setError(err instanceof Error ? err.message : 'Failed to add comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadMore = () => {
    const currentCount = displayedComments.length;
    const nextBatch = allComments.slice(currentCount, currentCount + COMMENTS_LOAD_MORE);
    setDisplayedComments([...displayedComments, ...nextBatch]);
  };

  const handleDelete = async (commentId: string) => {
    setIsDeleting(true);
    try {
      // TODO: Replace with actual smart contract call
      // For now, just remove from local state
      const updatedComments = allComments.filter(c => c.id !== commentId);
      setAllComments(updatedComments);
      setDisplayedComments(updatedComments.slice(0, displayedComments.length));
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete comment');
    } finally {
      setIsDeleting(false);
    }
  };

  const hasMoreComments = displayedComments.length < allComments.length;
  const commentsCount = allComments.length;

  return (
    <>
      <CommentCreditsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />

      <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800 max-w-4xl mx-auto">
        {/* Header with Collapse */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Comments ({commentsCount})
          </h2>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label={isCollapsed ? 'Expand comments' : 'Collapse comments'}
          >
            <svg
              className={`w-5 h-5 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>

        {isCollapsed ? (
          <div className="text-center py-4 text-zinc-600 dark:text-zinc-400">
            {commentsCount} comment{commentsCount !== 1 ? 's' : ''}
          </div>
        ) : (
          <>
            <CommentCreditInfo onPurchaseClick={() => setShowModal(true)} />

            {/* Comments List */}
            {displayedComments.length > 0 ? (
              <div className="space-y-4 mb-8">
                {displayedComments.map((comment) => {
                  const isAuthor = isCommentAuthor(comment.author);
                  const authorDisplay = formatAuthorAddress(comment.author);
                  const profileUrl = getAuthorProfileUrl(comment.author);

                  return (
                    <div
                      key={comment.id}
                      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-3">
                          <Avatar address={comment.author.replace(/^(evm:|kaspa:)/, '')} size={32} />
                          <div>
                            <Link
                              href={profileUrl}
                              className="text-base font-medium text-[#02abb8] hover:text-[#028a94] hover:underline transition-colors"
                            >
                              {authorDisplay}
                            </Link>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                              {formatDateTime(comment.timestamp)}
                            </p>
                          </div>
                        </div>
                        {isAuthor && (
                          <button
                            onClick={() => setShowDeleteConfirm(comment.id)}
                            className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                            aria-label="Delete comment"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                      <p className="text-base text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 mb-8">
                <p className="text-base text-zinc-600 dark:text-zinc-400">
                  No comments yet. Be the first to comment!
                </p>
              </div>
            )}

            {/* Load More Button */}
            {hasMoreComments && (
              <div className="text-center mb-8">
                <button
                  onClick={handleLoadMore}
                  className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  Load More ({allComments.length - displayedComments.length} remaining)
                </button>
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
                    disabled={isSubmitting}
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
                    type={hasCredits() ? 'submit' : 'button'}
                    onClick={hasCredits() ? undefined : () => setShowModal(true)}
                    disabled={isSubmitting || (hasCredits() && !newComment.trim())}
                    className="px-4 py-2 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Submitting...' : hasCredits() ? 'Submit Comment' : 'Purchase Credits'}
                  </button>
                </div>
              </form>
            ) : (
              <Alert type="info" title="Wallet Required">
                Connect your wallet (Kaspa or EVM) to add a comment
              </Alert>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-md w-full border border-zinc-200 dark:border-zinc-800 p-6">
            <Alert
              type="warning"
              title="Delete Comment"
              onDismiss={() => setShowDeleteConfirm(null)}
              action={{
                label: isDeleting ? 'Deleting...' : 'Delete',
                onClick: () => handleDelete(showDeleteConfirm),
              }}
            >
              <div className="space-y-3">
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  Are you sure you want to delete this comment?
                </p>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-xs text-yellow-800 dark:text-yellow-300 font-medium mb-1">
                    Important:
                  </p>
                  <ul className="text-xs text-yellow-700 dark:text-yellow-400 space-y-1 list-disc list-inside">
                    <li>Deleting a comment does not remove it from the blockchain</li>
                    <li>Deleted comments cannot be refunded</li>
                  </ul>
                </div>
              </div>
            </Alert>
          </div>
        </div>
      )}
    </>
  );
}
