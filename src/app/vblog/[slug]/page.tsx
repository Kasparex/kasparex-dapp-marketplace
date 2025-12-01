'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ArticleDetail } from '@/components/vblog/ArticleDetail';
import { ArticleMetadata } from '@/components/vblog/ArticleMetadata';
import { CommentsSection } from '@/components/vblog/CommentsSection';
import { useVBlog } from '@/hooks/useVBlog';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ArticlePage({ params }: PageProps) {
  const [slug, setSlug] = useState<string>('');
  const { getArticle } = useVBlog();
  const [article, setArticle] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params;
      setSlug(resolvedParams.slug);
      const foundArticle = getArticle(resolvedParams.slug);
      setArticle(foundArticle);
      setIsLoading(false);
    }
    loadParams();
  }, [params, getArticle]);

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
            <ArticleDetail article={article} />
            <ArticleMetadata article={article} />
            <CommentsSection articleId={article.id} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

