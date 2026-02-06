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
    route: '/',
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
    description: 'Token creation, management, and trading tools for the Kaspa ecosystem. Create and manage your tokens with ease.',
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
    description: 'Tools related to tokens, staking, fee and reward calculators and future financial dApps. Manage your assets and rewards.',
    route: '/hub/coming-soon',
    status: 'coming-soon',
  },
  {
    id: 'kasparex-studio',
    name: 'Kasparex Studio',
    category: 'Creator Tools',
    description: 'A future suite for generating and managing assets like visuals, music and clips. Everything creators need in one place.',
    route: '/hub/coming-soon',
    status: 'coming-soon',
  },
  {
    id: 'krex-nodes',
    name: 'KREX Nodes',
    category: 'Infrastructure',
    description: 'User-run nodes that support the Kasparex ecosystem and optionally earn rewards. Help power the network.',
    route: '/hub/coming-soon',
    status: 'coming-soon',
  },
  {
    id: 'kasparex-rewards',
    name: 'Kasparex Rewards',
    category: 'Ecosystem',
    description: 'The global and local rewards system that powers incentives across all dApps and projects. Earn as you explore.',
    route: '/points',
    status: 'available',
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
    id: 'kasparex-store',
    name: 'Kasparex Store',
    category: 'Marketplace',
    description: 'Digital products marketplace powered by KAS. Buy and sell software, art, music, templates, and more with IPFS storage.',
    route: '/store',
    status: 'beta',
  },
];

