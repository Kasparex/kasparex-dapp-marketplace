'use client';

import { useMemo } from 'react';
import { VBlogArticle } from '@/lib/vblog/types';
import { VBlogCard } from '@/components/vblog/VBlogCard';

interface RelatedVBlogArticlesProps {
  article: VBlogArticle;
  allArticles: VBlogArticle[];
}

function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function RelatedVBlogArticles({ article, allArticles }: RelatedVBlogArticlesProps) {
  const related = useMemo(() => {
    const others = allArticles.filter((a) => a.slug !== article.slug);
    const sameCategory = others.filter((a) => a.category === article.category);
    const sharedTags = others.filter(
      (a) => a.category !== article.category && a.tags.some((tag) => article.tags.includes(tag)),
    );

    if (sameCategory.length >= 3) return shuffle(sameCategory).slice(0, 3);

    const result = [...shuffle(sameCategory)];
    const pool = shuffle([...sharedTags, ...others.filter((a) => !sameCategory.includes(a) && !sharedTags.includes(a))]);
    for (const item of pool) {
      if (result.length >= 3) break;
      if (!result.some((x) => x.id === item.id)) result.push(item);
    }
    return result.slice(0, 3);
  }, [allArticles, article.category, article.slug, article.tags]);

  if (related.length === 0) return null;

  return (
    <section className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">Related articles</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
        {related.map((item) => (
          <VBlogCard key={item.id} article={item} />
        ))}
      </div>
    </section>
  );
}
