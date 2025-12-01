'use client';

import { useState } from 'react';
import { VBlogArticle } from '@/lib/vblog/types';
import { useVBlog } from '@/hooks/useVBlog';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useAccount } from 'wagmi';
import { CreateArticleForm } from './CreateArticleForm';
import { EditArticleForm } from './EditArticleForm';
import { ArticleList } from './ArticleList';
import { Alert } from '@/components/Alert';

export function AuthorDashboard() {
  const { state: kaspaState } = useKaspaWallet();
  const { address: evmAddress, isConnected: isEVMConnected } = useAccount();
  
  // Support both Kaspa and EVM wallets
  const walletAddress = kaspaState.address || (evmAddress ? `evm:${evmAddress}` : null);
  const isWalletConnected = kaspaState.isConnected || isEVMConnected;
  
  const { createNewArticle, updateExistingArticle, getAuthorArticles, loadArticles } = useVBlog();
  const [activeTab, setActiveTab] = useState<'create' | 'my-articles'>('create');
  const [editingArticle, setEditingArticle] = useState<VBlogArticle | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <Alert type="success" onDismiss={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {/* Tabs */}
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex gap-4">
          <button
            onClick={() => {
              setActiveTab('create');
              setEditingArticle(null);
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'create'
                ? 'border-[#02abb8] text-[#02abb8]'
                : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            {editingArticle ? 'Edit Article' : 'Create New Article'}
          </button>
          <button
            onClick={() => {
              setActiveTab('my-articles');
              setEditingArticle(null);
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'my-articles'
                ? 'border-[#02abb8] text-[#02abb8]'
                : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            My Articles ({authorArticles.length})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'create' ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
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
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              My Articles
            </h3>
            <ArticleList articles={authorArticles} onEdit={handleEdit} />
          </div>
        )}
      </div>
    </div>
  );
}

