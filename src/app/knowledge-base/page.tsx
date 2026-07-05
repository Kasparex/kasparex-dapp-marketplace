'use client';

import { useState, useMemo } from 'react';
import { KnowledgeBaseSidebar } from '@/components/knowledgeBase/KnowledgeBaseSidebar';
import { KnowledgeBaseCard } from '@/components/knowledgeBase/KnowledgeBaseCard';
import {
  getArticlesByCategory,
  type KnowledgeBaseCategory,
} from '@/lib/knowledgeBase';
import { HubDocPageShell } from '@/components/hub/HubDocPageShell';
import { HubListingTitleRow } from '@/components/hub/HubListingTitleRow';
import { HubBenefitsPanel } from '@/components/hub/HubBenefitsPanel';
import { FilterBar } from '@/components/FilterBar';

export default function KnowledgeBasePage() {
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeBaseCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredArticles = useMemo(() => {
    let articles = getArticlesByCategory(selectedCategory);
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      articles = articles.filter(
        (article) =>
          article.title.toLowerCase().includes(query) ||
          article.description.toLowerCase().includes(query),
      );
    }
    return articles;
  }, [selectedCategory, searchQuery]);

  return (
    <HubDocPageShell sidebar={<KnowledgeBaseSidebar selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />}>
      <HubListingTitleRow
        title="Available articles"
        count={filteredArticles.length}
        countLabel="article"
        benefits={<HubBenefitsPanel variant="compact" className="w-full" />}
      />
      <p className="kx-body -mt-4 mb-6 max-w-3xl">Everything you need to know about the Kasparex ecosystem.</p>

      <div className="mb-8 flex flex-col gap-4">
        <FilterBar
          search={{ value: searchQuery, onChange: setSearchQuery, placeholder: 'Search articles...' }}
          onReset={() => {
            setSearchQuery('');
            setSelectedCategory('all');
          }}
        />
      </div>

      {filteredArticles.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((article) => (
            <KnowledgeBaseCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="kx-body">No articles found. Try adjusting your search or category filter.</p>
        </div>
      )}
    </HubDocPageShell>
  );
}
