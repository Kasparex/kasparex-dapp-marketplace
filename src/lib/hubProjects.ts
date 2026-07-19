export type ProjectStatus = 'available' | 'demo' | 'beta' | 'coming-soon';

export interface HubProject {
  id: string;
  name: string;
  category: string;
  description: string;
  route: string;
  status: ProjectStatus;
  /** 16:9 featured image for Hub project cards */
  featuredImage: string;
}

export const hubProjects: HubProject[] = [
  {
    id: 'kasparex-dapps',
    name: 'Kasparex dApps',
    category: 'Utility',
    description: 'Explore modular dApps, dashboards and tools built on Kaspa. Discover a growing ecosystem of decentralized applications.',
    route: '/dapps',
    status: 'beta',
    featuredImage: 'https://static.wixstatic.com/media/de4185_10aca158d3374210a9046d52bd16c416~mv2.png',
  },
  {
    id: 'kasparex-vblog',
    name: 'Kasparex vBlog',
    category: 'Publishing',
    description: 'An on-chain blog system where authors publish articles stored via CIDs or IPFS-like storage. Decentralized content creation.',
    route: '/vblog',
    status: 'beta',
    featuredImage: 'https://static.wixstatic.com/media/de4185_30d239317b2a4415b5eda1c8c9f2b9e3~mv2.png',
  },
  {
    id: 'kasparex-donations',
    name: 'Kasparex vDonate',
    category: 'Creator Tools',
    description: 'One hub for crowdfunding: L2 escrow on Igra, Kaspa L1 tips, and L1 covenant goal raises with the same campaign layout.',
    route: '/donations',
    status: 'beta',
    featuredImage: 'https://static.wixstatic.com/media/de4185_7f5a077a013b4306aae564c85ac0d789~mv2.png',
  },
  {
    id: 'kasparex-tokens',
    name: 'Kasparex Tokens',
    category: 'Finance',
    description:
      'Utility-as-a-Service for token projects. Launch landing pages, verify ownership, and connect real Hub utility for your community.',
    route: '/tokens',
    status: 'beta',
    featuredImage: 'https://static.wixstatic.com/media/de4185_34d7b59496c44a71a3d48814b8bc3632~mv2.png',
  },
  {
    id: 'kasparex-games',
    name: 'Kasparex Games',
    category: 'Entertainment',
    description: 'Simple web3 mini games and interactive experiences with rewards. Play, earn, and have fun in the Kasparex ecosystem.',
    route: '/games',
    status: 'beta',
    featuredImage: 'https://static.wixstatic.com/media/de4185_90a1f2f9abd84617a646c914c657d755~mv2.png',
  },
  {
    id: 'kasparex-store',
    name: 'Kasparex Store',
    category: 'Marketplace',
    description: 'Digital products marketplace powered by KAS. Buy and sell software, art, music, templates, and more with IPFS storage.',
    route: '/store',
    status: 'beta',
    featuredImage: 'https://static.wixstatic.com/media/de4185_69f51a43d6184b31816fc796bfcde8fc~mv2.png',
  },
  {
    id: 'kasparex-nft-tools',
    name: 'Kasparex NFT Tools',
    category: 'NFTs',
    description: 'Rarity checker, trait analysis, and PFP builder for KREXPRIME and PIXELKREX collections.',
    route: '/nft',
    status: 'beta',
    featuredImage: 'https://static.wixstatic.com/media/de4185_2f09c2871e7d48a4af4cb21b97078f6a~mv2.png',
  },
  {
    id: 'kasparex-protocols',
    name: 'Kasparex Protocols',
    category: 'Standards',
    description:
      'Open protocols, tools, documentation, and reference implementations for identity, publishing, and cross-chain workflows on Kaspa - aligned with Kasparex indexers.',
    route: '/protocols',
    status: 'beta',
    featuredImage: 'https://static.wixstatic.com/media/de4185_d9b81f6766ea449f8ea07f916af14d67~mv2.png',
  },
  {
    id: 'kasparex-magazines',
    name: 'Kasparex Magazines',
    category: 'Publishing',
    description: 'Digital magazines and curated issues from creators and the community. Discover curated content and stories.',
    route: '/magazines',
    status: 'beta',
    featuredImage: 'https://static.wixstatic.com/media/de4185_b5197d61c2e24a50b2046de2c05c82a4~mv2.png',
  },
  {
    id: 'krex-chronicles',
    name: "Krex's Chronicles",
    category: 'Publishing',
    description:
      'Central lore hub for Kaspaland: chapters, characters, locations, and tech; wiki and CMS-ready, built for future tokens and cross-links to games like Diamond Veins.',
    route: '/chronicles/chapters',
    status: 'beta',
    featuredImage: 'https://static.wixstatic.com/media/de4185_32f7b1d756b7477da4ed237d62a37eb4~mv2.png',
  },
  {
    id: 'kasparex-studio',
    name: 'Profile Hub',
    category: 'Creator Tools',
    description: 'Unified creator workspace for dashboards, editors, dApp listings, ads, and assets tied to your Kaspa + KNS identity.',
    route: '/u',
    status: 'beta',
    featuredImage: 'https://static.wixstatic.com/media/de4185_2e362c2a4c2c49438e86c780208ba949~mv2.png',
  },
  {
    id: 'kasparex-defi',
    name: 'Kasparex DeFi',
    category: 'Finance',
    description: 'DeFi hub for Kaspa. Swap tokens, provide liquidity, and manage your DeFi portfolio with professional tools.',
    route: '/defi/swaps',
    status: 'beta',
    featuredImage: 'https://static.wixstatic.com/media/de4185_7877148dc28149f4b890fe3989d6a9d9~mv2.png',
  },
  {
    id: 'kasparex-records',
    name: 'Kasparex Records',
    category: 'Media',
    description: 'Music and video songs around Kaspa and the ecosystem. Discover and support creators in the Kasparex community.',
    route: '/hub/coming-soon',
    status: 'coming-soon',
    featuredImage: 'https://static.wixstatic.com/media/de4185_4c677bf7c5b44b96b193d29d402bee2c~mv2.png',
  },
  {
    id: 'kasparex-movies',
    name: 'Kasparex Movies',
    category: 'Media',
    description: 'Cinematic content, animated shorts and lore-based videos expanding the Krex universe. Immerse yourself in the story.',
    route: '/hub/coming-soon',
    status: 'coming-soon',
    featuredImage: 'https://static.wixstatic.com/media/de4185_3a3b421c8b764ecdba93b95753e94471~mv2.png',
  },
  {
    id: 'krex-nodes',
    name: 'Kasparex Nodes',
    category: 'Infrastructure',
    description: 'User-run nodes that support the Kasparex ecosystem and optionally earn rewards. Help power the network.',
    route: '/nodes',
    status: 'beta',
    featuredImage: 'https://static.wixstatic.com/media/de4185_505d2a435a4442c3a86238bafd80e8c9~mv2.png',
  },
  {
    id: 'kasparex-ai',
    name: 'Kasparex AI',
    category: 'Infrastructure',
    description:
      'Autonomous AI agents on Kaspa L1 BlockDAG. Build, deploy, and monetise agent workflows with KAS, KREX, and future ARIA utility.',
    route: '/ai',
    status: 'beta',
    featuredImage: 'https://static.wixstatic.com/media/de4185_f04e9db7397c454bacd9885674d8d863~mv2.png',
  },
  {
    id: 'kasparex-rewards',
    name: 'Kasparex Rewards',
    category: 'Ecosystem',
    description: 'One hub wallet for redeemable pts, catalog offers, and GRID-style multipliers where partners wire them in.',
    route: '/rewards',
    status: 'available',
    featuredImage: 'https://static.wixstatic.com/media/de4185_c5b7ab0edb0e4fe18a13a26afd4ecb15~mv2.png',
  },
  {
    id: 'kasparex-stats',
    name: 'Kasparex Stats',
    category: 'Ecosystem',
    description: 'Treasury, Total Value Locked (TVL), and ecosystem statistics. Real data will replace placeholders in a future update.',
    route: '/stats',
    status: 'beta',
    featuredImage: 'https://static.wixstatic.com/media/de4185_e3783fc567224ce9b499500ddbb03ebc~mv2.png',
  },
  {
    id: 'kasparex-ads',
    name: 'Kasparex Ads',
    category: 'Ecosystem',
    description: 'Time-locked ad slots across the platform. Pay in KAS, choose a slot and duration, and your ad goes live in halo, sidebar, and footer placements.',
    route: '/ads',
    status: 'beta',
    featuredImage: 'https://static.wixstatic.com/media/de4185_a753224a294c40d1a979031a4cd59f43~mv2.png',
  },
];
