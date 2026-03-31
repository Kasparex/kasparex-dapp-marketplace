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
    if (!confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
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
    <div className="space-y-12">
      {/* Navigation Tabs */}
      <div className="flex bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1.5 gap-1.5 rounded-2xl shadow-sm max-w-sm mx-auto">
        <button
          onClick={() => {
            setActiveTab('create');
            setEditingArticle(null);
          }}
          className={`flex-1 px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'create'
            ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md'
            : 'text-zinc-500 hover:text-zinc-100 dark:hover:text-zinc-100'
            }`}
        >
          {editingArticle ? 'Edit Article' : 'Draft Article'}
        </button>
        <button
          onClick={() => {
            setActiveTab('my-articles');
            setEditingArticle(null);
          }}
          className={`flex-1 px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'my-articles'
            ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md'
            : 'text-zinc-500 hover:text-zinc-100 dark:hover:text-zinc-100'
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
            </div>
            <ArticleList articles={authorArticles} onEdit={handleEdit} onDelete={handleDeleteArticle} />
          </div>
        )}
      </div>
    </div>
  );
}

