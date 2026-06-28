'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MyDApp } from '@/hooks/useMyDApps';
import { getCategoryById } from '@/lib/categories';
import { DAppQuickActions } from './DAppQuickActions';

interface MyDAppsListProps {
  dApps: MyDApp[];
  isLoading: boolean;
  isEmpty: boolean;
}

export function MyDAppsList({ dApps, isLoading, isEmpty }: MyDAppsListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredDApps = useMemo(() => {
    let filtered = dApps;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (dapp) =>
          dapp.name.toLowerCase().includes(query) ||
          dapp.description?.toLowerCase().includes(query) ||
          dapp.utility?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((dapp) => dapp.status === statusFilter);
    }

    return filtered;
  }, [dApps, searchQuery, statusFilter]);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#02abb8]"></div>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading your dApps...</p>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📱</div>
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          No dApps Yet
        </h3>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          You haven&apos;t created or listed any dApps yet.
        </p>
        <Link
          href="/u?tab=my-dapps&view=build-dapp"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#02abb8] rounded-lg hover:bg-[#0299a3] transition-colors"
        >
          Build Your First dApp
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 min-w-0">
          <div className="k-search-container h-10 overflow-visible">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dApps..."
              className={`k-search-input h-10 w-full ${searchQuery.length > 0 ? 'is-typing' : ''}`.trim()}
            />
          </div>
        </div>
        <div className="sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
          >
            <option value="all">All Status</option>
            <option value="Mainnet">Mainnet</option>
            <option value="Testnet">Testnet</option>
            <option value="Concept">Concept</option>
            <option value="Prototype">Prototype</option>
            <option value="U/C">U/C</option>
            <option value="Suspended">Suspended</option>
            <option value="Devnet">Devnet</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="kx-body">
        Showing {filteredDApps.length} of {dApps.length} dApp{dApps.length !== 1 ? 's' : ''}
      </div>

      {/* dApps List */}
      {filteredDApps.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-600 dark:text-zinc-400">No dApps match your filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDApps.map((dapp) => {
            const category = getCategoryById(dapp.category);
            const slug = dapp.slug || dapp.id;

            return (
              <div
                key={dapp.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Image */}
                  {dapp.image && (
                    <div className="flex-shrink-0">
                      <img
                        src={dapp.image}
                        alt={dapp.name}
                        className="w-24 h-24 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                          {dapp.name}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          {category && (
                            <span className="px-2 py-1 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded">
                              {category.emoji} {category.name}
                            </span>
                          )}
                          <span className="px-2 py-1 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded">
                            {dapp.status}
                          </span>
                          {dapp.isRegistered && (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                              ✓ Registered
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {dapp.description && (
                      <p className="kx-body mb-4 line-clamp-2">
                        {dapp.description}
                      </p>
                    )}

                    {dapp.utility && (
                      <p className="kx-body mb-4">
                        <span className="font-medium">Utility:</span> {dapp.utility}
                      </p>
                    )}

                    {/* Quick Actions */}
                    <DAppQuickActions dapp={dapp} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

