'use client';

import { useEffect, useState } from 'react';
import { VBlogArticle } from '@/lib/vblog/types';
import { useVBlog } from '@/hooks/useVBlog';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useAccount } from 'wagmi';
import { CreateArticleForm } from './CreateArticleForm';
import { EditArticleForm } from './EditArticleForm';
import { ArticleList } from './ArticleList';
import { AuthorPricing } from './AuthorPricing';
import { Alert } from '@/components/Alert';
import { useVBlogPricing } from '@/hooks/useVBlogPricing';

interface AuthorDashboardProps {
  createIntentKey?: number;
}

export function AuthorDashboard({ createIntentKey = 0 }: AuthorDashboardProps) {
  const { state: kaspaState } = useKaspaWallet();
  const { address: evmAddress, isConnected: isEVMConnected } = useAccount();

  // Support both Kaspa and EVM wallets
  const walletAddress = kaspaState.address || (evmAddress ? `evm:${evmAddress}` : null);
  const isWalletConnected = kaspaState.isConnected || isEVMConnected;

  const { createNewArticle, updateExistingArticle, deleteExistingArticle, getAuthorArticles, loadArticles } = useVBlog();
  const pricing = useVBlogPricing();
  const [activeTab, setActiveTab] = useState<'create' | 'my-articles'>('create');
  const [editingArticle, setEditingArticle] = useState<VBlogArticle | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab('create');
    setEditingArticle(null);
  }, [createIntentKey]);

  const authorArticles = walletAddress ? getAuthorArticles(walletAddress) : [];

  const handleCreateArticle = async (articleData: Omit<VBlogArticle, 'id' | 'slug' | 'publishDate' | 'cid' | 'articleId' | 'txHash' | 'status'>) => {
    // TODO: Get author from wallet connection
    // For now, use the connected address
    if (!walletAddress) {
      throw new Error('Wallet not connected');
    }

    const articleWithAuthor = {
      ...articleData,
      author: walletAddress,
    };

    await createNewArticle(articleWithAuthor);
    loadArticles();
    setSuccessMessage('Article created successfully!');
    setTimeout(() => {
      setSuccessMessage(null);
      setActiveTab('my-articles');
    }, 2000);
  };

  const handleUpdateArticle = async (articleId: string, updates: Partial<Omit<VBlogArticle, 'id' | 'author' | 'publishDate'>>) => {
    await updateExistingArticle(articleId, updates);
    loadArticles();
    setSuccessMessage('Article updated successfully!');
    setEditingArticle(null);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 2000);
  };

  const handleEdit = (article: VBlogArticle) => {
    setEditingArticle(article);
    setActiveTab('create');
  };

  const handleCancelEdit = () => {
    setEditingArticle(null);
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm(`Deleting an article costs ${pricing.deleteFee} KAS and cannot be undone. Continue?`)) {
      return;
    }

    try {
      await deleteExistingArticle(articleId);
      loadArticles();
      setSuccessMessage('Article deleted successfully!');
      setTimeout(() => {
        setSuccessMessage(null);
      }, 2000);
    } catch (error) {
      console.error('Error deleting article:', error);
      setSuccessMessage('Failed to delete article. Please try again.');
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl w-fit border border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => {
            setActiveTab('create');
            setEditingArticle(null);
          }}
          className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'create'
            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-lg shadow-black/5 border border-zinc-200 dark:border-zinc-700'
            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
        >
          {editingArticle ? 'Edit Article' : 'Create Article'}
        </button>
        <button
          onClick={() => {
            setActiveTab('my-articles');
            setEditingArticle(null);
          }}
          className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'my-articles'
            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-lg shadow-black/5 border border-zinc-200 dark:border-zinc-700'
            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
        >
          Archive ({authorArticles.length})
        </button>
      </div>

      {/* Pricing and Benefits Section */}
      {activeTab === 'create' && !editingArticle && <AuthorPricing />}

      {/* Success Message Area */}
      {successMessage && (
        <div className="fixed bottom-12 right-12 z-[100] animate-in slide-in-from-bottom-5">
          <Alert type="success" onDismiss={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        </div>
      )}

      {/* Content Area */}
      <div className="min-h-[400px]">
        {activeTab === 'create' ? (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            {editingArticle ? (
              <EditArticleForm
                article={editingArticle}
                onSubmit={handleUpdateArticle}
                onCancel={handleCancelEdit}
              />
            ) : (
              <CreateArticleForm onSubmit={handleCreateArticle} />
            )}
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                Personal <span className="text-orange-500">Archive</span>
              </h3>
              <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                Delete fee: {pricing.deleteFee} KAS
              </p>
            </div>
            <ArticleList articles={authorArticles} onEdit={handleEdit} onDelete={handleDeleteArticle} />
          </div>
        )}
      </div>
    </div>
  );
}

