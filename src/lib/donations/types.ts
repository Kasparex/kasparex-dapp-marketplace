/**
 * Kasparex vDonations types: campaign metadata (IPFS), on-chain campaign shape.
 */

import type { CrowdKasModulesConfig } from '@/lib/donations/crowdkasModules';

/** Campaign metadata stored on IPFS (JSON) */
export interface DonationCampaignMetadata {
  title: string;
  description: string;
  /** Curated category label (optional). */
  category?: string;
  /** Freeform tags (optional). Stored normalized (lowercase/trimmed) by the editor. */
  tags?: string[];
  goals?: string[];
  socialLinks?: {
    twitter?: string;
    discord?: string;
    website?: string;
    [key: string]: string | undefined;
  };
  l1KaspaAddress?: string; // optional duplicate; contract also stores l1Address
  /** IPFS CID of cover image (preferred for permanence). */
  imageHash?: string;
  /** Direct image URL (http/https). */
  imageUrl?: string;
  /**
   * Optional perk for donors who use the paid L1 tip module (does not count toward L2 goal).
   * Shown after the donor chooses to reveal (honor system; not cryptographic DRM).
   */
  l1TipGift?: {
    enabled: boolean;
    type?: 'text' | 'url' | 'ipfs';
    /** Display title, e.g. "Wallpaper pack" */
    label?: string;
    /** Plain text, https URL, or IPFS CID */
    value?: string;
  };
  /** Free and paid module toggles stored in campaign metadata. */
  modules?: CrowdKasModulesConfig;
}

/** On-chain campaign (from contract campaigns(creator)) */
export interface DonationCampaignOnChain {
  creator: `0x${string}`;
  targetWei: bigint;
  deadline: bigint;
  raisedWei: bigint;
  donorCount: bigint;
  ipfsHash: string;
  l1Address: string;
  active: boolean;
}

/** Combined campaign for UI: on-chain + IPFS metadata */
export interface DonationCampaign {
  creatorAddress: `0x${string}`;
  /** When set, L2 donations use DonationEscrowV2.donate(campaignId). */
  campaignIdV2?: bigint;
  /** V2 only: escrow vs L1-direct (from on-chain campaign method). */
  methodV2?: 'L2_ESCROW' | 'L1_DIRECT';
  targetWei: bigint;
  deadline: bigint;
  raisedWei: bigint;
  donorCount: bigint;
  /** L1 KAS donations recorded via recordL1Donation (not in L2 escrow). */
  l1RecordedTotalWei?: bigint;
  l1RecordedDonationCount?: bigint;
  ipfsHash: string;
  l1Address: string;
  active: boolean;
  verified: boolean;
  metadata: DonationCampaignMetadata | null;
  /** V2: paid modules unlocked on DonationEscrowV2 (read from chain). */
  modulesUnlocked?: { featured: boolean; l1Tips: boolean };
}
