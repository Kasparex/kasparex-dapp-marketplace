'use client';

import { Suspense, useMemo, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AuthorDashboard } from '@/components/vblog/AuthorDashboard';
import { VBlogSidebar, type VBlogDashboardNavTarget } from '@/components/vblog/VBlogSidebar';
import { useVBlog } from '@/hooks/useVBlog';
import { useSearchParams } from 'next/navigation';
import { HubWalletGateShell } from '@/components/hub/HubWalletGateShell';
import { MobileDesktopOnlyGate } from '@/components/hub/MobileDesktopOnlyGate';
import { VBLOG_DASHBOARD_GATE } from '@/lib/hub/gateConfigs';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useAccount } from 'wagmi';
import { HubAccentScope } from '@/components/hub/HubAccentScope';
import { HubDashboardPageHeader } from '@/components/hub/HubDashboardPageHeader';

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
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="min-h-[calc(100vh-4rem)] flex-1">
        <HubAccentScope projectId="kasparex-vblog" className="flex h-full flex-col lg:flex-row">
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

          <div className="min-w-0 flex-1 overflow-y-auto border-l border-zinc-200 p-4 text-base sm:p-8 sm:text-lg lg:p-12 dark:border-zinc-800">
            <div className="mx-auto max-w-6xl">
              <HubDashboardPageHeader
                kicker="Author dashboard"
                title="Creator"
                titleAccent="Center"
                excerpt="Manage your decentralized vBlog publications"
                adSlotId="HALO_VBLOG_RIGHT"
              />

              <MobileDesktopOnlyGate title="Creator Center" backHref="/vblog" backLabel="Back to vBlog">
              <HubWalletGateShell mode="replace" config={VBLOG_DASHBOARD_GATE}>
                <AuthorDashboard
                  createIntentKey={createIntentKey}
                  editArticleId={editArticleId}
                  navTarget={navTarget}
                  onNavTargetHandled={() => setNavTarget(null)}
                  archiveCategoryFilter={selectedCategory}
                />
              </HubWalletGateShell>
              </MobileDesktopOnlyGate>
            </div>
          </div>
        </HubAccentScope>
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
