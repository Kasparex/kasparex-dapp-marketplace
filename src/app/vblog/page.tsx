'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { VBlogHeader } from '@/components/vblog/VBlogHeader';
import { VBlogCard } from '@/components/vblog/VBlogCard';
import { VBlogSidebar } from '@/components/vblog/VBlogSidebar';
import { VBlogSortFilters, type VBlogSortOption } from '@/components/vblog/VBlogSortFilters';
import { VBlogSubmissionModal } from '@/components/vblog/VBlogSubmissionModal';
import { VBlogRewardsSection } from '@/components/vblog/VBlogRewardsSection';
import { useVBlog } from '@/hooks/useVBlog';
import { useVBlogPricing } from '@/hooks/useVBlogPricing';
import { useKaspaWallet } from '@/lib/kaspa/context';

export default function VBlogPage() {
  const { articles, isLoading, loadArticles } = useVBlog();
  const pricing = useVBlogPricing();
  const { state } = useKaspaWallet();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<VBlogSortOption>('newest');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  const filteredArticles = useMemo(() => {
    let filtered = [...articles];

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(article =>
        selectedTags.some(tag => article.tags.includes(tag))
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(query) ||
        article.description.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query)
      );
    }

    // Sort articles
    filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime();
      }
      if (sortBy === 'alphabetical-az') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'alphabetical-za') {
        return b.title.localeCompare(a.title);
      }
      return 0;
    });

    return filtered;
  }, [articles, selectedCategory, selectedTags, searchQuery, sortBy]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleResetFilters = () => {
    setSelectedCategory(null);
    setSelectedTags([]);
    setSearchQuery('');
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="flex-1 min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col lg:flex-row h-full">
          {/* Sidebar - Restored */}
          <VBlogSidebar
            articles={articles}
            selectedCategory={selectedCategory}
            selectedTags={selectedTags}
            searchQuery={searchQuery}
            onCategoryChange={setSelectedCategory}
            onTagToggle={handleTagToggle}
            onSearchChange={setSearchQuery}
            onCreateArticle={() => setIsSubmitModalOpen(true)}
            activeView="explore"
          />

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-12 overflow-y-auto border-l border-zinc-200 dark:border-zinc-800">
            <div className="max-w-6xl mx-auto">
              {/* Unified Header */}
              <VBlogHeader />

              {/* Pricing & Service Fees Widget */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <span className="text-zinc-500 text-[10px] font-black uppercase tracking-wider">Publishing Fee</span>
                  <span className="text-base font-black text-orange-500">{pricing.createFee} KAS</span>
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <span className="text-zinc-500 text-[10px] font-black uppercase tracking-wider">Edit/Update Fee</span>
                  <span className="text-base font-black text-orange-500">{pricing.editFee} KAS</span>
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <span className="text-zinc-500 text-[10px] font-black uppercase tracking-wider">On-Chain Publication</span>
                  <span className="text-base font-black text-emerald-500">Enabled</span>
                </div>
              </div>

              {/* Dynamic Rewards Section */}
              <VBlogRewardsSection />

              {/* Controls Area */}
              <div className="mt-12 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                  <VBlogSortFilters
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    onAddArticle={() => setIsSubmitModalOpen(true)}
                  />
                  <p className="text-sm font-bold text-zinc-500">
                    {filteredArticles.length} Result{filteredArticles.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Selected Tags Row (Compact) */}
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className="px-3 py-1.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-lg text-[10px] font-black uppercase tracking-wider border border-orange-500/20"
                    >
                      #{tag} ×
                    </button>
                  ))}
                  {selectedTags.length > 0 && (
                    <button onClick={handleResetFilters} className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 font-bold underline underline-offset-4 decoration-2">
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Articles Grid */}
              {isLoading ? (
                <div className="flex items-center justify-center py-24">
                  <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredArticles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-16">
                  {filteredArticles.map((article) => (
                    <VBlogCard key={article.id} article={article} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-24 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 mb-16 shadow-sm">
                  <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 mb-2">No Articles Found</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-sm mx-auto">
                    We couldn&apos;t find any articles matching your current filters.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm transition-all"
                  >
                    Clear All Filters
                  </button>
                </div>
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
