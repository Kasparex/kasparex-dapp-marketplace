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

/**
 * Simple Markdown parser for article content
 * Converts basic markdown to HTML
 */
export function parseMarkdown(markdown: string): string {
  if (!markdown) return '';

  let html = markdown
    // Sanitize basic tags
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

    // Headers
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-6 mb-3">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-4 mb-2">$1</h3>')

    // Bold & Italic
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>')

    // Blockquotes
    .replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-zinc-300 dark:border-zinc-700 pl-4 py-2 italic my-4 text-zinc-600 dark:text-zinc-400">$1</blockquote>')

    // Links
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-[#02abb8] hover:underline" target="_blank">$1</a>')

    // Horizontal rule
    .replace(/^\s*[-*_]{3,}\s*$/gm, '<hr class="my-8 border-zinc-200 dark:border-zinc-800" />')

    // Lists
    .replace(/^\s*[\-\*] (.*$)/gim, '<li class="ml-4">$1</li>')
    .replace(/(<li.*<\/li>)/gms, '<ul class="list-disc space-y-2 my-4">$1</ul>')

    // Line breaks / Paragraphs
    .replace(/\n\n/g, '</p><p class="mb-4">')
    .replace(/\n/g, '<br />');

  return `<p class="mb-4">${html}</p>`;
}
