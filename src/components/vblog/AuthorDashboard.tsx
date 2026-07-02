'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import type { VBlogDashboardNavTarget } from '@/components/vblog/VBlogSidebar';

interface AuthorDashboardProps {
  createIntentKey?: number;
  editArticleId?: string | null;
  navTarget?: VBlogDashboardNavTarget | null;
  onNavTargetHandled?: () => void;
  archiveCategoryFilter?: string | null;
}

export function AuthorDashboard({
  createIntentKey = 0,
  editArticleId,
  navTarget = null,
  onNavTargetHandled,
  archiveCategoryFilter = null,
}: AuthorDashboardProps) {
  const { state: kaspaState } = useKaspaWallet();
  const { address: evmAddress, isConnected: isEVMConnected } = useAccount();

  // Support both Kaspa and EVM wallets
  const walletAddress = kaspaState.address || (evmAddress ? `evm:${evmAddress}` : null);
  const isWalletConnected = kaspaState.isConnected || isEVMConnected;

  const { createNewArticle, updateExistingArticle, deleteExistingArticle, getAuthorArticles, loadArticles, articles } = useVBlog();
  const pricing = useVBlogPricing();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'create' | 'my-articles'>('create');
  const [editingArticle, setEditingArticle] = useState<VBlogArticle | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab('create');
    setEditingArticle(null);
  }, [createIntentKey]);

  useEffect(() => {
    if (!editArticleId) return;
    const match = (articles || []).find((a) => a.id === editArticleId) || null;
    if (match) {
      setEditingArticle(match);
      setActiveTab('create');
    }
  }, [articles, editArticleId]);

  useEffect(() => {
    if (!navTarget) return;

    if (navTarget.section === 'create' || navTarget.section === 'pricing' || navTarget.section === 'modules') {
      setActiveTab('create');
      setEditingArticle(null);
    } else if (navTarget.section === 'archive') {
      setActiveTab('my-articles');
      setEditingArticle(null);
    }

    const anchorId =
      navTarget.section === 'pricing'
        ? 'vblog-dashboard-pricing'
        : navTarget.section === 'modules'
          ? 'vblog-dashboard-modules'
          : navTarget.section === 'archive'
            ? 'vblog-dashboard-archive'
            : 'vblog-dashboard-create';

    window.requestAnimationFrame(() => {
      document.getElementById(anchorId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      onNavTargetHandled?.();
    });
  }, [navTarget, onNavTargetHandled]);

  const authorArticles = walletAddress ? getAuthorArticles(walletAddress) : [];
  const filteredAuthorArticles =
    archiveCategoryFilter == null
      ? authorArticles
      : authorArticles.filter((article) => article.category === archiveCategoryFilter);

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
    const updated = await updateExistingArticle(articleId, updates);
    loadArticles();
    setEditingArticle(null);
    if (updated?.slug) {
      router.push(`/vblog/${encodeURIComponent(updated.slug)}`);
      return;
    }
    setSuccessMessage('Article updated successfully!');
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
      <div id="vblog-dashboard-create" className="scroll-mt-24" />
      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl w-fit border border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => {
            setActiveTab('create');
            setEditingArticle(null);
          }}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'create'
            ? 'bg-white dark:bg-zinc-800 text-[#02abb8] dark:text-[#66dfe8] shadow-lg shadow-black/5 border border-zinc-200 dark:border-zinc-700'
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
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'my-articles'
            ? 'bg-white dark:bg-zinc-800 text-[#02abb8] dark:text-[#66dfe8] shadow-lg shadow-black/5 border border-zinc-200 dark:border-zinc-700'
            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
        >
          Archive ({authorArticles.length})
        </button>
      </div>

      {/* Pricing and Benefits Section */}
      <div id="vblog-dashboard-pricing" className="scroll-mt-24">
        <AuthorPricing />
      </div>

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
          <div id="vblog-dashboard-archive" className="scroll-mt-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ArticleList articles={filteredAuthorArticles} onEdit={handleEdit} onDelete={handleDeleteArticle} />
          </div>
        )}
      </div>
    </div>
  );
}

