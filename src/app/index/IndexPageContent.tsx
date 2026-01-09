'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ListingCard } from '@/components/listings/ListingCard';
import { FilterPanel } from '@/components/listings/FilterPanel';
import { SearchBar } from '@/components/listings/SearchBar';
import { mockListings } from '@/lib/listings/mockData';
import { ListingFilters, ListingCategory } from '@/lib/listings/types';

export function IndexPageContent() {
  const [filters, setFilters] = useState<ListingFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Get all unique tags from listings
  const availableTags = useMemo(() => {
    const tagsSet = new Set<string>();
    mockListings.forEach(listing => {
      listing.tags.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, []);

  // Filter listings
  const filteredListings = useMemo(() => {
    return mockListings.filter(listing => {
      // Category filter
      if (filters.category && listing.category !== filters.category) {
        return false;
      }

      // Status filter
      if (filters.status && listing.status !== filters.status) {
        return false;
      }

      // Tag filter
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag => listing.tags.includes(tag));
        if (!hasMatchingTag) {
          return false;
        }
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = listing.name.toLowerCase().includes(query);
        const matchesDescription = listing.description.toLowerCase().includes(query);
        const matchesTags = listing.tags.some(tag => tag.toLowerCase().includes(query));
        if (!matchesName && !matchesDescription && !matchesTags) {
          return false;
        }
      }

      return true;
    });
  }, [filters, searchQuery]);

  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
              Discover Kaspa Ecosystem
            </h1>
            <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
              Permissionless listing platform for dApps, tokens, NFTs, and tools. List your project with a wallet-signed transaction.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/create-listing"
                className="px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
              >
                Create Listing
              </Link>
              <Link
                href="/hub"
                className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Back to Hub
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filters Section */}
      <section className="py-8 border-b border-zinc-200 dark:border-zinc-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
        </div>
      </section>

      {/* Listings Grid Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filter Sidebar */}
            <aside className="lg:w-64 flex-shrink-0">
              <div className="sticky top-4">
                <FilterPanel
                  filters={filters}
                  onFiltersChange={setFilters}
                  availableTags={availableTags}
                />
              </div>
            </aside>

            {/* Listings Grid */}
            <div className="flex-1">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  Listings ({filteredListings.length})
                </h2>
              </div>

              {filteredListings.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-zinc-600 dark:text-zinc-400 mb-4">No listings found matching your filters.</p>
                  <button
                    onClick={() => {
                      setFilters({});
                      setSearchQuery('');
                    }}
                    className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredListings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

