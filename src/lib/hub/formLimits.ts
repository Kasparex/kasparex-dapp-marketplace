/**
 * Shared Hub dashboard form limits (aligned with vBlog Create Article).
 */

export const HUB_FORM_LIMITS = {
  title: { min: 5, max: 100 },
  slug: { min: 2, max: 64 },
  shortDescription: { min: 20, max: 300 },
  content: { min: 100, max: 10000 },
  instructions: { min: 0, max: 2000 },
  tags: { min: 0, max: 120 },
  version: { min: 1, max: 32 },
  url: { min: 0, max: 500 },
  utility: { min: 0, max: 1000 },
  howToUse: { min: 0, max: 2000 },
  name: { min: 3, max: 100 },
} as const;

export function getHubCharacterCount(text: string): number {
  return text.trim().length;
}

export function hubCharCountClass(current: number, max: number): string {
  return current > max
    ? 'text-xs text-red-500'
    : 'text-xs text-zinc-500 dark:text-zinc-400';
}
