import { DApp } from './dapps';

/**
 * Converts a string to a URL-friendly slug
 * Example: "Subscription Checker" → "subscription-checker"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generates a slug from a dApp name
 */
export function generateDAppSlug(dappName: string): string {
  return slugify(dappName);
}

/**
 * Finds a dApp by its slug
 */
export function getDAppBySlug(
  dapps: DApp[],
  slug: string
): DApp | undefined {
  return dapps.find((dapp) => {
    const dappSlug = dapp.slug || generateDAppSlug(dapp.name);
    return dappSlug === slug;
  });
}

