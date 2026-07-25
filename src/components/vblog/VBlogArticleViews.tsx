'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { VBlogArticle } from '@/lib/vblog/types';
import { formatDate, getArticleExcerpt } from '@/lib/vblog/utils';
import { KxListingCategoryChip } from '@/components/ui/KxListingCategoryChip';
import { VBlogFeaturedImage } from '@/components/vblog/VBlogFeaturedImage';
import { KX_LISTING_PLACEHOLDER_GRADIENT } from '@/lib/ui/kxListingPlaceholder';
import { AuthorInline } from '@/components/ui/AuthorInline';

function CategoryIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 p-12 text-center">
      <p className="text-lg font-bold text-zinc-800 dark:text-zinc-200 mb-2">No articles found</p>
      <p className="text-sm text-zinc-500 max-w-md mx-auto">
        Try another source tab or reset filters to browse more vBlog posts.
      </p>
    </div>
  );
}

function ArticleThumb({ article, size }: { article: VBlogArticle; size: string }) {
  const hasImage = Boolean(article.featuredImage?.trim());
  return (
    <div className={`${size} shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800`}>
      {hasImage ? (
        <VBlogFeaturedImage
          src={article.featuredImage}
          title={article.title}
          variant="card"
          className="h-full w-full"
          imgClassName="h-full w-full object-cover"
        />
      ) : (
        <div className={`flex h-full w-full items-center justify-center ${KX_LISTING_PLACEHOLDER_GRADIENT}`}>
          <svg className="h-5 w-5 text-[color:var(--hub-accent)] dark:text-[color:var(--hub-accent-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        </div>
      )}
    </div>
  );
}

/** Compact view: dense two-line rows in a responsive grid (mirrors dApps compact view). */
export function VBlogArticleCompact({ articles }: { articles: VBlogArticle[] }) {
  if (articles.length === 0) return <EmptyState />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {articles.map((article) => (
        <Link
          key={article.id}
          href={`/vblog/${article.slug}`}
          className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all"
        >
          <ArticleThumb article={article} size="h-12 w-12" />
          <div className="flex-1 min-w-0">
            <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{article.title}</h3>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
              <AuthorInline
                address={article.author}
                href={`/u/${encodeURIComponent(article.author)}?tab=my-articles`}
                size={16}
              />
              <span aria-hidden>•</span>
              <span className="truncate">{article.category}</span>
            </div>
          </div>
          <span className="shrink-0 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
            {formatDate(article.publishDate)}
          </span>
        </Link>
      ))}
    </div>
  );
}

type SortField = 'title' | 'author' | 'category' | 'date';
type SortDirection = 'asc' | 'desc';

/** Table view with sortable headers (mirrors dApps table view). */
export function VBlogArticleTable({ articles }: { articles: VBlogArticle[] }) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sorted = useMemo(() => {
    const list = [...articles];
    list.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';
      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'author':
          aValue = a.author.toLowerCase();
          bValue = b.author.toLowerCase();
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case 'date':
          aValue = new Date(a.publishDate).getTime();
          bValue = new Date(b.publishDate).getTime();
          break;
        default:
          return 0;
      }
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [articles, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return <span className="ml-1 text-zinc-400">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  const headerClass =
    'text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap';

  if (articles.length === 0) return <EmptyState />;

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <table className="w-full border-collapse min-w-[760px]">
        <thead>
          <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
            <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Article</th>
            <th className={headerClass} onClick={() => handleSort('title')}>
              Title<SortIcon field="title" />
            </th>
            <th className={headerClass} onClick={() => handleSort('author')}>
              Author<SortIcon field="author" />
            </th>
            <th className={headerClass} onClick={() => handleSort('category')}>
              Category<SortIcon field="category" />
            </th>
            <th className={headerClass} onClick={() => handleSort('date')}>
              Published<SortIcon field="date" />
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((article) => (
            <tr
              key={article.id}
              className="border-b border-zinc-100 dark:border-zinc-800 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
              <td className="py-3 px-4">
                <Link href={`/vblog/${article.slug}`} className="flex items-center">
                  <ArticleThumb article={article} size="h-10 w-10" />
                </Link>
              </td>
              <td className="py-3 px-4 max-w-[320px]">
                <Link href={`/vblog/${article.slug}`} className="block">
                  <span className="line-clamp-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {article.title}
                  </span>
                  <span className="line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {getArticleExcerpt(article, 80)}
                  </span>
                </Link>
              </td>
              <td className="py-3 px-4">
                <AuthorInline
                  address={article.author}
                  href={`/u/${encodeURIComponent(article.author)}?tab=my-articles`}
                  prefix=""
                  className="text-sm"
                />
              </td>
              <td className="py-3 px-4">
                <KxListingCategoryChip icon={<CategoryIcon />} className="shrink-0">
                  {article.category}
                </KxListingCategoryChip>
              </td>
              <td className="py-3 px-4">
                <span className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                  {formatDate(article.publishDate)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
