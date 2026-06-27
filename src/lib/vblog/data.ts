'use client';

import { VBlogArticle, VBlogComment } from './types';
import { generateArticleSlug, generateMockCID, generateMockTxHash, generateMockArticleId } from './utils';

const STORAGE_KEYS = {
  articles: 'vblog_articles',
  comments: 'vblog_comments',
} as const;

function canonicalizeAuthorKey(input: string): string {
  const raw = String(input || '').trim().toLowerCase();
  if (!raw) return raw;
  if (raw.endsWith('.kas')) return raw;
  if (raw.startsWith('kaspa:')) return raw;
  // Best-effort: many Kaspa addresses are shared without the prefix.
  if (/^q[a-z0-9]{30,}$/i.test(raw)) return `kaspa:${raw}`;
  return raw;
}

/**
 * Get all articles from storage
 */
export function getAllArticles(): VBlogArticle[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.articles);
    if (!stored) return getDefaultArticles();
    const parsed = JSON.parse(stored) as unknown;
    // Backward compatibility: accept multiple persisted shapes.
    if (Array.isArray(parsed)) {
      return parsed.length === 0 ? getDefaultArticles() : (parsed as VBlogArticle[]);
    }
    if (parsed && typeof parsed === 'object') {
      const anyParsed = parsed as any;
      if (Array.isArray(anyParsed.articles)) {
        return anyParsed.articles.length === 0 ? getDefaultArticles() : (anyParsed.articles as VBlogArticle[]);
      }
      if (Array.isArray(anyParsed.items)) {
        return anyParsed.items.length === 0 ? getDefaultArticles() : (anyParsed.items as VBlogArticle[]);
      }
      // Map/object keyed by id → array.
      const values = Object.values(anyParsed);
      const asArticles = values.filter((v) => v && typeof v === 'object' && 'title' in (v as any) && 'author' in (v as any)) as VBlogArticle[];
      if (asArticles.length > 0) return asArticles;
    }
    return getDefaultArticles();
  } catch (error) {
    console.error('Error loading articles:', error);
    return getDefaultArticles();
  }
}

/**
 * Get article by slug
 */
export function getArticleBySlug(slug: string): VBlogArticle | null {
  const articles = getAllArticles();
  return articles.find(article => article.slug === slug) || null;
}

/**
 * Get articles by author (wallet address)
 */
export function getArticlesByAuthor(authorAddress: string): VBlogArticle[] {
  const articles = getAllArticles();
  const key = canonicalizeAuthorKey(authorAddress);
  return articles.filter((article) => canonicalizeAuthorKey(article.author) === key);
}

/**
 * Create a new article
 */
