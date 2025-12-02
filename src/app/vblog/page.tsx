'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { VBlogHeader } from '@/components/vblog/VBlogHeader';
import { VBlogCard } from '@/components/vblog/VBlogCard';
import { VBlogExplainer } from '@/components/vblog/VBlogExplainer';
import { VBlogSidebar } from '@/components/vblog/VBlogSidebar';
import { PricingTable } from '@/components/vblog/PricingTable';
import { useVBlog } from '@/hooks/useVBlog';
import { useKaspaWallet } from '@/lib/kaspa/context';

// Dynamically import PublishArticleWizard to avoid SSR issues and hook order problems
const PublishArticleWizard = dynamic(
  () => import('@/components/vblog/PublishArticleWizard').then(mod => ({ default: mod.PublishArticleWizard })),
  { 
    ssr: false,
    loading: () => null, // Don't show loading state when modal is closed
  }
);

export default function VBlogPage() {
  const { articles, isLoading, loadArticles } = useVBlog();
  const { state } = useKaspaWallet();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showWizard, setShowWizard] = useState(false);

  const filteredArticles = useMemo(() => {
    let filtered = articles;

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

    return filtered;
  }, [articles, selectedCategory, selectedTags, searchQuery]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
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
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setShowWizard(true)}
                      className="px-4 py-2 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                      title="Publish a new article"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Publish Article
                    </button>
                  </div>
                </div>
                
                {/* Pricing Table */}
                <div className="mb-8">
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
                <div className="text-center py-12">
                  <p className="text-base text-zinc-600 dark:text-zinc-400 mb-4">
                    {searchQuery || selectedCategory || selectedTags.length > 0
                      ? 'No articles match your filters. Try adjusting your search criteria.'
                      : 'No articles yet. Be the first to create one!'}
                  </p>
                  {!searchQuery && !selectedCategory && selectedTags.length === 0 && (
                    <Link
                      href="/vblog/dashboard"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg font-medium transition-colors"
                    >
                      Create Article
                    </Link>
                  )}
                </div>
              )}

              <VBlogExplainer />
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Publish Article Wizard - Only render when open to avoid hook violations */}
      {showWizard && (
        <PublishArticleWizard
          isOpen={showWizard}
          onClose={() => setShowWizard(false)}
          onComplete={() => {
            loadArticles();
            setShowWizard(false);
          }}
        />
      )}
    </div>
  );
}

