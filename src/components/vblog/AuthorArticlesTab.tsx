'use client';

import { useMemo, useState } from 'react';
import { VBlogArticle } from '@/lib/vblog/types';
import { VBlogCard } from '@/components/vblog/VBlogCard';
import { KxFormSelect } from '@/components/ui/KxFormSelect';

interface AuthorArticlesTabProps {
  article: VBlogArticle;
  allArticles: VBlogArticle[];
}

type SortKey = 'newest' | 'oldest' | 'title-asc' | 'title-desc';

export function AuthorArticlesTab({ article, allArticles }: AuthorArticlesTabProps) {
  const [sort, setSort] = useState<SortKey>('newest');

  const authorArticles = useMemo(() => {
    const authorKey = article.author.toLowerCase();
    const matches = allArticles.filter(
      (a) => a.slug !== article.slug && a.author.toLowerCase() === authorKey,
    );
    const sorted = [...matches];
    switch (sort) {
      case 'oldest':
        sorted.sort((a, b) => (a.publishDate > b.publishDate ? 1 : -1));
        break;
      case 'title-asc':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title-desc':
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'newest':
      default:
        sorted.sort((a, b) => (a.publishDate < b.publishDate ? 1 : -1));
        break;
    }
    return sorted;
  }, [allArticles, article.author, article.slug, sort]);

  return (
    <div id="article-author-posts" className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="kx-body text-zinc-500 dark:text-zinc-400">
          {authorArticles.length} other {authorArticles.length === 1 ? 'article' : 'articles'} by this creator
        </p>
        <div className="w-full sm:w-48">
          <KxFormSelect
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            ariaLabel="Sort author articles"
            options={[
              { value: 'newest', label: 'Newest first' },
              { value: 'oldest', label: 'Oldest first' },
              { value: 'title-asc', label: 'Title A-Z' },
              { value: 'title-desc', label: 'Title Z-A' },
            ]}
          />
        </div>
      </div>

      {authorArticles.length === 0 ? (
        <p className="kx-body text-zinc-500">No other articles from this author yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
          {authorArticles.map((item) => (
            <VBlogCard key={item.id} article={item} />
          ))}
        </div>
      )}
    </div>
  );
}
