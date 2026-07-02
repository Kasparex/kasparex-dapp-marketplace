import type { VBlogArticle } from '@/lib/vblog/types';
import { matchesVBlogSourceFilter, type VBlogSourceFilter } from '@/lib/vblog/source';

export type VBlogSortOption =
  | 'newest'
  | 'oldest'
  | 'updated-newest'
  | 'updated-oldest'
  | 'alphabetical-az'
  | 'alphabetical-za'
  | 'category-az'
  | 'category-za'
  | 'magazine-first';

export type VBlogMagazineFilter = 'all' | 'linked' | 'standalone';

export type VBlogPremiumFilter = 'all' | 'premium' | 'standard';

export interface VBlogListingFilters {
  source: VBlogSourceFilter;
  category: string | null;
  tags: string[];
  magazine: VBlogMagazineFilter;
  premium?: VBlogPremiumFilter;
  searchQuery: string;
  sortBy: VBlogSortOption;
}

/** True when an article includes the gated Premium Content module. */
export function articleHasPremiumContent(article: VBlogArticle): boolean {
  return Boolean(article.modules?.premiumSectionEnabled);
}

function articleTimestamp(article: VBlogArticle): number {
  return new Date(article.publishDate).getTime();
}

function articleUpdatedTimestamp(article: VBlogArticle): number {
  const updated = article.updatedAt ?? article.publishDate;
  return new Date(updated).getTime();
}

function isMagazineLinked(article: VBlogArticle): boolean {
  return Boolean(article.linkedMagazineId && article.linkedIssueNumber);
}

export function filterVBlogArticles(articles: VBlogArticle[], filters: VBlogListingFilters): VBlogArticle[] {
  let filtered = [...articles];

  filtered = filtered.filter((article) => matchesVBlogSourceFilter(article, filters.source));

  if (filters.category) {
    filtered = filtered.filter((article) => article.category === filters.category);
  }

  if (filters.tags.length > 0) {
    filtered = filtered.filter((article) => filters.tags.some((tag) => article.tags.includes(tag)));
  }

  if (filters.magazine === 'linked') {
    filtered = filtered.filter(isMagazineLinked);
  } else if (filters.magazine === 'standalone') {
    filtered = filtered.filter((article) => !isMagazineLinked(article));
  }

  if (filters.premium === 'premium') {
    filtered = filtered.filter(articleHasPremiumContent);
  } else if (filters.premium === 'standard') {
    filtered = filtered.filter((article) => !articleHasPremiumContent(article));
  }

  if (filters.searchQuery.trim()) {
    const query = filters.searchQuery.toLowerCase();
    const authorQuery = query.replace(/^(evm:|kaspa:)/, '');
    filtered = filtered.filter(
      (article) =>
        article.title.toLowerCase().includes(query) ||
        article.description.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query) ||
        article.category.toLowerCase().includes(query) ||
        article.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        article.author.toLowerCase().includes(authorQuery),
    );
  }

  return sortVBlogArticles(filtered, filters.sortBy);
}

export function sortVBlogArticles(articles: VBlogArticle[], sortBy: VBlogSortOption): VBlogArticle[] {
  const sorted = [...articles];

  sorted.sort((a, b) => {
    if (sortBy === 'newest') {
      return articleTimestamp(b) - articleTimestamp(a);
    }
    if (sortBy === 'oldest') {
      return articleTimestamp(a) - articleTimestamp(b);
    }
    if (sortBy === 'updated-newest') {
      return articleUpdatedTimestamp(b) - articleUpdatedTimestamp(a);
    }
    if (sortBy === 'updated-oldest') {
      return articleUpdatedTimestamp(a) - articleUpdatedTimestamp(b);
    }
    if (sortBy === 'alphabetical-az') {
      return a.title.localeCompare(b.title);
    }
    if (sortBy === 'alphabetical-za') {
      return b.title.localeCompare(a.title);
    }
    if (sortBy === 'category-az') {
      return a.category.localeCompare(b.category) || a.title.localeCompare(b.title);
    }
    if (sortBy === 'category-za') {
      return b.category.localeCompare(a.category) || b.title.localeCompare(a.title);
    }
    if (sortBy === 'magazine-first') {
      const aLinked = isMagazineLinked(a) ? 1 : 0;
      const bLinked = isMagazineLinked(b) ? 1 : 0;
      if (bLinked !== aLinked) return bLinked - aLinked;
      return articleTimestamp(b) - articleTimestamp(a);
    }
    return 0;
  });

  return sorted;
}

export function getVBlogTagsFromArticles(articles: VBlogArticle[]): string[] {
  return Array.from(new Set(articles.flatMap((a) => a.tags))).sort((a, b) => a.localeCompare(b));
}
