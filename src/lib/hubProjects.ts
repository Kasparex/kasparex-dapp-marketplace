import { CHRONICLES_LB_POINTS_PER_READ_CONFIRM } from '@/lib/chronicles/leaderboard/constants';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';

export type ProjectStatus = 'available' | 'demo' | 'beta' | 'coming-soon';

export interface HubProject {
  id: string;
  name: string;
  category: string;
  description: string;
  route: string;
  status: ProjectStatus;
  /** Short hint for typical redeemable hub pts when ledger rules apply (policy, not a promise). */
  earnPtsHint?: string;
}

const P = HUB_EARN_POINTS;
const CH_READ = CHRONICLES_LB_POINTS_PER_READ_CONFIRM;

export const hubProjects: HubProject[] = [
  {
    id: 'kasparex-dapps',
    name: 'Kasparex dApps',
    category: 'Utility',
    description: 'Explore modular dApps, dashboards and tools built on Kaspa. Discover a growing ecosystem of decentralized applications.',
    route: '/dapps',
    status: 'beta',
    earnPtsHint: `from ${P.dappL1Interaction}+ pts on classified Kaspa actions (policy)`,
  },
  {
    id: 'kasparex-protocols',
    name: 'Kasparex Protocols',
    category: 'Standards',
    description:
      'Open protocols, tools, documentation, and reference implementations for identity, publishing, and cross-chain workflows on Kaspa - aligned with Kasparex indexers.',
    route: '/protocols',
    status: 'beta',
    earnPtsHint: 'no direct pts; use apps that implement ledger earns',
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
    earnPtsHint: 'pts when a flow is wired to the Rewards ledger',
  },
  {
    id: 'kasparex-games',
    name: 'Kasparex Games',
    category: 'Entertainment',
    description: 'Simple web3 mini games and interactive experiences with rewards. Play, earn, and have fun in the Kasparex ecosystem.',
    route: '/games',
    status: 'beta',
    earnPtsHint: 'Minecore: pts from Diamond refine into your gameplay wallet',
  },
  {
    id: 'kasparex-vblog',
    name: 'Kasparex vBlog',
    category: 'Publishing',
    description: 'An on-chain blog system where authors publish articles stored via CIDs or IPFS-like storage. Decentralized content creation.',
    route: '/vblog',
    status: 'beta',
    earnPtsHint: `~${P.vblogArticleCreate} pts new publish, ~${P.vblogArticleUpdate} pts update`,
  },
  {
    id: 'kasparex-magazines',
    name: 'Kasparex Magazines',
    category: 'Publishing',
    description: 'Digital magazines and curated issues from creators and the community. Discover curated content and stories.',
    route: '/magazines',
    status: 'beta',
    earnPtsHint: `~${P.magazineIssuePublish} pts per verified issue publish`,
  },
  {
    id: 'krex-chronicles',
    name: "Krex's Chronicles",
    category: 'Publishing',
    description:
      'Central lore hub for Kaspaland: chapters, characters, locations, and tech; wiki and CMS-ready, built for future tokens and cross-links to games like Diamond Veins.',
    route: '/chronicles',
    status: 'beta',
    earnPtsHint: `${CH_READ}+ pts read confirm; NFT slots add seasonal leaderboard weight`,
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
    earnPtsHint: `may credit from ${P.dappL1Interaction}+ pts pattern when Kaspa txs qualify`,
  },
  {
    id: 'kasparex-studio',
    name: 'Profile Hub',
    category: 'Creator Tools',
    description: 'Unified creator workspace for dashboards, editors, dApp listings, ads, and assets tied to your Kaspa + KNS identity.',
    route: '/u',
    status: 'beta',
    earnPtsHint: 'launch Store, vBlog, Ads, CrowdKAS from here for listed pts',
  },
  {
    id: 'krex-nodes',
    name: 'KREX Nodes',
    category: 'Infrastructure',
    description: 'User-run nodes that support the Kasparex ecosystem and optionally earn rewards. Help power the network.',
    route: '/nodes',
    status: 'beta',
    earnPtsHint: `~${P.krexNodeEnrollmentOnce} pts enrollment once, ~${P.krexNodeOperatorDaily} pts daily when epochs qualify`,
  },
  {
    id: 'kasparex-rewards',
    name: 'Kasparex Rewards',
    category: 'Ecosystem',
    description: 'One hub wallet for redeemable pts, catalog offers, and GRID-style multipliers where partners wire them in.',
    route: '/rewards',
    status: 'available',
    earnPtsHint: 'balances, earn table, and History for your Kaspa profile',
  },
  {
    id: 'kasparex-stats',
    name: 'Kasparex Stats',
    category: 'Ecosystem',
    description: 'Treasury, Total Value Locked (TVL), and ecosystem statistics. Real data will replace placeholders in a future update.',
    route: '/stats',
    status: 'beta',
    earnPtsHint: 'analytics only',
  },
  {
    id: 'kasparex-nft-tools',
    name: 'Kasparex NFT Tools',
    category: 'NFTs',
    description: 'Rarity checker, trait analysis, and PFP builder for KREXPRIME and PIXELKREX collections.',
    route: '/nft',
    status: 'beta',
    earnPtsHint: 'Chronicles NFT slots tie to leaderboard pts (see Chronicles)',
  },
  {
    id: 'kasparex-store',
    name: 'Kasparex Store',
    category: 'Marketplace',
    description: 'Digital products marketplace powered by KAS. Buy and sell software, art, music, templates, and more with IPFS storage.',
    route: '/store',
    status: 'beta',
    earnPtsHint: `~${P.storeProductList} pts per product listing (paid tx)`,
  },
  {
    id: 'kasparex-donations',
    name: 'Kasparex CrowdKAS',
    category: 'Creator Tools',
    description: 'Crowdfund creators and projects with verifiable on-chain campaigns. Contribute via L1 or use L2 escrow for goal-based crowdfunding with refunds.',
    route: '/donations',
    status: 'beta',
    earnPtsHint: `~${P.crowdkasCampaignCreate} pts when a campaign create tx qualifies`,
  },
  {
    id: 'kasparex-ads',
    name: 'Kasparex Ads',
    category: 'Ecosystem',
    description: 'Time-locked ad slots across the platform. Pay in KAS, choose a slot and duration, and your ad goes live in halo, sidebar, and footer placements.',
    route: '/ads',
    status: 'beta',
    earnPtsHint: `~${P.hubAdPlacement} pts on verified ad binding`,
  },
  {
    id: 'revenue-tree',
    name: 'Revenue Tree',
    category: 'Ecosystem',
    description: 'Track your network, rewards, and structural flow in real-time. Visualize the Kasparex revenue distribution system.',
    route: '/tree/dashboard',
    status: 'available',
    earnPtsHint: 'L2 revenue view; hub pts accrue on Kaspa ledger routes',
  },
];

