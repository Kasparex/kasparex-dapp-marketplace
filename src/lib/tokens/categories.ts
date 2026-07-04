import type { Token } from '@/lib/tokens/types';

export const DEFAULT_TOKEN_CATEGORIES = [
  'Infrastructure',
  'DeFi',
  'Gaming',
  'Governance',
  'Meme',
  'Utility',
  'Other',
] as const;

const STORAGE_PREFIX = 'tokens:author-categories:';

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

export function normalizeTokenCategoryName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function validateTokenCategoryName(name: string): { valid: boolean; error?: string } {
  const normalized = normalizeTokenCategoryName(name);
  if (normalized.length < 2) {
    return { valid: false, error: 'Category name must be at least 2 characters' };
  }
  if (normalized.length > 40) {
    return { valid: false, error: 'Category name must be 40 characters or less' };
  }
  return { valid: true };
}

export function getAuthorCustomTokenCategories(authorAddress: string | null | undefined): string[] {
  if (!authorAddress) return [];
  return readStored(authorAddress);
}

export function addAuthorCustomTokenCategory(authorAddress: string, name: string): string {
  const normalized = normalizeTokenCategoryName(name);
  const validation = validateTokenCategoryName(normalized);
  if (!validation.valid) {
    throw new Error(validation.error ?? 'Invalid category name');
  }

  const defaultsLower = DEFAULT_TOKEN_CATEGORIES.map((c) => c.toLowerCase());
  if (defaultsLower.includes(normalized.toLowerCase())) {
    const match = DEFAULT_TOKEN_CATEGORIES.find((c) => c.toLowerCase() === normalized.toLowerCase());
    return match ?? normalized;
  }

  const existing = readStored(authorAddress);
  const existingLower = existing.map((c) => c.toLowerCase());
  if (!existingLower.includes(normalized.toLowerCase())) {
    writeStored(authorAddress, [...existing, normalized].sort((a, b) => a.localeCompare(b)));
  }
  return normalized;
}

export function getTokenCategoryOptionsForAuthor(authorAddress: string | null | undefined): string[] {
  const custom = authorAddress ? getAuthorCustomTokenCategories(authorAddress) : [];
  const merged = [...DEFAULT_TOKEN_CATEGORIES, ...custom];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const cat of merged) {
    const key = cat.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(cat);
  }
  return result.sort((a, b) => {
    const aDefault = DEFAULT_TOKEN_CATEGORIES.some((d) => d.toLowerCase() === a.toLowerCase());
    const bDefault = DEFAULT_TOKEN_CATEGORIES.some((d) => d.toLowerCase() === b.toLowerCase());
    if (aDefault && !bDefault) return -1;
    if (!aDefault && bDefault) return 1;
    return a.localeCompare(b);
  });
}

const REGISTRY_CATEGORY_FALLBACK: Record<string, string> = {
  kas: 'Infrastructure',
  krex: 'Governance',
  grid: 'Utility',
};

export function getTokenCategory(token: Token): string {
  if (token.category?.trim()) return token.category.trim();
  return REGISTRY_CATEGORY_FALLBACK[token.id] ?? (token.type === 'global' ? 'Infrastructure' : 'Other');
}

export function getTokenCategoriesFromTokens(tokens: Token[]): string[] {
  const fromTokens = tokens.map((t) => getTokenCategory(t)).filter(Boolean);
  const seen = new Set<string>();
  const result: string[] = [];

  for (const cat of [...DEFAULT_TOKEN_CATEGORIES, ...fromTokens]) {
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
