'use client';

import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { VBlogHeader } from '@/components/vblog/VBlogHeader';
import { VBlogArticleGrid } from '@/components/vblog/VBlogArticleGrid';
import { VBlogSidebar } from '@/components/vblog/VBlogSidebar';
import { VBlogSortFilters, type VBlogSortOption } from '@/components/vblog/VBlogSortFilters';
import { VBlogPricingStrip } from '@/components/vblog/VBlogPricingStrip';
import { VBlogRewardsSection } from '@/components/vblog/VBlogRewardsSection';
import { useVBlog } from '@/hooks/useVBlog';
import { useVBlogPricing } from '@/hooks/useVBlogPricing';
import { FilterBar } from '@/components/FilterBar';
import { matchesVBlogSourceFilter, type VBlogSourceFilter } from '@/lib/vblog/source';
import { VBLOG_ACCENT } from '@/lib/vblog/theme';

export default function VBlogPage() {
  const { articles, isLoading } = useVBlog();
  const pricing = useVBlogPricing();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<VBlogSortOption>('newest');
  const [sourceFilter, setSourceFilter] = useState<VBlogSourceFilter>('all');

  const filteredArticles = useMemo(() => {
    let filtered = [...articles];

    filtered = filtered.filter((article) => matchesVBlogSourceFilter(article, sourceFilter));

    if (selectedCategory) {
      filtered = filtered.filter((article) => article.category === selectedCategory);
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter((article) => selectedTags.some((tag) => article.tags.includes(tag)));
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(query) ||
          article.description.toLowerCase().includes(query) ||
          article.content.toLowerCase().includes(query),
      );
    }

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
  }, [articles, selectedCategory, selectedTags, searchQuery, sortBy, sourceFilter]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleResetFilters = () => {
    setSelectedCategory(null);
    setSelectedTags([]);
    setSearchQuery('');
    setSourceFilter('all');
  };

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
            onTagToggle={handleTagToggle}
            onSearchChange={setSearchQuery}
            activeView="explore"
          />

          <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 lg:pl-6 overflow-y-auto border-l border-zinc-200 dark:border-zinc-800 font-sans text-base sm:text-[17px]">
            <div className="max-w-7xl mx-auto">
              <VBlogHeader sourceFilter={sourceFilter} onSourceFilterChange={setSourceFilter} />

              <div id="content" className="scroll-mt-4" />

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">Available articles</h2>
                <p className="kx-body">
                  {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''} found
                </p>
              </div>

              <div className="flex flex-col gap-4 mb-6">
                <FilterBar
                  search={{ value: searchQuery, onChange: setSearchQuery, placeholder: 'Search articles...' }}
                  onReset={handleResetFilters}
                >
                  <VBlogSortFilters sortBy={sortBy} onSortChange={setSortBy} />
                </FilterBar>

                {selectedTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagToggle(tag)}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border"
                        style={{
                          backgroundColor: `${VBLOG_ACCENT}1a`,
                          color: VBLOG_ACCENT,
                          borderColor: `${VBLOG_ACCENT}33`,
                        }}
                      >
                        #{tag} ×
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 font-bold underline underline-offset-4 decoration-2"
                    >
                      Clear
                    </button>
                  </div>
                ) : null}
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-24">
                  <div
                    className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: VBLOG_ACCENT, borderTopColor: 'transparent' }}
                  />
                </div>
              ) : (
                <VBlogArticleGrid articles={filteredArticles} />
              )}

              <VBlogPricingStrip createFee={pricing.createFee} editFee={pricing.editFee} />

              <div className="mt-10 mb-16">
                <VBlogRewardsSection />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
