'use client';

import { Suspense, useMemo, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AuthorDashboard } from '@/components/vblog/AuthorDashboard';
import { VBlogSidebar, type VBlogDashboardNavTarget } from '@/components/vblog/VBlogSidebar';
import { useVBlog } from '@/hooks/useVBlog';
import { useSearchParams } from 'next/navigation';
import { HubWalletGateShell } from '@/components/hub/HubWalletGateShell';
import { VBLOG_DASHBOARD_GATE } from '@/lib/hub/gateConfigs';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useAccount } from 'wagmi';

function VBlogDashboardPageContent() {
  const { articles, getAuthorArticles } = useVBlog();
  const { state: kaspaState } = useKaspaWallet();
  const { address: evmAddress } = useAccount();
  const searchParams = useSearchParams();
  const initialCreateIntent = searchParams.get('tab') === 'create' ? 1 : 0;
  const [createIntentKey, setCreateIntentKey] = useState(initialCreateIntent);
  const editArticleId = searchParams.get('edit');

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [navTarget, setNavTarget] = useState<VBlogDashboardNavTarget | null>(null);

  const walletAddress = kaspaState.address || (evmAddress ? `evm:${evmAddress}` : null);
  const authorArticles = useMemo(
    () => (walletAddress ? getAuthorArticles(walletAddress) : []),
    [getAuthorArticles, walletAddress, articles],
  );

  const handleDashboardNav = (target: VBlogDashboardNavTarget) => {
    setNavTarget({ ...target, category: target.category ?? null });
    if (target.section === 'archive') {
      setSelectedCategory(target.category ?? null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="flex-1 min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col lg:flex-row h-full">
          <VBlogSidebar
            articles={articles}
            selectedCategory={selectedCategory}
            searchQuery={searchQuery}
            onCategoryChange={setSelectedCategory}
            onSearchChange={setSearchQuery}
            activeView="dashboard"
            onDashboardNav={handleDashboardNav}
            dashboardAuthorArticles={authorArticles}
          />

          <div className="flex-1 min-w-0 p-4 sm:p-8 lg:p-12 overflow-y-auto border-l border-zinc-200 dark:border-zinc-800 text-base sm:text-lg">
            <div className="max-w-6xl mx-auto">
              <div className="mb-8">
                <p className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-2">Author dashboard</p>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-900 dark:text-zinc-100 mb-3 tracking-tight">
                  Creator <span className="text-[#02abb8]">Center</span>
                </h1>
                <p className="text-base sm:kx-body max-w-3xl">
                  Manage your decentralized vBlog publications
                </p>
              </div>

              <HubWalletGateShell mode="replace" config={VBLOG_DASHBOARD_GATE}>
                <AuthorDashboard
                  createIntentKey={createIntentKey}
                  editArticleId={editArticleId}
                  navTarget={navTarget}
                  onNavTargetHandled={() => setNavTarget(null)}
                  archiveCategoryFilter={selectedCategory}
                />
              </HubWalletGateShell>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function VBlogDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
          <Header />
          <main className="flex flex-1 items-center justify-center p-8">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading dashboard…</p>
          </main>
          <Footer />
        </div>
      }
    >
      <VBlogDashboardPageContent />
    </Suspense>
  );
}
