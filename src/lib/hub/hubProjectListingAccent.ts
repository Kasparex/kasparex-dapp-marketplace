import type { KxListingAccent } from '@/lib/ui/kxListingAccent';

/** Maps hub project id to listing-card accent (border / hover tint). */
export function hubProjectListingAccent(projectId: string): KxListingAccent {
  switch (projectId) {
    case 'kasparex-games':
      return 'games';
    case 'kasparex-vblog':
      return 'vblog';
    case 'kasparex-magazines':
      return 'magazines';
    case 'krex-chronicles':
      return 'chronicles';
    case 'kasparex-tokens':
      return 'store';
    case 'kasparex-defi':
      return 'crowdkas';
    default:
      return 'hub';
  }
}