export function createArticle(
  articleData: Omit<VBlogArticle, 'id' | 'slug' | 'publishDate' | 'cid' | 'articleId' | 'txHash' | 'status'>,
  metadata?: Partial<Pick<VBlogArticle, 'cid' | 'articleId' | 'txHash' | 'status' | 'chunkTxHashes' | 'commitTxHash' | 'contentHash' | 'pricingSnapshot'>>
): VBlogArticle {
  const articles = getAllArticles();
  
  const newArticle: VBlogArticle = {
    ...articleData,
    author: canonicalizeAuthorKey(articleData.author),
    id: `article-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    slug: generateArticleSlug(articleData.title),
    publishDate: new Date().toISOString(),
    cid: metadata?.cid ?? generateMockCID(),
    articleId: metadata?.articleId ?? generateMockArticleId(),
    txHash: metadata?.txHash ?? generateMockTxHash(),
    status: metadata?.status ?? 'on-chain-ready',
    chunkTxHashes: metadata?.chunkTxHashes,
    commitTxHash: metadata?.commitTxHash,
    contentHash: metadata?.contentHash,
    pricingSnapshot: metadata?.pricingSnapshot,
  };

  articles.unshift(newArticle); // Add to beginning
  saveArticles(articles);
  
  return newArticle;
}

/**
 * Update an existing article
 */
export function updateArticle(
  articleId: string,
  updates: Partial<Omit<VBlogArticle, 'id' | 'author' | 'publishDate'>>,
  metadata?: Partial<
    Pick<
      VBlogArticle,
      | 'txHash'
      | 'status'
      | 'chunkTxHashes'
      | 'commitTxHash'
      | 'contentHash'
      | 'pricingSnapshot'
      | 'articleId'
    >
  >
): VBlogArticle | null {
  const articles = getAllArticles();
  const index = articles.findIndex(a => a.id === articleId);
  
  if (index === -1) return null;

  const updatedArticle: VBlogArticle = {
    ...articles[index],
    ...updates,
    updatedAt: new Date().toISOString(),
    articleId: metadata?.articleId ?? updates.articleId ?? articles[index].articleId,
    txHash: metadata?.txHash ?? generateMockTxHash(), // New transaction for update
    slug: updates.title ? generateArticleSlug(updates.title) : articles[index].slug,
    status: metadata?.status ?? updates.status ?? articles[index].status,
    chunkTxHashes: metadata?.chunkTxHashes ?? updates.chunkTxHashes ?? articles[index].chunkTxHashes,
    commitTxHash: metadata?.commitTxHash ?? updates.commitTxHash ?? articles[index].commitTxHash,
    contentHash: metadata?.contentHash ?? updates.contentHash ?? articles[index].contentHash,
    pricingSnapshot: metadata?.pricingSnapshot ?? updates.pricingSnapshot ?? articles[index].pricingSnapshot,
  };

  articles[index] = updatedArticle;
  saveArticles(articles);
  
  return updatedArticle;
}

/**
 * Delete an article (for future use)
 */
export function deleteArticle(articleId: string): boolean {
  const articles = getAllArticles();
  const filtered = articles.filter(a => a.id !== articleId);
  
  if (filtered.length === articles.length) return false;
  
  saveArticles(filtered);
  return true;
}

/**
 * Get comments for an article
 */
export function getCommentsForArticle(articleId: string): VBlogComment[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.comments);
    if (!stored) return [];
    const allComments: VBlogComment[] = JSON.parse(stored);
    return allComments
      .filter(comment => comment.articleId === articleId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.error('Error loading comments:', error);
    return [];
  }
}

/**
 * Add a comment to an article
 */
export function addComment(commentData: Omit<VBlogComment, 'id' | 'timestamp'>): VBlogComment {
  if (typeof window === 'undefined') {
    throw new Error('Cannot add comment on server side');
  }

  const newComment: VBlogComment = {
    ...commentData,
    id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
  };

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.comments);
    const allComments: VBlogComment[] = stored ? JSON.parse(stored) : [];
    allComments.push(newComment);
    localStorage.setItem(STORAGE_KEYS.comments, JSON.stringify(allComments));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vblog-comments-updated'));
    }
  } catch (error) {
    console.error('Error saving comment:', error);
    throw error;
  }

  return newComment;
}

/**
 * Save articles to storage
 */
function saveArticles(articles: VBlogArticle[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.articles, JSON.stringify(articles));
  } catch (error) {
    console.error('Error saving articles:', error);
  }
}

/**
 * Get default articles for initial state
 */
function getDefaultArticles(): VBlogArticle[] {
  return [
    {
      id: 'article-1',
      slug: 'welcome-to-kasparex-vblog',
      title: 'Welcome to Kasparex vBlog',
      description: 'An introduction to the on-chain blog system built on Kaspa. Learn how vBlog uses CIDs, KAS fees, and comment credits to create a decentralized content platform.',
      content: `# Welcome to Kasparex vBlog

Kasparex vBlog is an innovative on-chain blog system that combines the power of decentralized storage with BlockDAG transactions. Each article is linked to a Content Identifier (CID) stored on IPFS or similar decentralized storage networks, while the metadata and ownership are recorded on-chain.

## How It Works

- **Content Storage**: Article content is stored off-chain using CIDs, making it verifiable and immutable
- **On-Chain Metadata**: Article IDs, transaction hashes, and author information are stored on-chain
- **KAS Fees**: Creating and updating articles requires KAS payments, ensuring quality and preventing spam
- **Comment Credits**: Users purchase comment credits in batches, creating a sustainable commenting system

## Future Features

vBlog will integrate with other Kasparex dApps, allowing:
- Premium posts unlocked with NFTs or tokens
- Special author features and gated categories
- Reward systems for quality content
- Cross-dApp content sharing

Stay tuned for more updates!`,
      author: 'kaspa:qpxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      publishDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'Introduction',
      tags: ['welcome', 'getting-started', 'on-chain'],
      featuredImage: '/img/dapps/vblog-featured.jpg',
      cid: 'QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      articleId: 'ART-001',
      txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      status: 'on-chain-ready',
    },
    {
      id: 'article-2',
      slug: 'understanding-cids-and-decentralized-storage',
      title: 'Understanding CIDs and Decentralized Storage',
      description: 'Learn about Content Identifiers (CIDs) and how they enable verifiable, decentralized content storage for vBlog articles.',
      content: `# Understanding CIDs and Decentralized Storage

Content Identifiers (CIDs) are the backbone of decentralized storage systems like IPFS. They provide a way to reference content in a verifiable, immutable manner.

## What is a CID?

A CID is a unique identifier that represents the content itself, not its location. This means:
- Content can be stored on multiple nodes
- Content is verifiable - you can check if the content matches the CID
- Content is immutable - changing the content changes the CID

## How vBlog Uses CIDs

In vBlog, each article's content is stored off-chain using a CID. The CID is then referenced on-chain, creating a link between the BlockDAG record and the actual content.

This approach provides:
- Lower on-chain storage costs
- Faster content retrieval
- Verifiable content integrity
- Decentralized content distribution`,
      author: 'kaspa:qpyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy',
      publishDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'Technical',
      tags: ['cid', 'ipfs', 'decentralized-storage', 'technical'],
      featuredImage: '/img/dapps/cid-explained.jpg',
      cid: 'QmYyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy',
      articleId: 'ART-002',
      txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      status: 'on-chain-ready',
    },
  ];
}

