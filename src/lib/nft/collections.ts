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
  /**
   * IPFS URI for trait PNG images
   * Expected structure: {traitImagesBaseUri}/{FolderName}/{TraitValue}.png
   * Example: ipfs://bafybe.../BACKGROUNDS/Aqua_Mint.png
   * 
   * Folder names are uppercase (BACKGROUNDS, BASE, CLOTHING, etc.)
   * File names use underscores instead of spaces (e.g., "Aqua_Mint.png", "Byte_Moss.png")
   * Special characters are also converted to underscores
   * The code automatically maps trait types from metadata to folder names and normalizes file names
   * 
   * Note: Folder structure should be clean - trait folders directly under the CID root
   */
  traitImagesBaseUri?: string;
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
    traitImagesBaseUri: 'ipfs://bafybeig37ikaze6v5rdbjayj6nnztgcbfgeaijh4wbrztcwdbutjl4ihzm',
  },
};

/**
 * Get collection by slug
 */
export function getCollectionBySlug(slug: string): CollectionConfig | undefined {
  return Object.values(collections).find((collection) => collection.slug.toLowerCase() === slug.toLowerCase());
}

/**
 * Get collection by ID
 */
export function getCollectionById(id: string): CollectionConfig | undefined {
  return collections[id];
}

/**
 * Get all collection slugs
 */
export function getAllCollectionSlugs(): string[] {
  return Object.values(collections).map((collection) => collection.slug);
}

/**
 * Check if a collection exists
 */
export function isValidCollection(slug: string): boolean {
  return Object.values(collections).some((collection) => collection.slug.toLowerCase() === slug.toLowerCase());
}

