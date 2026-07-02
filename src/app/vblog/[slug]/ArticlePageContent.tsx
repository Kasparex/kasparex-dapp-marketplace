'use client';

import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ArticleDetail, type ArticleContentTab } from '@/components/vblog/ArticleDetail';
import { RelatedVBlogArticles } from '@/components/vblog/RelatedVBlogArticles';
import { VBlogSidebar } from '@/components/vblog/VBlogSidebar';
import { HubSocialMeta } from '@/components/metadata/HubSocialMeta';
import { useVBlog } from '@/hooks/useVBlog';
import { notFound, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { VBlogArticle } from '@/lib/vblog/types';

interface ArticlePageContentProps {
  slug: string;
}

const TAB_NAV_IDS: Record<string, ArticleContentTab> = {
  'article-author': 'author',
  'article-author-posts': 'author-posts',
  'article-modules': 'modules',
  'article-comments': 'comments',
};

const VALID_TABS: ArticleContentTab[] = ['article', 'author', 'author-posts', 'modules', 'comments'];

const SCROLL_NAV_IDS = new Set(['article-header', 'article-intro', 'article-main', 'article-premium', 'article-tip-box']);

export function ArticlePageContent({ slug }: ArticlePageContentProps) {
  const { getArticle, articles, getArticleComments } = useVBlog();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [article, setArticle] = useState<VBlogArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [contentTab, setContentTab] = useState<ArticleContentTab>(
    tabParam && VALID_TABS.includes(tabParam as ArticleContentTab) ? (tabParam as ArticleContentTab) : 'article',
  );

  useEffect(() => {
    if (tabParam && VALID_TABS.includes(tabParam as ArticleContentTab)) {
      setContentTab(tabParam as ArticleContentTab);
    }
  }, [tabParam]);

  useEffect(() => {
    const foundArticle = getArticle(slug);
    setArticle(foundArticle);
    setIsLoading(false);
  }, [slug, getArticle, articles]);

  const commentCount = useMemo(
    () => (article ? getArticleComments(article.id).length : 0),
    [article, getArticleComments],
  );

  const sidebarDefaultHidden = article?.layoutPreferences?.sidebarShownByDefault === false;

  const handleArticleNavClick = useCallback((itemId: string) => {
    const tabTarget = TAB_NAV_IDS[itemId];
    if (tabTarget) {
      setContentTab(tabTarget);
      window.setTimeout(() => {
        const el = document.getElementById(itemId);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
      return;
    }

    if (SCROLL_NAV_IDS.has(itemId)) {
      setContentTab('article');
      window.setTimeout(() => {
        document.getElementById(itemId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#02abb8] border-t-transparent rounded-full animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!article) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950">
      <HubSocialMeta
        title={`${article.title} - Kasparex vBlog`}
        description={article.description}
        image={article.featuredImage}
        path={`/vblog/${article.slug}`}
      />
      <Header />

      <main className="flex-1 min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col lg:flex-row h-full">
          <VBlogSidebar
            articles={articles}
            selectedCategory={null}
            searchQuery=""
            onCategoryChange={() => {}}
            onSearchChange={() => {}}
            activeView="article"
            defaultHidden={sidebarDefaultHidden}
            onArticleNavClick={handleArticleNavClick}
            articleNavItems={[
              { id: 'article-header', label: 'Overview', icon: <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h10" /></svg> },
              { id: 'article-intro', label: 'Intro', icon: <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01" /></svg> },
              { id: 'article-main', label: 'Article', icon: <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M7 8h10" /></svg> },
              { id: 'article-author', label: 'Author', icon: <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
              { id: 'article-author-posts', label: 'More from Author', icon: <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> },
              { id: 'article-modules', label: 'Modules', icon: <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg> },
              { id: 'article-comments', label: 'Comments', count: commentCount > 0 ? commentCount : undefined, icon: <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h8m-8 4h6M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4-.8L3 20l1.3-3.9A7.4 7.4 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg> },
            ]}
          />
          <div className="flex-1 w-full p-4 sm:p-6 lg:p-12 overflow-y-auto bg-white dark:bg-zinc-950 text-base sm:text-[17px] border-l border-zinc-200 dark:border-zinc-800">
            <div className="w-full max-w-5xl mx-auto font-sans">
              <nav className="flex items-center gap-2 text-sm text-zinc-500 font-medium mb-8">
                <Link href="/vblog" className="hover:text-[#02abb8] transition-colors">Articles</Link>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-zinc-900 dark:text-zinc-100 truncate">{article.title}</span>
              </nav>

              <ArticleDetail
                article={article}
                allArticles={articles}
                contentTab={contentTab}
                onContentTabChange={setContentTab}
              />

              <RelatedVBlogArticles article={article} allArticles={articles} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
