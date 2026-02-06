'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { VBlogHeader } from '@/components/vblog/VBlogHeader';
import { VBlogCard } from '@/components/vblog/VBlogCard';
import { VBlogSortFilters, type VBlogSortOption } from '@/components/vblog/VBlogSortFilters';
import { VBlogSubmissionModal } from '@/components/vblog/VBlogSubmissionModal';
import { VBlogRewardsSection } from '@/components/vblog/VBlogRewardsSection';
import { useVBlog } from '@/hooks/useVBlog';
import { useKaspaWallet } from '@/lib/kaspa/context';

export default function VBlogPage() {
  const { articles, isLoading, loadArticles } = useVBlog();
  const { state } = useKaspaWallet();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<VBlogSortOption>('newest');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  const filteredArticles = useMemo(() => {
    let filtered = [...articles];

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(article => article.category === selectedCategory);
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
  }, [articles, selectedCategory, searchQuery, sortBy]);

  const handleResetFilters = () => {
    setSelectedCategory(null);
    setSearchQuery('');
  };

  const CATEGORIES = Array.from(new Set(articles.map(a => a.category))).filter(Boolean);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-12">
        {/* Unified Header */}
        <VBlogHeader />

        {/* Dynamic Rewards Section */}
        <VBlogRewardsSection />

        {/* Controls Area */}
        <div className="mt-12 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${!selectedCategory
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-lg'
                : 'bg-white dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50'}`}
            >
              All Posts
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedCategory === cat
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'bg-white dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <VBlogSortFilters
              sortBy={sortBy}
              onSortChange={setSortBy}
              onAddArticle={() => setIsSubmitModalOpen(true)}
            />

            <div className="relative group">
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm w-64 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
              />
              <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Articles Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {filteredArticles.map((article) => (
              <VBlogCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 mb-16">
            <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 mb-2">No Articles Found</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-sm mx-auto">
              We couldn&apos;t find any articles matching your current filters or search query.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm transition-all"
            >
              Clear All Filters
            </button>
          </div>
        )}
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
