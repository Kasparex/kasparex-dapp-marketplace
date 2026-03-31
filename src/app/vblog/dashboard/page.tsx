'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AuthorDashboard } from '@/components/vblog/AuthorDashboard';
import { VBlogSidebar } from '@/components/vblog/VBlogSidebar';
import { VBlogSubmissionModal } from '@/components/vblog/VBlogSubmissionModal';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useVBlog } from '@/hooks/useVBlog';

export default function VBlogDashboardPage() {
  const { state } = useKaspaWallet();
  const { articles, loadArticles } = useVBlog();
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Filter state for sidebar (though dashboard mostly manages its own)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="flex-1 min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col lg:flex-row h-full">
          {/* Sidebar - Integrated */}
          <VBlogSidebar
            articles={articles}
            selectedCategory={selectedCategory}
            selectedTags={selectedTags}
            searchQuery={searchQuery}
            onCategoryChange={setSelectedCategory}
            onTagToggle={(tag) => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
            onSearchChange={setSearchQuery}
            onCreateArticle={() => setIsSubmitModalOpen(true)}
            activeView="dashboard"
          />

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-12 overflow-y-auto border-l border-zinc-200 dark:border-zinc-800 text-base sm:text-[17px]">
            <div className="max-w-6xl mx-auto">
              <div className="mb-12">
                <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-100 mb-2 uppercase tracking-tight">
                  Creator <span className="text-orange-500">Center</span>
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 font-bold text-sm uppercase tracking-widest">
                  Manage your decentralized vBlog publications
                </p>
              </div>

              {!state.isConnected ? (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-12 text-center shadow-2xl shadow-orange-500/5">
                  <div className="w-20 h-20 bg-orange-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <svg className="w-10 h-10 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-3">
                    Wallet Not Connected
                  </h2>
                  <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-md mx-auto font-medium">
                    Please connect your Kaspa or EVM wallet to access your personal dashboard and manage your syndicated articles.
                  </p>
                  <div className="inline-block px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:scale-105">
                    Use Connect Button in Header
                  </div>
                </div>
              ) : (
                <AuthorDashboard />
              )}
            </div>
          </div>
        </div>
      </main>

      <VBlogSubmissionModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSuccess={loadArticles}
      />

      <Footer />
    </div>
  );
}
