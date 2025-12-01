'use client';

import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { VBlogHeader } from '@/components/vblog/VBlogHeader';
import { VBlogCard } from '@/components/vblog/VBlogCard';
import { VBlogExplainer } from '@/components/vblog/VBlogExplainer';
import { useVBlog } from '@/hooks/useVBlog';

export default function VBlogPage() {
  const { articles, isLoading } = useVBlog();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        <div className="p-4 sm:p-6 lg:p-8 lg:pl-6">
          <div className="max-w-7xl mx-auto">
            <VBlogHeader />

            {/* Articles Grid */}
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-zinc-600 dark:text-zinc-400">Loading articles...</p>
              </div>
            ) : articles.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {articles.map((article) => (
                  <VBlogCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                  No articles yet. Be the first to create one!
                </p>
                <Link
                  href="/vblog/dashboard"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg font-medium transition-colors"
                >
                  Create Article
                </Link>
              </div>
            )}

            <VBlogExplainer />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

