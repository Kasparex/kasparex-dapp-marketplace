/**
 * Kasparex vDonations types: campaign metadata (IPFS), on-chain campaign shape.
 */

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
}
