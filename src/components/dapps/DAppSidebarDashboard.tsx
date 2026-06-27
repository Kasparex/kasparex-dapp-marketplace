'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useRedeemablePointsBreakdown } from '@/hooks/useRedeemablePointsBreakdown';
import { SidebarSection } from '@/components/sidebar/SidebarSection';
import { SidebarNavItem } from '@/components/sidebar/SidebarNavItem';
import { DAppListingForm } from './DAppListingForm';
import {
  getDAppListingSubmissions,
  getDAppListingSubmissionsByCategory,
  type DAppListingSubmission,
} from '@/lib/dapps/listingSubmissions';
import { getCategoryById, categories, type Category } from '@/lib/categories';
import { DAPP_LISTING_FEE_KAS } from '@/lib/dapps/listingSubmissions';

export type DAppSidebarDashboardTab = 'overview' | 'listings' | 'list';

const TAB_ITEMS: { id: DAppSidebarDashboardTab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    id: 'listings',
    label: 'My Listings',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    id: 'list',
    label: 'List a DApp',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
  },
];

const LISTING_CATEGORIES = categories.filter((c) => c.id !== 'all');

function ListingRow({ item }: { item: DAppListingSubmission }) {
  const cat = getCategoryById(item.category);
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-3">
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{item.name}</p>
        <span className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase bg-cyan-500/10 text-cyan-800 dark:text-cyan-300">
          {item.status}
        </span>
      </div>
      <p className="text-[11px] text-zinc-500 line-clamp-2 mb-2">{item.description}</p>
      <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-500">
        {cat ? <span>{cat.emoji} {cat.name}</span> : null}
        <span>•</span>
        <span>{new Date(item.submittedAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

export function DAppSidebarDashboard() {
  const { state } = useKaspaWallet();
  const { totalRedeemable: hubPts, address: hubAddr } = useRedeemablePointsBreakdown();
  const [tab, setTab] = useState<DAppSidebarDashboardTab>('overview');
  const [listings, setListings] = useState<DAppListingSubmission[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');

  const refreshListings = useCallback(() => {
    setListings(getDAppListingSubmissions(state.address || undefined));
  }, [state.address]);

  useEffect(() => {
    refreshListings();
    const onUpdate = () => refreshListings();
    window.addEventListener('dapp-listing-submissions-updated', onUpdate);
    return () => window.removeEventListener('dapp-listing-submissions-updated', onUpdate);
  }, [refreshListings]);

  const filteredListings = useMemo(
    () => getDAppListingSubmissionsByCategory(categoryFilter, state.address || undefined),
    [categoryFilter, state.address, listings],
  );

  return (
    <div className="space-y-4">
      <SidebarSection title="User Dashboard">
        <nav className="space-y-1">
          {TAB_ITEMS.map((item) => (
            <SidebarNavItem
              key={item.id}
              label={item.label}
              icon={item.icon}
              active={tab === item.id}
              onClick={() => setTab(item.id)}
            />
          ))}
        </nav>
      </SidebarSection>

      <div className="px-1">
        {tab === 'overview' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#02abb8] mb-2">dApp Center</p>
              {state.address ? (
                <p className="text-[10px] font-mono text-zinc-500 truncate mb-3">{state.address}</p>
              ) : (
                <p className="text-xs text-zinc-500 mb-3">Connect Kaspa L1 to track listings.</p>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900/60 p-2.5 border border-zinc-100 dark:border-zinc-800">
                  <p className="text-[9px] font-bold uppercase text-zinc-500 mb-0.5">Hub pts</p>
                  <p className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                    {!hubAddr ? '—' : hubPts.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900/60 p-2.5 border border-zinc-100 dark:border-zinc-800">
                  <p className="text-[9px] font-bold uppercase text-zinc-500 mb-0.5">Listings</p>
                  <p className="text-sm font-black text-zinc-900 dark:text-zinc-100">{listings.length}</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Link href="/tree/dashboard" className="k-control-btn w-full text-center">
                Revenue Tree
              </Link>
              <Link href="/dapp-modules" className="k-control-btn w-full text-center">
                Modules
              </Link>
              <button type="button" onClick={() => setTab('list')} className="k-control-btn w-full !border-cyan-500/30 !bg-cyan-500/10 !text-cyan-800 dark:!text-cyan-300">
                List a DApp ({DAPP_LISTING_FEE_KAS} KAS / KREX)
              </button>
            </div>
          </div>
        )}

        {tab === 'listings' && (
          <div className="space-y-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as Category | 'all')}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-xs"
            >
              <option value="all">All categories</option>
              {LISTING_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
            {filteredListings.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-6">No listing submissions yet.</p>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {filteredListings.map((item) => (
                  <ListingRow key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'list' && (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#02abb8] mb-3">List a DApp</p>
            <DAppListingForm
              onSubmitted={() => {
                refreshListings();
                setTab('listings');
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
