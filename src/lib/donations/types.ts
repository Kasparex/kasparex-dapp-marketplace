/**
 * Kasparex vDonations types: campaign metadata (IPFS), on-chain campaign shape.
 */

/** Campaign metadata stored on IPFS (JSON) */
export interface DonationCampaignMetadata {
  title: string;
  description: string;
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
  targetWei: bigint;
  deadline: bigint;
  raisedWei: bigint;
  donorCount: bigint;
  ipfsHash: string;
  l1Address: string;
  active: boolean;
  verified: boolean;
  metadata: DonationCampaignMetadata | null;
}
