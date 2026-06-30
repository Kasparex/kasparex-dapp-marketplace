'use client';

import { Suspense, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AuthorDashboard } from '@/components/vblog/AuthorDashboard';
import { VBlogDashboardBenefitsPanel } from '@/components/vblog/VBlogDashboardBenefitsPanel';
import { VBlogSidebar } from '@/components/vblog/VBlogSidebar';
import { useVBlog } from '@/hooks/useVBlog';
import { useSearchParams } from 'next/navigation';
import { HubWalletGateShell } from '@/components/hub/HubWalletGateShell';
import { VBLOG_DASHBOARD_GATE } from '@/lib/hub/gateConfigs';

function VBlogDashboardPageContent() {
  const { articles } = useVBlog();
  const searchParams = useSearchParams();
  const initialCreateIntent = searchParams.get('tab') === 'create' ? 1 : 0;
  const [createIntentKey, setCreateIntentKey] = useState(initialCreateIntent);
  const editArticleId = searchParams.get('edit');

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="flex-1 min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col lg:flex-row h-full">
          <VBlogSidebar
            articles={articles}
            selectedCategory={selectedCategory}
            selectedTags={selectedTags}
            searchQuery={searchQuery}
            onCategoryChange={setSelectedCategory}
            onTagToggle={(tag) => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
            onSearchChange={setSearchQuery}
            activeView="dashboard"
          />

          <div className="flex-1 min-w-0 p-4 sm:p-8 lg:p-12 overflow-y-auto border-l border-zinc-200 dark:border-zinc-800 text-base sm:text-lg">
            <div className="max-w-6xl mx-auto">
              <div className="mb-8 flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-2">Author dashboard</p>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-900 dark:text-zinc-100 mb-3 tracking-tight">
                    Creator <span className="text-[#02abb8]">Center</span>
                  </h1>
                  <p className="text-base sm:kx-body max-w-3xl">
                    Manage your decentralized vBlog publications
                  </p>
                </div>
                <VBlogDashboardBenefitsPanel layout="vertical-split" />
              </div>

              <HubWalletGateShell mode="replace" config={VBLOG_DASHBOARD_GATE}>
                <AuthorDashboard createIntentKey={createIntentKey} editArticleId={editArticleId} />
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
