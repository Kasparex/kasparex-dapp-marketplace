/**
 * Mock listing data for development and testing
 */

import { Listing, ListingCategory } from './types';

export const mockListings: Listing[] = [
  {
    id: 'mock-tx-001',
    ipfsCid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
    name: 'Kaspa Wallet',
    description: 'A secure and user-friendly wallet for the Kaspa blockchain. Send, receive, and manage your KAS with ease.',
    category: ListingCategory.TOKENS,
    tags: ['wallet', 'defi', 'security'],
    ownerWallet: 'kaspa:qqd36zqt94yr23cmjj73d34e2lc05ltd9duw582s303m30ux567ps9ljnhp6y',
    timestamp: Date.now() - 86400000 * 5, // 5 days ago
    links: {
      website: 'https://kaspa-wallet.example.com',
      twitter: 'https://twitter.com/kaspawallet',
      github: 'https://github.com/kaspawallet',
    },
    images: {
      logoCid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
      bannerCid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
    },
    status: 'active',
  },
  {
    id: 'mock-tx-002',
    ipfsCid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
    name: 'Kaspa Explorer',
    description: 'Block explorer for the Kaspa network. View transactions, blocks, addresses, and network statistics.',
    category: ListingCategory.TOOLS,
    tags: ['explorer', 'analytics', 'blockchain'],
    ownerWallet: 'kaspa:qqd36zqt94yr23cmjj73d34e2lc05ltd9duw582s303m30ux567ps9ljnhp6y',
    timestamp: Date.now() - 86400000 * 3, // 3 days ago
    links: {
      website: 'https://kaspa-explorer.example.com',
      github: 'https://github.com/kaspa-explorer',
    },
    images: {
      logoCid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
    },
    status: 'active',
  },
  {
    id: 'mock-tx-003',
    ipfsCid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
    name: 'KREX NFT Marketplace',
    description: 'Trade and discover NFTs on the Kaspa ecosystem. Browse collections, check rarity, and build your portfolio.',
    category: ListingCategory.NFTS,
    tags: ['nft', 'marketplace', 'trading'],
    ownerWallet: 'kaspa:qqd36zqt94yr23cmjj73d34e2lc05ltd9duw582s303m30ux567ps9ljnhp6y',
    timestamp: Date.now() - 86400000 * 7, // 7 days ago
    links: {
      website: 'https://krex-nft.example.com',
      twitter: 'https://twitter.com/krexnft',
      discord: 'https://discord.gg/krexnft',
    },
    images: {
      logoCid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
      bannerCid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
    },
    status: 'active',
  },
  {
    id: 'mock-tx-004',
    ipfsCid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
    name: 'Kaspa DeFi Swap',
    description: 'Decentralized exchange for swapping tokens on Kaspa. Low fees, high liquidity, and secure transactions.',
    category: ListingCategory.DEFI,
    tags: ['defi', 'swap', 'dex', 'trading'],
    ownerWallet: 'kaspa:qqd36zqt94yr23cmjj73d34e2lc05ltd9duw582s303m30ux567ps9ljnhp6y',
    timestamp: Date.now() - 86400000 * 2, // 2 days ago
    links: {
      website: 'https://kaspa-swap.example.com',
      twitter: 'https://twitter.com/kaspaswap',
    },
    images: {
      logoCid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
    },
    status: 'active',
  },
  {
    id: 'mock-tx-005',
    ipfsCid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
    name: 'Kaspa Node Manager',
    description: 'Easy-to-use tool for running and managing Kaspa nodes. Monitor performance, configure settings, and earn rewards.',
    category: ListingCategory.INFRASTRUCTURE,
    tags: ['node', 'infrastructure', 'staking'],
    ownerWallet: 'kaspa:qqd36zqt94yr23cmjj73d34e2lc05ltd9duw582s303m30ux567ps9ljnhp6y',
    timestamp: Date.now() - 86400000 * 10, // 10 days ago
    links: {
      website: 'https://kaspa-node.example.com',
      github: 'https://github.com/kaspa-node',
    },
    images: {
      logoCid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
    },
    status: 'active',
  },
  {
    id: 'mock-tx-006',
    ipfsCid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
    name: 'Kaspa Game Hub',
    description: 'Play-to-earn games built on Kaspa. Collect NFTs, compete with friends, and earn rewards.',
    category: ListingCategory.GAMES,
    tags: ['game', 'nft', 'play-to-earn'],
    ownerWallet: 'kaspa:qqd36zqt94yr23cmjj73d34e2lc05ltd9duw582s303m30ux567ps9ljnhp6y',
    timestamp: Date.now() - 86400000 * 1, // 1 day ago
    links: {
      website: 'https://kaspa-games.example.com',
      twitter: 'https://twitter.com/kaspagames',
      discord: 'https://discord.gg/kaspagames',
    },
    images: {
      logoCid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
      bannerCid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
    },
    status: 'active',
  },
  {
    id: 'mock-tx-007',
    ipfsCid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
    name: 'Kaspa Media Studio',
    description: 'Create and share media content on the Kaspa blockchain. Upload videos, images, and music with IPFS storage.',
    category: ListingCategory.MEDIA,
    tags: ['media', 'content', 'ipfs'],
    ownerWallet: 'kaspa:qqd36zqt94yr23cmjj73d34e2lc05ltd9duw582s303m30ux567ps9ljnhp6y',
    timestamp: Date.now() - 86400000 * 4, // 4 days ago
    links: {
      website: 'https://kaspa-media.example.com',
      twitter: 'https://twitter.com/kaspamedia',
    },
    images: {
      logoCid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
    },
    status: 'active',
  },
  {
    id: 'mock-tx-008',
    ipfsCid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
    name: 'Kaspa Bridge',
    description: 'Bridge assets between Kaspa and other blockchains. Secure cross-chain transfers with low fees.',
    category: ListingCategory.DEFI,
    tags: ['bridge', 'defi', 'cross-chain'],
    ownerWallet: 'kaspa:qqd36zqt94yr23cmjj73d34e2lc05ltd9duw582s303m30ux567ps9ljnhp6y',
    timestamp: Date.now() - 86400000 * 6, // 6 days ago
    links: {
      website: 'https://kaspa-bridge.example.com',
      github: 'https://github.com/kaspa-bridge',
    },
    images: {
      logoCid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
    },
    status: 'active',
  },
  {
    id: 'mock-tx-009',
    ipfsCid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
    name: 'Kaspa Analytics Dashboard',
    description: 'Comprehensive analytics platform for Kaspa network. Track transactions, monitor network health, and analyze trends.',
    category: ListingCategory.TOOLS,
    tags: ['analytics', 'dashboard', 'tools'],
    ownerWallet: 'kaspa:qqd36zqt94yr23cmjj73d34e2lc05ltd9duw582s303m30ux567ps9ljnhp6y',
    timestamp: Date.now() - 86400000 * 8, // 8 days ago
    links: {
      website: 'https://kaspa-analytics.example.com',
      github: 'https://github.com/kaspa-analytics',
    },
    images: {
      logoCid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
    },
    status: 'active',
  },
  {
    id: 'mock-tx-010',
    ipfsCid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
    name: 'Kaspa SDK',
    description: 'Software development kit for building on Kaspa. Easy integration, comprehensive documentation, and examples.',
    category: ListingCategory.TOOLS,
    tags: ['sdk', 'api', 'developer', 'tools'],
    ownerWallet: 'kaspa:qqd36zqt94yr23cmjj73d34e2lc05ltd9duw582s303m30ux567ps9ljnhp6y',
    timestamp: Date.now() - 86400000 * 9, // 9 days ago
    links: {
      website: 'https://kaspa-sdk.example.com',
      github: 'https://github.com/kaspa-sdk',
      discord: 'https://discord.gg/kaspasdk',
    },
    images: {
      logoCid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
    },
    status: 'active',
  },
];

