import type { VBlogArticle } from '@/lib/vblog/types';

export const DEFAULT_VBLOG_CATEGORIES = [
  'Introduction',
  'Technical',
  'Tutorial',
  'News',
  'Opinion',
  'Review',
  'Other',
] as const;

const STORAGE_PREFIX = 'vblog:author-categories:';

function storageKey(authorAddress: string): string {
  return `${STORAGE_PREFIX}${authorAddress.toLowerCase()}`;
}

function readStored(authorAddress: string): string[] {
  if (typeof window === 'undefined' || !authorAddress) return [];
  try {
    const raw = localStorage.getItem(storageKey(authorAddress));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  } catch {
    return [];
  }
}

function writeStored(authorAddress: string, categories: string[]): void {
  if (typeof window === 'undefined' || !authorAddress) return;
  localStorage.setItem(storageKey(authorAddress), JSON.stringify(categories));
}

export function normalizeCategoryName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function validateCustomCategoryName(name: string): { valid: boolean; error?: string } {
  const normalized = normalizeCategoryName(name);
  if (normalized.length < 2) {
    return { valid: false, error: 'Category name must be at least 2 characters' };
  }
  if (normalized.length > 40) {
    return { valid: false, error: 'Category name must be 40 characters or less' };
  }
  return { valid: true };
}

export function getAuthorCustomCategories(authorAddress: string | null | undefined): string[] {
  if (!authorAddress) return [];
  return readStored(authorAddress);
}

export function addAuthorCustomCategory(authorAddress: string, name: string): string {
  const normalized = normalizeCategoryName(name);
  const validation = validateCustomCategoryName(normalized);
  if (!validation.valid) {
    throw new Error(validation.error ?? 'Invalid category name');
  }

  const defaultsLower = DEFAULT_VBLOG_CATEGORIES.map((c) => c.toLowerCase());
  if (defaultsLower.includes(normalized.toLowerCase())) {
    const match = DEFAULT_VBLOG_CATEGORIES.find((c) => c.toLowerCase() === normalized.toLowerCase());
    return match ?? normalized;
  }

  const existing = readStored(authorAddress);
  const existingLower = existing.map((c) => c.toLowerCase());
  if (!existingLower.includes(normalized.toLowerCase())) {
    writeStored(authorAddress, [...existing, normalized].sort((a, b) => a.localeCompare(b)));
  }
  return normalized;
}

export function getCategoryOptionsForAuthor(authorAddress: string | null | undefined): string[] {
  const custom = authorAddress ? getAuthorCustomCategories(authorAddress) : [];
  const merged = [...DEFAULT_VBLOG_CATEGORIES, ...custom];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const cat of merged) {
    const key = cat.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(cat);
  }
  return result.sort((a, b) => {
    const aDefault = DEFAULT_VBLOG_CATEGORIES.some((d) => d.toLowerCase() === a.toLowerCase());
    const bDefault = DEFAULT_VBLOG_CATEGORIES.some((d) => d.toLowerCase() === b.toLowerCase());
    if (aDefault && !bDefault) return -1;
    if (!aDefault && bDefault) return 1;
    return a.localeCompare(b);
  });
}

/** Sidebar / filter list: defaults, article categories, and stored author customs. */
export function getVBlogCategoriesFromArticles(articles: VBlogArticle[]): string[] {
  const fromArticles = articles.map((a) => a.category).filter(Boolean);
  const seen = new Set<string>();
  const result: string[] = [];

  for (const cat of [...DEFAULT_VBLOG_CATEGORIES, ...fromArticles]) {
    const key = cat.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(cat);
  }

  if (typeof window !== 'undefined') {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(STORAGE_PREFIX)) continue;
      try {
        const stored = JSON.parse(localStorage.getItem(key) ?? '[]') as unknown;
        if (!Array.isArray(stored)) continue;
        for (const cat of stored) {
          if (typeof cat !== 'string') continue;
          const normKey = cat.toLowerCase();
          if (seen.has(normKey)) continue;
          seen.add(normKey);
          result.push(cat);
        }
      } catch {
        /* skip */
      }
    }
  }

  return result.sort((a, b) => a.localeCompare(b));
}

export function isCustomCategory(category: string): boolean {
  return !DEFAULT_VBLOG_CATEGORIES.some((d) => d.toLowerCase() === category.toLowerCase());
}
