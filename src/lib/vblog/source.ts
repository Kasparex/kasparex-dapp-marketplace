import type { VBlogArticle } from '@/lib/vblog/types';

export type VBlogSourceFilter = 'all' | 'kasparex' | 'community';

export type VBlogArticleSource = 'kasparex' | 'community';

/** Official Kasparex-authored or syndicated articles. */
export function getVBlogArticleSource(article: VBlogArticle): VBlogArticleSource {
  if (article.source === 'kasparex' || article.source === 'community') {
    return article.source;
  }
  if (article.linkedMagazineId) return 'kasparex';
  if (article.tags.some((t) => t.toLowerCase() === 'kasparex' || t.toLowerCase() === 'official')) {
    return 'kasparex';
  }
  return 'community';
}

export function matchesVBlogSourceFilter(article: VBlogArticle, filter: VBlogSourceFilter): boolean {
  if (filter === 'all') return true;
  return getVBlogArticleSource(article) === filter;
}
