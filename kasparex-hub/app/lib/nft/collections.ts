/**
 * NFT Collection Configuration
 * Defines metadata for supported NFT collections
 */

export interface CollectionConfig {
  id: string;
  name: string;
  slug: string;
  deployer: string;
  baseUri: string;
  kaspaComUrl: string;
  description?: string;
}

export const collections: Record<string, CollectionConfig> = {
  KREXPRIME: {
    id: 'KREXPRIME',
    name: 'KREXPRIME',
    slug: 'KREXPRIME',
    deployer: 'kaspa:qzeegrxt993rkwkupx0u8yd8sz94atpeg4e7x8yrjav8x7wgulxszc8svhenj',
    baseUri: 'ipfs://bafybeiaeazylbtfb5drled7wtiib53llv25f5obovugjbccuw23ot6wneq',
    kaspaComUrl: 'https://www.kaspa.com/nft/collections/KREXPRIME',
    description: 'KREXPRIME NFT collection',
  },
  PIXELKREX: {
    id: 'PIXELKREX',
    name: 'PIXELKREX',
    slug: 'PIXELKREX',
    deployer: 'kaspa:qzeegrxt993rkwkupx0u8yd8sz94atpeg4e7x8yrjav8x7wgulxszc8svhenj',
    baseUri: 'ipfs://bafybeiakbvm7hn6ev23tiorgdxh3hcjkuu7huxdijklybastzmceclycnu',
    kaspaComUrl: 'https://kaspa.com/nft/collections/PIXELKREX',
    description: 'PIXELKREX NFT collection',
  },
};

export function getCollectionById(id: string): CollectionConfig | undefined {
  return collections[id];
}
