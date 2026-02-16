'use client';

import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { KnowledgeBaseSidebar } from '@/components/knowledgeBase/KnowledgeBaseSidebar';
import { KnowledgeBaseCard } from '@/components/knowledgeBase/KnowledgeBaseCard';
import {
  knowledgeBaseArticles,
  getArticlesByCategory,
  type KnowledgeBaseCategory,
} from '@/lib/knowledgeBase';

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
          article.description.toLowerCase().includes(query)
      );
    }

    return articles;
  }, [selectedCategory, searchQuery]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        <div className="flex flex-col lg:flex-row">
          {/* Left Sidebar */}
          <KnowledgeBaseSidebar
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />

          {/* Main Content */}
          <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 lg:pl-6">
            <div className="max-w-6xl mx-auto">
              {/* Hero Section */}
              <div className="mb-6">
                <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                  Knowledge Base
                </h1>
                <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-4">
                  Everything you need to know about the Kasparex ecosystem
                </p>
                <div className="k-search-container h-10 max-w-md overflow-visible">
                  <input
                    type="text"
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`k-search-input h-10 w-full ${searchQuery.length > 0 ? 'is-typing' : ''}`.trim()}
                  />
                </div>
              </div>

              {/* Results Count */}
              <div className="mb-6">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {filteredArticles.length} {filteredArticles.length === 1 ? 'article' : 'articles'} found
                  {selectedCategory !== 'all' && ` in ${selectedCategory}`}
                  {searchQuery && ` matching "${searchQuery}"`}
                </p>
              </div>

              {/* Articles Grid */}
              {filteredArticles.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredArticles.map((article) => (
                    <KnowledgeBaseCard key={article.id} article={article} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-zinc-600 dark:text-zinc-400">
                    No articles found. Try adjusting your search or category filter.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

