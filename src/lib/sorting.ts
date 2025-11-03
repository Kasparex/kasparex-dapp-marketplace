import { DApp } from './dapps';
import type { SortOption } from '@/components/SortFilters';
import { generateDAppSlug } from './utils';

// Cache for view counts to avoid repeated localStorage reads
let viewCountsCache: Map<string, number> | null = null;
let viewCountsCacheTime = 0;
const CACHE_DURATION = 5000; // 5 seconds cache

/**
 * Get all view counts from localStorage (cached for performance)
 */
function getViewCounts(): Map<string, number> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (viewCountsCache && (now - viewCountsCacheTime) < CACHE_DURATION) {
    return viewCountsCache;
  }

  // Build new cache
  const counts = new Map<string, number>();
  
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('kasparex-dapp-views');
      if (stored) {
        const allViews = JSON.parse(stored);
        for (const [slug, count] of Object.entries(allViews)) {
          counts.set(slug, count as number);
        }
      }
    } catch (error) {
      console.error('Error reading view counts:', error);
    }
  }

  viewCountsCache = counts;
  viewCountsCacheTime = now;
  return counts;
}

/**
 * Get view count for a dApp (uses cached data)
 */
function getViewCount(dapp: DApp): number {
  const counts = getViewCounts();
  const slug = dapp.slug || generateDAppSlug(dapp.name);
  return counts.get(slug) || 0;
}

export function sortDApps(dapps: DApp[], sortBy: SortOption, favorites?: Set<string>): DApp[] {
  const sorted = [...dapps];

  switch (sortBy) {
    case 'newest':
      // Sort by ID descending (higher ID = newer), or by createdAt if available
      return sorted.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        // Fallback to ID (numeric comparison)
        const aId = parseInt(a.id, 10);
        const bId = parseInt(b.id, 10);
        return isNaN(bId) || isNaN(aId) ? b.id.localeCompare(a.id) : bId - aId;
      });

    case 'oldest':
      // Sort by ID ascending (lower ID = older), or by createdAt if available
      return sorted.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        // Fallback to ID (numeric comparison)
        const aId = parseInt(a.id, 10);
        const bId = parseInt(b.id, 10);
        return isNaN(aId) || isNaN(bId) ? a.id.localeCompare(b.id) : aId - bId;
      });

    case 'alphabetical-az':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));

    case 'alphabetical-za':
      return sorted.sort((a, b) => b.name.localeCompare(a.name));

    case 'status':
      // Sort by status priority: Mainnet > Testnet > Prototype > U/C > Concept > Devnet > Suspended
      const statusOrder: Record<string, number> = {
        Mainnet: 1,
        Testnet: 2,
        Prototype: 3,
        'U/C': 4,
        Concept: 5,
        Devnet: 6,
        Suspended: 7,
      };
      return sorted.sort((a, b) => {
        const aOrder = statusOrder[a.status] || 999;
        const bOrder = statusOrder[b.status] || 999;
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        // If same status, sort alphabetically
        return a.name.localeCompare(b.name);
      });

    case 'network':
      // Sort by network name, then by name
      return sorted.sort((a, b) => {
        const networkCompare = a.network.localeCompare(b.network);
        if (networkCompare !== 0) {
          return networkCompare;
        }
        return a.name.localeCompare(b.name);
      });

    case 'most-visited-high':
      // Sort by view count descending (high to low)
      return sorted.sort((a, b) => {
        const aViews = getViewCount(a);
        const bViews = getViewCount(b);
        if (aViews !== bViews) {
          return bViews - aViews;
        }
        // If same view count, sort alphabetically
        return a.name.localeCompare(b.name);
      });

    case 'most-visited-low':
      // Sort by view count ascending (low to high)
      return sorted.sort((a, b) => {
        const aViews = getViewCount(a);
        const bViews = getViewCount(b);
        if (aViews !== bViews) {
          return aViews - bViews;
        }
        // If same view count, sort alphabetically
        return a.name.localeCompare(b.name);
      });

    case 'favorites':
      // Sort favorites first, then by name
      if (!favorites || favorites.size === 0) {
        return sorted; // If no favorites, return as-is
      }
      return sorted.sort((a, b) => {
        const aIsFavorite = favorites.has(a.id);
        const bIsFavorite = favorites.has(b.id);
        if (aIsFavorite && !bIsFavorite) {
          return -1;
        }
        if (!aIsFavorite && bIsFavorite) {
          return 1;
        }
        // If both are favorites or both are not, sort alphabetically
        return a.name.localeCompare(b.name);
      });

    default:
      return sorted;
  }
}

