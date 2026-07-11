'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { VBlogHeader } from '@/components/vblog/VBlogHeader';
import { VBlogArticleGrid } from '@/components/vblog/VBlogArticleGrid';
import { VBlogSidebar } from '@/components/vblog/VBlogSidebar';
import { VBlogListingFiltersBar } from '@/components/vblog/VBlogListingFilters';
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
  getVBlogTagsFromArticles,
  type VBlogMagazineFilter,
  type VBlogPremiumFilter,
  type VBlogSortOption,
} from '@/lib/vblog/listing';
import { getVBlogArticleCurrencies } from '@/lib/hub/listingCurrencies';
import { VBLOG_ACCENT } from '@/lib/vblog/theme';
import { HubListingTitleRow } from '@/components/hub/HubListingTitleRow';
import { HubPageAccentLayout } from '@/components/hub/HubPageAccentLayout';
import { HUB_MAIN_COLUMN, HUB_MAIN_INNER } from '@/lib/hub/hubLayout';

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

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categoryParam ? [categoryParam] : [],
  );
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([]);

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategories([categoryParam]);
    } else {
      setSelectedCategories([]);
    }
  }, [categoryParam]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<VBlogSortOption>('newest');
  const [sourceFilter, setSourceFilter] = useState<VBlogSourceFilter>('all');
  const [magazineFilter, setMagazineFilter] = useState<VBlogMagazineFilter>('all');
  const [premiumFilter, setPremiumFilter] = useState<VBlogPremiumFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  const filteredArticles = useMemo(
    () =>
      filterVBlogArticles(articles, {
        source: sourceFilter,
        category: selectedCategories.length === 1 ? selectedCategories[0] : null,
        categories: selectedCategories.length > 1 ? selectedCategories : undefined,
        tags: selectedTags,
        currencies: selectedCurrencies.length > 0 ? selectedCurrencies : undefined,
        magazine: magazineFilter,
        premium: premiumFilter,
        searchQuery,
        sortBy,
      }),
    [articles, sourceFilter, selectedCategories, selectedTags, selectedCurrencies, magazineFilter, premiumFilter, searchQuery, sortBy],
  );

  const categoryOptions = useMemo(
    () => Array.from(new Set(articles.map((a) => a.category))).sort((a, b) => a.localeCompare(b)),
    [articles],
  );
  const currencyOptions = useMemo(() => getVBlogArticleCurrencies(articles), [articles]);
  const allTagOptions = useMemo(() => getVBlogTagsFromArticles(articles), [articles]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleResetFilters = () => {
    setSelectedCategories([]);
    setSelectedTags([]);
    setSelectedCurrencies([]);
    setSearchQuery('');
    setSourceFilter('all');
    setMagazineFilter('all');
    setPremiumFilter('all');
    setSortBy('newest');
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="flex-1 min-h-[calc(100vh-4rem)]">
        <HubPageAccentLayout projectId="kasparex-vblog">
          <VBlogSidebar
            articles={articles}
            selectedCategory={selectedCategories.length === 1 ? selectedCategories[0] : null}
            selectedTags={selectedTags}
            searchQuery={searchQuery}
            onCategoryChange={(cat) => setSelectedCategories(cat ? [cat] : [])}
            onTagToggle={handleTagToggle}
            onSearchChange={setSearchQuery}
            activeView="explore"
          />

          <div className={HUB_MAIN_COLUMN}>
            <div className={HUB_MAIN_INNER}>
              <VBlogHeader sourceFilter={sourceFilter} onSourceFilterChange={setSourceFilter} />

              <div id="content" className="scroll-mt-4" />

              <HubListingTitleRow
                projectId="kasparex-vblog"
                title="Available articles"
                count={filteredArticles.length}
                countLabel="article"
                benefits={<VBlogDashboardBenefitsPanel variant="compact" className="w-full" />}
              />

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
                    magazineFilter={magazineFilter}
                    onMagazineFilterChange={setMagazineFilter}
                    premiumFilter={premiumFilter}
                    onPremiumFilterChange={setPremiumFilter}
                    selectedCurrencies={selectedCurrencies}
                    onCurrenciesChange={setSelectedCurrencies}
                    currencyOptions={currencyOptions}
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
        </HubPageAccentLayout>
      </main>

      <Footer />
    </div>
  );
}
