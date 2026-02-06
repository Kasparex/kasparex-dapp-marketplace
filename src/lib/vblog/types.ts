export interface VBlogArticle {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  author: string; // Wallet address
  publishDate: string; // ISO date string
  category: string;
  tags: string[];
  featuredImage?: string; // URL or CID
  cid?: string; // Content CID for decentralized storage
  articleId?: string; // On-chain article ID
  txHash?: string; // Transaction hash for article creation/update
  status: 'draft' | 'published' | 'on-chain-ready';
  updatedAt?: string; // ISO date string for last update
  linkedMagazineId?: string; // ID of the magazine this article is linked to
  linkedIssueNumber?: number; // Issue number within the magazine
}

export interface VBlogComment {
  id: string;
  articleId: string;
  author: string; // Wallet address
  content: string;
  timestamp: string; // ISO date string
}

export interface CommentCredits {
  walletAddress: string;
  creditsRemaining: number;
  totalPurchased: number;
  lastPurchaseDate?: string;
  lastTransactionHash?: string;
}

export interface KASFeeInfo {
  amount: number;
  action: 'create' | 'update' | 'comment';
  description: string;
}

