import { VBlogArticle } from './types';
import { htmlToPlainText } from '@/lib/richText/html';

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
    return truncateText(htmlToPlainText(article.description), maxLength);
  }
  return truncateText(htmlToPlainText(article.content), maxLength);
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
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')

    // Colored text
    .replace(/\{color:([^}]+)\}(.*?)\{\/color\}/g, '<span style="color:$1">$2</span>')

    // Bold & Italic
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>')

    // Blockquotes
    .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')

    // Links
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

    // Horizontal rule
    .replace(/^\s*[-*_]{3,}\s*$/gm, '<hr />')

    // Lists
    .replace(/^\s*[\-\*] (.*$)/gim, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gms, '<ul>$1</ul>')

    // Line breaks / Paragraphs
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br />');

  return `<p>${html}</p>`;
}
