import type { ParsedNFTMetadata } from '@/lib/nft/metadata';

/** Optional inputs for Minecore math when client has loaded NFT metadata (e.g. PIXELKREX / KREXPRIME diamond traits). */
export type MinecoreComputeContext = {
  /** Keyed by Workers-tab deck index (`state.nftSlots` index), not NFT id. */
  nftMetadataByDeckIndex?: Readonly<Record<number, ParsedNFTMetadata | null | undefined>>;
};
