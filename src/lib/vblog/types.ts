export type VBlogModuleId =
  | 'premium_section'
  | 'tip_box'
  | 'tip_to_reveal'
  | 'premium_poll'
  | 'reading_receipts_badges'
  | 'magazine_integration';

export interface VBlogTipBoxConfig {
  presets: number[];
  allowCustom: boolean;
}

export interface VBlogPremiumPollConfig {
  question: string;
  options: string[];
}

export interface VBlogModulesConfig {
  premiumSectionEnabled?: boolean;
  premiumSectionContent?: string;
  premiumSectionPriceKas?: number;
  premiumSectionPayoutAddress?: string;
  /** Optional additional payout wallets (max 3 total with primary). Covenant routing later. */
  premiumSectionSplitAddresses?: string[];
  tipBoxEnabled?: boolean;
  tipBox?: VBlogTipBoxConfig;
  tipToRevealEnabled?: boolean;
  tipToRevealContent?: string;
  tipToRevealThresholdKas?: number;
  premiumPollEnabled?: boolean;
  premiumPoll?: VBlogPremiumPollConfig;
  readingReceiptsEnabled?: boolean;
}

export interface VBlogSocialLink {
  label?: string;
  url: string;
}

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
  status:
    | 'draft'
    | 'published'
    | 'on-chain-ready'
    | 'pending'
    | 'paying_chunks'
    | 'committing'
    | 'verifying'
    | 'verified'
    | 'verification_pending';
  updatedAt?: string; // ISO date string for last update
  linkedMagazineId?: string; // ID of the magazine this article is linked to
  linkedIssueNumber?: number; // Issue number within the magazine
  /** Curated Kasparex content vs community submissions (inferred when omitted). */
  source?: 'kasparex' | 'community';
  chunkTxHashes?: string[];
  commitTxHash?: string;
  contentHash?: string;
  pricingSnapshot?: {
    payloadBytes: number;
    chunkCount: number;
    baseFeeKas: number;
    sizeFeeKas: number;
    networkFeeBufferKas: number;
    totalKas: number;
  };
  primaryLink?: string;
  socialLinks?: VBlogSocialLink[];
  modules?: VBlogModulesConfig;
  /** Module IDs paid/unlocked for this article (not shared across articles). */
  paidModuleIds?: VBlogModuleId[];
  /** Author layout preferences for article readers. */
  layoutPreferences?: {
    sidebarShownByDefault?: boolean;
    rightPanelShownByDefault?: boolean;
  };
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
  payloadBytes?: number;
  chunkCount?: number;
  baseFeeKas?: number;
  sizeFeeKas?: number;
  networkFeeBufferKas?: number;
  totalKas?: number;
}

