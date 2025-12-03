'use client';

import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ArticleDetail } from '@/components/vblog/ArticleDetail';
import { ArticleMetadata } from '@/components/vblog/ArticleMetadata';
import { CommentsSection } from '@/components/vblog/CommentsSection';
import { useVBlog } from '@/hooks/useVBlog';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ArticlePageContentProps {
  slug: string;
}

export function ArticlePageContent({ slug }: ArticlePageContentProps) {
  const { getArticle } = useVBlog();
  const [article, setArticle] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const foundArticle = getArticle(slug);
    setArticle(foundArticle);
    setIsLoading(false);
  }, [slug, getArticle]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-zinc-600 dark:text-zinc-400">Loading article...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!article) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        <div className="flex flex-col lg:flex-row">
          {/* Main Content */}
          <div className="flex-1 min-w-0 p-4 sm:p-6 lg:px-16 lg:py-12">
            <div className="max-w-4xl mx-auto">
              <Link
                href="/vblog"
                className="inline-flex items-center gap-2 text-base text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Go back
              </Link>
              <ArticleDetail article={article} />
              <ArticleMetadata article={article} />
              <CommentsSection articleId={article.id} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

