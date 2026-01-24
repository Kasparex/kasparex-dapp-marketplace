'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { VBlogHeader } from '@/components/vblog/VBlogHeader';
import { VBlogCard } from '@/components/vblog/VBlogCard';
import { VBlogExplainer } from '@/components/vblog/VBlogExplainer';
import { VBlogSidebar } from '@/components/vblog/VBlogSidebar';
import { PricingTable } from '@/components/vblog/PricingTable';
import { VBlogSortFilters, type VBlogSortOption } from '@/components/vblog/VBlogSortFilters';
import { VBlogSubmissionModal } from '@/components/vblog/VBlogSubmissionModal';
import { useVBlog } from '@/hooks/useVBlog';
import { useKaspaWallet } from '@/lib/kaspa/context';

export default function VBlogPage() {
  const { articles, isLoading, loadArticles } = useVBlog();
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
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        <div className="flex flex-col lg:flex-row">
          {/* Sidebar */}
          <VBlogSidebar
            articles={articles}
            selectedCategory={selectedCategory}
            selectedTags={selectedTags}
            searchQuery={searchQuery}
            onCategoryChange={setSelectedCategory}
            onTagToggle={handleTagToggle}
            onSearchChange={setSearchQuery}
          />

          {/* Main Content */}
          <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 lg:pl-6">
            <div className="max-w-7xl mx-auto">
              <div className="mb-6">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="flex-1">
                    <VBlogHeader />
                  </div>
                </div>

                {/* Controls Area */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                  <div className="flex items-center gap-3">
                    <VBlogSortFilters
                      sortBy={sortBy}
                      onSortChange={setSortBy}
                      onAddArticle={() => setIsSubmitModalOpen(true)}
                    />

                    <button
                      onClick={handleResetFilters}
                      className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-sm"
                    >
                      Reset
                    </button>
                  </div>

                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''} found
                  </p>
                </div>

                {/* Pricing Table (Optional / Collapsed or smaller) */}
                <div className="mb-12">
                  <PricingTable />
                </div>
              </div>

              {/* Articles Grid */}
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-base text-zinc-600 dark:text-zinc-400">Loading articles...</p>
                </div>
              ) : filteredArticles.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {filteredArticles.map((article) => (
                    <VBlogCard key={article.id} article={article} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 mb-12">
                  <p className="text-base text-zinc-600 dark:text-zinc-400 mb-4">
                    {searchQuery || selectedCategory || selectedTags.length > 0
                      ? 'No articles match your filters. Try adjusting your search criteria.'
                      : 'No articles yet. Be the first to create one!'}
                  </p>
                  <button
                    onClick={() => setIsSubmitModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg font-medium transition-colors"
                  >
                    Create First Article
                  </button>
                </div>
              )}

              <VBlogExplainer />
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
