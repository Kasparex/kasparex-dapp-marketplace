import type { CovenantUtxoRef } from './types';

export type CrowdfundStatus = 'funding' | 'succeeded' | 'failed';

/** Kickstarter / Patreon-style pledge tier. */
export interface CrowdfundTier {
  id: string;
  title: string;
  description: string;
  /** Minimum pledge in KAS to unlock this tier. */
  minKas: number;
  /** Reward / perk copy shown to backers. */
  reward?: string;
  /** Optional max number of backers for this tier. */
  limitedQty?: number;
  /** How many active pledges selected this tier. */
  claimedCount?: number;
}

export interface CrowdfundFaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface CrowdfundUpdate {
  id: string;
  title: string;
  body: string;
  createdAt: number;
}

export interface CrowdfundPledge {
  id: string;
  backer: string;
  amountSompi: string;
  txHash?: string;
  /** Platform fee payment tx (multi-out / fee leg). */
  feeTxHash?: string;
  platformFeeKas?: number;
  tierId?: string;
  refunded: boolean;
  createdAt: number;
  covenantId?: string;
  claimFeeTxHash?: string;
  utxo?: CovenantUtxoRef;
  origin?: 'l1' | 'simulator';
}

export interface CrowdfundCampaign {
  id: string;
  covenantId: string;
  status: CrowdfundStatus;
  creator: string;
  title: string;
  memo: string;
  /** Longer story body (rich text HTML). */
  mainContent?: string;
  goalSompi: string;
  raisedSompi: string;
  deadline: number;
  pledges: CrowdfundPledge[];
  createdAt: number;
  claimedAt: number | null;
  claimFeeTxHash?: string;
  origin?: 'l1' | 'simulator';
  /** Featured / cover media. */
  imageUrl?: string;
  imageHash?: string;
  category?: string;
  tags?: string[];
  tiers?: CrowdfundTier[];
  faq?: CrowdfundFaqItem[];
  updates?: CrowdfundUpdate[];
  socialLinks?: {
    twitter?: string;
    discord?: string;
    website?: string;
    [key: string]: string | undefined;
  };
  /** Creator-enabled premium tab (unlocked in studio). */
  premiumTabEnabled?: boolean;
  premiumTabTitle?: string;
  premiumTabContent?: string;
}

export interface CreateCrowdfundParams {
  creator: string;
  title: string;
  memo: string;
  goalSompi: string;
  deadline: number;
  mainContent?: string;
  imageUrl?: string;
  imageHash?: string;
  category?: string;
  tags?: string[];
  tiers?: CrowdfundTier[];
  faq?: CrowdfundFaqItem[];
  socialLinks?: CrowdfundCampaign['socialLinks'];
  premiumTabEnabled?: boolean;
  premiumTabTitle?: string;
  premiumTabContent?: string;
}

export interface PledgeParams {
  campaignId: string;
  backer: string;
  amountSompi: string;
  txHash?: string;
  tierId?: string;
  feeTxHash?: string;
  platformFeeKas?: number;
}

export type CrowdfundCampaignPatch = {
  title?: string;
  memo?: string;
  mainContent?: string;
  imageUrl?: string;
  imageHash?: string;
  category?: string;
  tags?: string[];
  tiers?: CrowdfundTier[];
  faq?: CrowdfundFaqItem[];
  updates?: CrowdfundUpdate[];
  socialLinks?: CrowdfundCampaign['socialLinks'];
  premiumTabEnabled?: boolean;
  premiumTabTitle?: string;
  premiumTabContent?: string;
};
