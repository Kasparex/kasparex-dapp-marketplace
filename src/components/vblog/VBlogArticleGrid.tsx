'use client';

import { VBlogArticle } from '@/lib/vblog/types';
import { VBlogCard } from '@/components/vblog/VBlogCard';

export function VBlogArticleGrid({ articles }: { articles: VBlogArticle[] }) {
  if (articles.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 p-12 text-center">
        <p className="text-lg font-bold text-zinc-800 dark:text-zinc-200 mb-2">No articles found</p>
        <p className="text-sm text-zinc-500 max-w-md mx-auto">
          Try another source tab or reset filters to browse more vBlog posts.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
      {articles.map((article) => (
        <VBlogCard key={article.id} article={article} />
      ))}
    </div>
  );
}
