import type { Token } from '@/lib/tokens/types';

export function getAllTokenTags(tokens: Token[]): string[] {
  return Array.from(new Set(tokens.flatMap((token) => token.tags ?? []))).sort((a, b) =>
    a.localeCompare(b),
  );
}

export function matchesTokenTags(token: Token, selectedTags: string[]): boolean {
  if (selectedTags.length === 0) return true;
  return selectedTags.some((tag) => token.tags?.includes(tag));
}
