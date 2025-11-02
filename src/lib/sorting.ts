import { DApp } from './dapps';
import type { SortOption } from '@/components/SortFilters';

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

