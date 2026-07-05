export type ProjectStatus = 'available' | 'demo' | 'beta' | 'coming-soon';

export interface HubProject {
  id: string;
  name: string;
  category: string;
  description: string;
  route: string;
  status: ProjectStatus;
}

export const hubProjects: HubProject[] = [
  {
    id: 'kasparex-dapps',
    name: 'Kasparex dApps',
    category: 'Utility',
    description: 'Explore modular dApps, dashboards and tools built on Kaspa. Discover a growing ecosystem of decentralized applications.',
    route: '/dapps',
    status: 'beta',
  },
  {
    id: 'kasparex-protocols',
    name: 'Kasparex Protocols',
    category: 'Standards',
    description:
      'Open protocols, tools, documentation, and reference implementations for identity, publishing, and cross-chain workflows on Kaspa - aligned with Kasparex indexers.',
    route: '/protocols',
    status: 'beta',
  },
  {
    id: 'kasparex-records',
    name: 'Kasparex Records',
    category: 'Media',
    description: 'Music and video songs around Kaspa and the ecosystem. Discover and support creators in the Kasparex community.',
    route: '/hub/coming-soon',
    status: 'coming-soon',
  },
  {
    id: 'kasparex-tokens',
    name: 'Kasparex Tokens',
    category: 'Finance',
    description:
      'Utility-as-a-Service for token projects. Launch landing pages, verify ownership, and connect real Hub utility for your community.',
    route: '/tokens',
    status: 'beta',
  },
  {
    id: 'kasparex-games',
    name: 'Kasparex Games',
    category: 'Entertainment',
    description: 'Simple web3 mini games and interactive experiences with rewards. Play, earn, and have fun in the Kasparex ecosystem.',
    route: '/games',
    status: 'beta',
  },
  {
    id: 'kasparex-vblog',
    name: 'Kasparex vBlog',
    category: 'Publishing',
    description: 'An on-chain blog system where authors publish articles stored via CIDs or IPFS-like storage. Decentralized content creation.',
    route: '/vblog',
    status: 'beta',
  },
  {
    id: 'kasparex-magazines',
    name: 'Kasparex Magazines',
    category: 'Publishing',
    description: 'Digital magazines and curated issues from creators and the community. Discover curated content and stories.',
    route: '/magazines',
    status: 'beta',
  },
  {
    id: 'krex-chronicles',
    name: "Krex's Chronicles",
    category: 'Publishing',
    description:
      'Central lore hub for Kaspaland: chapters, characters, locations, and tech; wiki and CMS-ready, built for future tokens and cross-links to games like Diamond Veins.',
    route: '/chronicles/chapters',
    status: 'beta',
  },
  {
    id: 'kasparex-movies',
    name: 'Kasparex Movies',
    category: 'Media',
    description: 'Cinematic content, animated shorts and lore-based videos expanding the Krex universe. Immerse yourself in the story.',
    route: '/hub/coming-soon',
    status: 'coming-soon',
  },
  {
    id: 'kasparex-defi',
    name: 'Kasparex DeFi',
    category: 'Finance',
    description: 'DeFi hub for Kaspa. Swap tokens, provide liquidity, and manage your DeFi portfolio with professional tools.',
    route: '/defi/swaps',
    status: 'beta',
  },
  {
    id: 'kasparex-studio',
    name: 'Profile Hub',
    category: 'Creator Tools',
    description: 'Unified creator workspace for dashboards, editors, dApp listings, ads, and assets tied to your Kaspa + KNS identity.',
    route: '/u',
    status: 'beta',
  },
  {
    id: 'krex-nodes',
    name: 'Kasparex Nodes',
    category: 'Infrastructure',
    description: 'User-run nodes that support the Kasparex ecosystem and optionally earn rewards. Help power the network.',
    route: '/nodes',
    status: 'beta',
  },
  {
    id: 'kasparex-rewards',
    name: 'Kasparex Rewards',
    category: 'Ecosystem',
    description: 'One hub wallet for redeemable pts, catalog offers, and GRID-style multipliers where partners wire them in.',
    route: '/rewards',
    status: 'available',
  },
  {
    id: 'kasparex-stats',
    name: 'Kasparex Stats',
    category: 'Ecosystem',
    description: 'Treasury, Total Value Locked (TVL), and ecosystem statistics. Real data will replace placeholders in a future update.',
    route: '/stats',
    status: 'beta',
  },
  {
    id: 'kasparex-nft-tools',
    name: 'Kasparex NFT Tools',
    category: 'NFTs',
    description: 'Rarity checker, trait analysis, and PFP builder for KREXPRIME and PIXELKREX collections.',
    route: '/nft',
    status: 'beta',
  },
  {
    id: 'kasparex-ai',
    name: 'Kasparex AI',
    category: 'Infrastructure',
    description:
      'Autonomous AI agents on Kaspa L1 BlockDAG. Build, deploy, and monetise agent workflows with KAS, KREX, and future ARIA utility.',
    route: '/ai',
    status: 'beta',
  },
  {
    id: 'kasparex-store',
    name: 'Kasparex Store',
    category: 'Marketplace',
    description: 'Digital products marketplace powered by KAS. Buy and sell software, art, music, templates, and more with IPFS storage.',
    route: '/store',
    status: 'beta',
  },
  {
    id: 'kasparex-donations',
    name: 'Kasparex CrowdKAS',
    category: 'Creator Tools',
    description: 'One hub for crowdfunding: L2 escrow on Igra, Kaspa L1 tips, and L1 covenant goal raises with the same campaign layout.',
    route: '/donations',
    status: 'beta',
  },
  {
    id: 'kasparex-ads',
    name: 'Kasparex Ads',
    category: 'Ecosystem',
    description: 'Time-locked ad slots across the platform. Pay in KAS, choose a slot and duration, and your ad goes live in halo, sidebar, and footer placements.',
    route: '/ads',
    status: 'beta',
  },
  {
    id: 'revenue-tree',
    name: 'Revenue Tree',
    category: 'Ecosystem',
    description: 'Track your network, rewards, and structural flow in real-time. Visualize the Kasparex revenue distribution system.',
    route: '/tree/dashboard',
    status: 'available',
  },
];
