/**
 * Live NFT Tools modules shipped on collection pages.
 */
export interface NftModuleItem {
  id: string;
  title: string;
  description: string;
  href: string;
  status: 'live' | 'beta';
}

export const NFT_TOOLS_MODULES: NftModuleItem[] = [
  {
    id: 'checker',
    title: 'Rarity Checker',
    description: 'Look up any token ID and see rank, score, and trait breakdown against the full collection.',
    href: '/nft/KREXPRIME',
    status: 'live',
  },
  {
    id: 'traits',
    title: 'Trait Analysis',
    description: 'Explore trait frequencies, combinations, and rarity distribution across a collection.',
    href: '/nft/KREXPRIME',
    status: 'live',
  },
  {
    id: 'builder',
    title: 'PFP Builder',
    description: 'Compose custom profile pictures from collection trait layers with live preview.',
    href: '/nft/PIXELKREX',
    status: 'live',
  },
  {
    id: 'stats',
    title: 'Collection Stats',
    description: 'Mint progress, holder counts, and marketplace signals pulled from KaspaCom where available.',
    href: '/nft/KREXPRIME',
    status: 'live',
  },
  {
    id: 'my-nfts',
    title: 'Wallet Gallery',
    description: 'Browse NFTs held by your connected address, filtered by collection or across your wallet.',
    href: '/nft?tab=premium',
    status: 'live',
  },
  {
    id: 'leaderboard-bridge',
    title: 'Leaderboard Bridge',
    description: 'Jump from held NFTs to Chronicles slot scoring and season progress for premium lines.',
    href: '/chronicles/leaderboard#points-table',
    status: 'beta',
  },
];
