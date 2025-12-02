import { VBlogArticle } from './types';

/**
 * Generate a URL-friendly slug from a title
 */
export function generateArticleSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .substring(0, 100); // Limit length
}

/**
 * Format wallet address for display (shortened)
 */
export function formatAddress(address: string): string {
  if (!address) return '';
  // Remove prefixes if present
  const cleanAddress = address.replace(/^(evm:|kaspa:)/, '');
  if (cleanAddress.length <= 5) return cleanAddress;
  // Show last 5 digits for profile display
  return cleanAddress.slice(-5);
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format date and time for display
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Generate a mock CID (IPFS-style)
 */
export function generateMockCID(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let cid = 'Qm';
  for (let i = 0; i < 42; i++) {
    cid += chars[Math.floor(Math.random() * chars.length)];
  }
  return cid;
}

/**
 * Generate a mock transaction hash
 */
export function generateMockTxHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

/**
 * Generate a mock article ID
 */
export function generateMockArticleId(): string {
  return `ART-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Truncate text to a specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Extract excerpt from article content
 */
export function getArticleExcerpt(article: VBlogArticle, maxLength: number = 150): string {
  if (article.description) {
    return truncateText(article.description, maxLength);
  }
  return truncateText(article.content, maxLength);
}

