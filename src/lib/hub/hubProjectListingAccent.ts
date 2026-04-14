import type { KxListingAccent } from '@/lib/ui/kxListingAccent';

/** Maps hub project id to listing-card accent (border / hover tint). */
export function hubProjectListingAccent(projectId: string): KxListingAccent {
  switch (projectId) {
    case 'kasparex-dapps':
      return 'dapps';
    case 'kasparex-records':
      return 'records';
    case 'kasparex-tokens':
      return 'tokens';
    case 'kasparex-games':
      return 'games';
    case 'kasparex-vblog':
      return 'vblog';
    case 'kasparex-magazines':
      return 'magazines';
    case 'krex-chronicles':
      return 'chronicles';
    case 'kasparex-movies':
      return 'movies';
    case 'kasparex-defi':
      return 'defi';
    case 'kasparex-studio':
      return 'studio';
    case 'krex-nodes':
      return 'nodes';
    case 'kasparex-rewards':
      return 'rewards';
    case 'kasparex-stats':
      return 'stats';
    case 'kasparex-nft-tools':
      return 'nftTools';
    case 'kasparex-store':
      return 'store';
    case 'kasparex-donations':
      return 'crowdkas';
    case 'kasparex-ads':
      return 'ads';
    case 'revenue-tree':
      return 'revenueTree';
    default:
      return 'hub';
  }
}
