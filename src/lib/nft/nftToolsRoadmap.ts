/**
 * Planned NFT Tools modules (informational). Shown on /nft/roadmap.
 */
export interface NftToolsRoadmapItem {
  id: string;
  title: string;
  description: string;
  status: 'planned' | 'in-progress' | 'beta';
  eta?: string;
}

export const NFT_TOOLS_ROADMAP: NftToolsRoadmapItem[] = [
  {
    id: 'bulk-rarity',
    title: 'Bulk rarity export',
    description: 'Export rarity scores and ranks for full wallets or watchlists as CSV for traders and collectors.',
    status: 'planned',
    eta: '2026',
  },
  {
    id: 'cross-collection-pfp',
    title: 'Cross-collection PFP lab',
    description: 'Mix trait layers from approved partner collections where IP and metadata allow compositing.',
    status: 'planned',
  },
  {
    id: 'nft-alerts',
    title: 'Floor & listing alerts',
    description: 'Optional Kaspa / KaspaCom signals for collections you follow, wired to your connected address.',
    status: 'planned',
  },
  {
    id: 'leaderboard-bridge',
    title: 'Deep leaderboard integration',
    description: 'One-click jump from any held NFT to Chronicles slots, season progress, and points breakdown.',
    status: 'in-progress',
  },
  {
    id: 'dapp-sdk-widgets',
    title: 'Embeddable NFT widgets',
    description: 'Drop-in components for partner dApps: holder gates, rarity badges, and collection previews.',
    status: 'planned',
  },
  {
    id: 'mobile-optimized',
    title: 'Mobile-first gallery',
    description: 'Swipe-first wallet gallery with offline-cached images for slow connections.',
    status: 'beta',
  },
];
