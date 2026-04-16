export type UnifiedProfileMetadata = {
  version: 1;
  updatedAt: number;

  displayName?: string;
  bio?: string;

  /** Direct URL or ipfs://CID */
  avatarUrl?: string;
  bannerUrl?: string;

  website?: string;
  x?: string;
  telegram?: string;
  discord?: string;
  github?: string;
  email?: string;

  /** Canonical Kaspa address (kaspa:..., lowercase) */
  kaspaAddress: string;

  /** Optional preferred primary name */
  preferredKnsName?: string;

  /** Linked EVM wallets (proofs) */
  linkedEvmWallets?: Array<{
    address: `0x${string}`;
    message: string;
    signature: `0x${string}`;
    linkedAt: number;
  }>;
};

