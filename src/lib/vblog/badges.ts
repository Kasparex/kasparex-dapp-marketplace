import type { KxBadgeVariant } from '@/components/ui/KxBadge';
import type { VBlogArticle } from '@/lib/vblog/types';
import { getVBlogArticleSource } from '@/lib/vblog/source';

export function vblogSourceBadgeVariant(source: ReturnType<typeof getVBlogArticleSource>): KxBadgeVariant {
  return source === 'kasparex' ? 'cyan' : 'amber';
}

export function vblogStatusBadgeVariant(article: VBlogArticle): KxBadgeVariant {
  if (article.status === 'published' || article.status === 'on-chain-ready' || article.status === 'verified') {
    return 'emerald';
  }
  if (article.status === 'pending' || article.status === 'paying_chunks' || article.status === 'committing') {
    return 'amber';
  }
  return 'zinc';
}

export function vblogStatusLabel(article: VBlogArticle): string {
  if (article.status === 'on-chain-ready') return 'Published';
  if (article.status === 'verified') return 'Verified';
  return article.status.replace(/_/g, ' ');
}
