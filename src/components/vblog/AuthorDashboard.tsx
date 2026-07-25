'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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
import { useKxSystemDialog } from '@/hooks/useKxSystemDialog';
import type { VBlogDashboardNavTarget } from '@/components/vblog/VBlogSidebar';

interface AuthorDashboardProps {
  createIntentKey?: number;
  editArticleId?: string | null;
  navTarget?: VBlogDashboardNavTarget | null;
  onNavTargetHandled?: () => void;
  archiveCategoryFilter?: string | null;
}

type DashboardTab = 'create' | 'my-articles';

function tabFromSearchParams(tab: string | null): DashboardTab {
  return tab === 'archive' || tab === 'my-articles' ? 'my-articles' : 'create';
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const walletAddress = kaspaState.address || (evmAddress ? `evm:${evmAddress}` : null);
  const isWalletConnected = kaspaState.isConnected || isEVMConnected;

  const { createNewArticle, updateExistingArticle, deleteExistingArticle, getAuthorArticles, loadArticles, articles } = useVBlog();
  const pricing = useVBlogPricing();
  const { confirm } = useKxSystemDialog();
  const [editingArticle, setEditingArticle] = useState<VBlogArticle | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const editAppliedRef = useRef(false);
  const prevCreateIntentRef = useRef(createIntentKey);

  const activeTab = tabFromSearchParams(searchParams.get('tab'));

  const setActiveTab = useCallback(
    (tab: DashboardTab) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === 'my-articles') {
        params.set('tab', 'archive');
        params.delete('edit');
      } else {
        params.delete('tab');
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (createIntentKey > prevCreateIntentRef.current) {
      setEditingArticle(null);
      const params = new URLSearchParams(searchParams.toString());
      params.delete('tab');
      params.delete('edit');
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }
    prevCreateIntentRef.current = createIntentKey;
  }, [createIntentKey, pathname, router, searchParams]);

  useEffect(() => {
    if (!editArticleId || editAppliedRef.current) return;
    const match = (articles || []).find((a) => a.id === editArticleId) || null;
    if (match) {
      editAppliedRef.current = true;
      setEditingArticle(match);
      const params = new URLSearchParams(searchParams.toString());
      params.delete('tab');
      params.set('edit', editArticleId);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [articles, editArticleId, pathname, router, searchParams]);

  useEffect(() => {
    if (!navTarget) return;

    if (navTarget.section === 'create' || navTarget.section === 'pricing' || navTarget.section === 'modules') {
      setEditingArticle(null);
      setActiveTab('create');
    } else if (navTarget.section === 'archive') {
      setEditingArticle(null);
      setActiveTab('my-articles');
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
  }, [navTarget, onNavTargetHandled, setActiveTab]);

  const authorArticles = walletAddress ? getAuthorArticles(walletAddress) : [];
  const filteredAuthorArticles =
    archiveCategoryFilter == null
      ? authorArticles
      : authorArticles.filter((article) => article.category === archiveCategoryFilter);

  const handleCreateArticle = async (articleData: Omit<VBlogArticle, 'id' | 'slug' | 'publishDate' | 'cid' | 'articleId' | 'txHash' | 'status'>) => {
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
    const params = new URLSearchParams(searchParams.toString());
    params.delete('tab');
    params.set('edit', article.id);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleCancelEdit = () => {
    setEditingArticle(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('edit');
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const handleDeleteArticle = async (articleId: string) => {
    const ok = await confirm({
      title: 'Delete article',
      message: `Deleting an article costs ${pricing.deleteFee} KAS and cannot be undone. Continue?`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;

    try {
      const deleted = await deleteExistingArticle(articleId);
      if (!deleted) {
        throw new Error('Article could not be removed locally.');
      }
      loadArticles();
      setSuccessMessage('Article deleted successfully!');
      setTimeout(() => {
        setSuccessMessage(null);
      }, 2000);
    } catch (error) {
      console.error('Error deleting article:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete article. Please try again.');
      setTimeout(() => {
        setErrorMessage(null);
      }, 4000);
    }
  };

  return (
    <div className="space-y-8">
      <div id="vblog-dashboard-create" className="scroll-mt-24" />
      <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl w-fit border border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => {
            setEditingArticle(null);
            setActiveTab('create');
          }}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'create'
            ? 'bg-white dark:bg-zinc-800 text-[#e30d1b] dark:text-[#ff6b73] shadow-lg shadow-black/5 border border-zinc-200 dark:border-zinc-700'
            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
        >
          {editingArticle ? 'Edit Article' : 'Create Article'}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditingArticle(null);
            setActiveTab('my-articles');
          }}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'my-articles'
            ? 'bg-white dark:bg-zinc-800 text-[#e30d1b] dark:text-[#ff6b73] shadow-lg shadow-black/5 border border-zinc-200 dark:border-zinc-700'
            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
        >
          My Articles ({authorArticles.length})
        </button>
      </div>

      {activeTab === 'create' ? (
        <div id="vblog-dashboard-pricing" className="scroll-mt-24">
          <AuthorPricing />
        </div>
      ) : null}

      {errorMessage && (
        <div className="fixed bottom-12 right-12 z-[100] animate-in slide-in-from-bottom-5">
          <Alert type="error" onDismiss={() => setErrorMessage(null)}>
            {errorMessage}
          </Alert>
        </div>
      )}

      {successMessage && (
        <div className="fixed bottom-12 right-12 z-[100] animate-in slide-in-from-bottom-5">
          <Alert type="success" onDismiss={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        </div>
      )}

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
            <ArticleList articles={filteredAuthorArticles} onEdit={handleEdit} onDelete={handleDeleteArticle} deleteFeeKas={pricing.deleteFee} />
          </div>
        )}
      </div>
    </div>
  );
}
