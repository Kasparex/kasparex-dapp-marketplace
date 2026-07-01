import type { VBlogSocialLink } from '@/lib/vblog/types';

export type VBlogSocialLinkRow = { label: string; url: string };

export function vBlogSocialLinksToRows(links?: VBlogSocialLink[] | string[]): VBlogSocialLinkRow[] {
  if (!links?.length) return [{ label: '', url: '' }];
  return links.map((entry) => {
    if (typeof entry === 'string') return { label: '', url: entry };
    return { label: entry.label ?? '', url: entry.url ?? '' };
  });
}

export const VBLOG_SOCIAL_LABEL_MAX = 20;

export function cleanVBlogSocialLinks(rows: VBlogSocialLinkRow[], max = 5): VBlogSocialLink[] {
  return rows
    .map((row) => ({
      label: row.label.trim().slice(0, VBLOG_SOCIAL_LABEL_MAX) || undefined,
      url: row.url.trim(),
    }))
    .filter((row) => row.url)
    .slice(0, max);
}

export function vBlogSocialLinkUrl(link: VBlogSocialLink | string): string {
  return typeof link === 'string' ? link : link.url;
}

export function normalizeVBlogSocialLinks(raw: unknown): VBlogSocialLink[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry): VBlogSocialLink | null => {
      if (typeof entry === 'string') {
        const url = entry.trim();
        return url ? { url } : null;
      }
      if (entry && typeof entry === 'object' && 'url' in entry) {
        const o = entry as { label?: string; url?: string };
        const url = String(o.url ?? '').trim();
        if (!url) return null;
        const label = String(o.label ?? '').trim().slice(0, VBLOG_SOCIAL_LABEL_MAX);
        return label ? { label, url } : { url };
      }
      return null;
    })
    .filter((x): x is VBlogSocialLink => x != null);
}

export function socialLinksForPricingPayload(links?: VBlogSocialLink[]): unknown[] {
  return (links ?? []).map((link) => {
    const url = link.url.trim();
    if (!url) return null;
    const label = (link.label ?? '').trim().slice(0, VBLOG_SOCIAL_LABEL_MAX);
    return label ? { label, url } : { url };
  }).filter(Boolean);
}
