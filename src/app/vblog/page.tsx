'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { VBlogHeader } from '@/components/vblog/VBlogHeader';
import { VBlogArticleGrid } from '@/components/vblog/VBlogArticleGrid';
import { VBlogSidebar } from '@/components/vblog/VBlogSidebar';
import { VBlogListingFiltersBar } from '@/components/vblog/VBlogSortFilters';
import { VBlogPricingStrip } from '@/components/vblog/VBlogPricingStrip';
import { VBlogRewardsSection } from '@/components/vblog/VBlogRewardsSection';
import { VBlogDashboardBenefitsPanel } from '@/components/vblog/VBlogDashboardBenefitsPanel';
import { VBlogArticleTable, VBlogArticleCompact } from '@/components/vblog/VBlogArticleViews';
import { KxTabStrip } from '@/components/ui/KxTabStrip';
import { VIEW_MODE_OPTIONS, type ViewMode } from '@/components/SortFilters';
import { useVBlog } from '@/hooks/useVBlog';
import { useVBlogPricing } from '@/hooks/useVBlogPricing';
import { FilterBar } from '@/components/FilterBar';
import type { VBlogSourceFilter } from '@/lib/vblog/source';
import {
  filterVBlogArticles,
  type VBlogMagazineFilter,
  type VBlogSortOption,
} from '@/lib/vblog/listing';
import { VBLOG_ACCENT } from '@/lib/vblog/theme';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';

export default function VBlogPage() {
  return (
    <Suspense fallback={null}>
      <VBlogPageInner />
    </Suspense>
  );
}

function VBlogPageInner() {
  const { articles, isLoading } = useVBlog();
  const pricing = useVBlogPricing();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');

  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryParam);

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [categoryParam]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<VBlogSortOption>('newest');
  const [sourceFilter, setSourceFilter] = useState<VBlogSourceFilter>('all');
  const [magazineFilter, setMagazineFilter] = useState<VBlogMagazineFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  const filteredArticles = useMemo(
    () =>
      filterVBlogArticles(articles, {
        source: sourceFilter,
        category: selectedCategory,
        tags: selectedTags,
        magazine: magazineFilter,
        searchQuery,
        sortBy,
      }),
    [articles, sourceFilter, selectedCategory, selectedTags, magazineFilter, searchQuery, sortBy],
  );

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleResetFilters = () => {
    setSelectedCategory(null);
    setSelectedTags([]);
    setSearchQuery('');
    setSourceFilter('all');
    setMagazineFilter('all');
    setSortBy('newest');
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
                <DAppSectionHeader title="Available Articles" />
                <p className="kx-body -mt-2">
                  Browse on-chain articles from Kasparex and community authors.
                </p>
              </div>

              <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <VBlogDashboardBenefitsPanel variant="compact" className="w-full sm:w-auto sm:max-w-[min(100%,42rem)]" />
              </div>

              <div className="flex flex-col gap-4 mb-6">
                <FilterBar
                  search={{ value: searchQuery, onChange: setSearchQuery, placeholder: 'Search by title, tag, or wallet address...' }}
                  onReset={handleResetFilters}
                  flexWrap
                >
                  <KxTabStrip
                    value={viewMode}
                    onChange={setViewMode}
                    options={VIEW_MODE_OPTIONS}
                    ariaLabel="View mode"
                    iconOnly
                  />
                  <VBlogListingFiltersBar
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    sourceFilter={sourceFilter}
                    onSourceFilterChange={setSourceFilter}
                    magazineFilter={magazineFilter}
                    onMagazineFilterChange={setMagazineFilter}
                  />
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
                  </div>
                ) : null}
              </div>

              <div className="mb-6">
                <DAppSectionHeader
                  title={`${filteredArticles.length} Article${filteredArticles.length !== 1 ? 's' : ''} Found`}
                />
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-24">
                  <div
                    className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: VBLOG_ACCENT, borderTopColor: 'transparent' }}
                  />
                </div>
              ) : viewMode === 'table' ? (
                <VBlogArticleTable articles={filteredArticles} />
              ) : viewMode === 'compact' ? (
                <VBlogArticleCompact articles={filteredArticles} />
              ) : (
                <VBlogArticleGrid articles={filteredArticles} />
              )}

              <VBlogPricingStrip createFee={pricing.createFee} editFee={pricing.editFee} deleteFee={pricing.deleteFee} />

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
