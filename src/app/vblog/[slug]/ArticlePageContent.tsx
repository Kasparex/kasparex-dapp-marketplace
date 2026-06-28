'use client';

import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ArticleDetail } from '@/components/vblog/ArticleDetail';
import { CommentsSection } from '@/components/vblog/CommentsSection';
import { VBlogSidebar } from '@/components/vblog/VBlogSidebar';
import { useVBlog } from '@/hooks/useVBlog';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ArticlePageContentProps {
  slug: string;
}

export function ArticlePageContent({ slug }: ArticlePageContentProps) {
  const { getArticle, articles } = useVBlog();
  const [article, setArticle] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const foundArticle = getArticle(slug);
    setArticle(foundArticle);
    setIsLoading(false);
  }, [slug, getArticle]);

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

  const isLinked = article.linkedMagazineId && article.linkedIssueNumber;

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950">
      <Header />

      <main className="flex-1 min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col lg:flex-row h-full">
          <VBlogSidebar
            articles={articles}
            selectedCategory={null}
            selectedTags={[]}
            searchQuery=""
            onCategoryChange={() => {}}
            onTagToggle={() => {}}
            onSearchChange={() => {}}
            activeView="article"
            articleNavItems={[
              { id: 'article-header', label: 'Overview', icon: <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h10" /></svg> },
              { id: 'article-intro', label: 'Intro', icon: <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01" /></svg> },
              { id: 'article-main', label: 'Main Content', icon: <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M7 8h10" /></svg> },
              { id: 'article-modules', label: 'Premium & Modules', icon: <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg> },
              { id: 'article-comments', label: 'Comments', icon: <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h8m-8 4h6M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4-.8L3 20l1.3-3.9A7.4 7.4 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg> },
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

          {isLinked && (
            <div className="mb-8 p-6 bg-gradient-to-r from-[#02abb8]/10 to-teal-500/10 border border-[#02abb8]/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#02abb8] rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Syndicated Content</h4>
                  <p className="text-xs text-zinc-500 font-bold">This article is featured in Kasparex Magazine Issue #{article.linkedIssueNumber}</p>
                </div>
              </div>
              <Link
                href={`/magazines/issue/${article.linkedMagazineId}/${article.linkedIssueNumber}`}
                className="k-control-btn shrink-0"
              >
                View Magazine
              </Link>
            </div>
          )}

          <div className="space-y-16">
            <ArticleDetail article={article} />
            <div id="article-comments" className="pt-12 border-t border-zinc-200 dark:border-zinc-800">
              <CommentsSection articleId={article.id} />
            </div>
          </div>
        </div>
        </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

