'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { ChroniclesHaloHeader } from '@/components/chronicles/ChroniclesHaloHeader';
import { FilterBar } from '@/components/FilterBar';
import { ChroniclesFilterDropdown } from '@/components/chronicles/ChroniclesFilterDropdown';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { useChroniclesEntitlements } from '@/lib/chronicles/entitlements/useChroniclesEntitlements';
import { VaultSection } from './VaultSection';
import { UnlockOfferCard } from './UnlockOfferCard';
import { VaultDashboardAside } from './VaultDashboardAside';
import type { EntitlementOffer } from '@/lib/chronicles/entitlements/types';

const KaspaL1WalletButton = dynamic(
  () => import('@/components/KaspaL1WalletButton').then((m) => ({ default: m.KaspaL1WalletButton })),
  { ssr: false }
);

export function ChroniclesVaultDashboard() {
  const { state } = useKaspaWallet();
  const { catalog, isUnlocked } = useChroniclesEntitlements(state.address);
  const { tier: krexTier, isLoading: krexLoading } = useKREXBalance();
  const { nftStatus, isLoading: nftLoading } = useNFTStatus();

  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<'' | 'chapter' | 'asset'>('');
  const [statusFilter, setStatusFilter] = useState<'' | 'unlocked' | 'locked'>('');
  const [sort, setSort] = useState<'title-asc' | 'price-asc' | 'price-desc'>('title-asc');

  const offers = useMemo(() => {
    return catalog.map((o) => ({ offer: o, unlocked: isUnlocked(o.id) }));
  }, [catalog, isUnlocked]);

  const filteredOffers = useMemo(() => {
    let list = offers.slice();
    if (kindFilter) list = list.filter((x) => x.offer.kind === kindFilter);
    if (statusFilter) list = list.filter((x) => (statusFilter === 'unlocked' ? x.unlocked : !x.unlocked));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((x) => {
        const o = x.offer;
        return (
          o.title.toLowerCase().includes(q) ||
          o.shortDescription.toLowerCase().includes(q) ||
          o.kind.toLowerCase().includes(q)
        );
      });
    }

    const price = (o: EntitlementOffer) => (o.basePriceKas > 0 ? o.basePriceKas : 0);
    list.sort((a, b) => {
      if (sort === 'title-asc') return a.offer.title.localeCompare(b.offer.title);
      if (sort === 'price-asc') return price(a.offer) - price(b.offer) || a.offer.title.localeCompare(b.offer.title);
      return price(b.offer) - price(a.offer) || a.offer.title.localeCompare(b.offer.title);
    });

    return list;
  }, [offers, kindFilter, statusFilter, search, sort]);

  return (
    <div className="pb-16">
      <ChroniclesHaloHeader
        kicker="Vault & unlocks"
        title="Vault & Unlocks"
        titleAccent="Unlocks"
        subtitle="Unlock premium chapters, items, and future perks with on-chain KAS payments. Entitlements are verified and saved in this browser for your Kaspa address."
        showHaloAd
      />

      <div className="min-w-0 space-y-14">
        {!state.isConnected ? (
          <div className="chronicles-vault-card rounded-xl border border-cyan-500/25 bg-white dark:bg-zinc-900 p-7 sm:p-8 max-w-lg mx-auto text-center space-y-6">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-[#02abb8] mx-auto">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">Connect your Kaspa wallet</h3>
              <p className="text-base text-zinc-600 dark:text-zinc-400 mt-3 leading-relaxed">
                Connect a wallet to view your address and unlocks. Holder discounts are based on collections detected on your Kaspa address.
              </p>
            </div>
            <div className="flex justify-center">
              <KaspaL1WalletButton />
            </div>
          </div>
        ) : (
          <>
            <VaultSection
              id="offers"
              title="Offers"
              subtitle="Send the required KAS payment to the treasury. The indexer may take a short moment to confirm your transaction."
              count={filteredOffers.length}
              controls={
                <FilterBar
                  flexWrap
                  search={{ value: search, onChange: setSearch, placeholder: 'Search vault offers...' }}
                  onReset={() => {
                    setSearch('');
                    setKindFilter('');
                    setStatusFilter('');
                    setSort('title-asc');
                  }}
                >
                  <ChroniclesFilterDropdown
                    ariaLabel="Filter by kind"
                    value={kindFilter}
                    onChange={(v) => setKindFilter(v as '' | 'chapter' | 'asset')}
                    allLabel="All kinds"
                    options={[
                      { value: 'chapter', label: 'Chapters' },
                      { value: 'asset', label: 'Items' },
                    ]}
                    minWidthClassName="min-w-[160px]"
                  />
                  <ChroniclesFilterDropdown
                    ariaLabel="Filter by status"
                    value={statusFilter}
                    onChange={(v) => setStatusFilter(v as '' | 'unlocked' | 'locked')}
                    allLabel="All statuses"
                    options={[
                      { value: 'unlocked', label: 'Unlocked' },
                      { value: 'locked', label: 'Locked' },
                    ]}
                    minWidthClassName="min-w-[160px]"
                  />
                  <ChroniclesFilterDropdown
                    ariaLabel="Sort offers"
                    value={sort}
                    onChange={(v) => setSort(v as 'title-asc' | 'price-asc' | 'price-desc')}
                    allLabel="Title (A–Z)"
                    options={[
                      { value: 'title-asc', label: 'Title (A–Z)' },
                      { value: 'price-asc', label: 'List price (low→high)' },
                      { value: 'price-desc', label: 'List price (high→low)' },
                    ]}
                    minWidthClassName="min-w-[190px]"
                  />
                </FilterBar>
              }
            >
              {filteredOffers.length === 0 ? (
                <p className="text-base text-zinc-500 col-span-full">No matching offers.</p>
              ) : (
                filteredOffers.map(({ offer, unlocked }) => <UnlockOfferCard key={offer.id} offer={offer} unlocked={unlocked} />)
              )}
            </VaultSection>
          </>
        )}

        <div className="space-y-6">
          <VaultDashboardAside
            krexTier={krexTier}
            nft={nftStatus}
            isKrexLoading={krexLoading}
            isNftLoading={nftLoading}
          />
        </div>

        <section id="workspace" className="scroll-mt-24 chronicles-vault-card rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 space-y-3">
          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">Workspace (source files)</h2>
          <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
            Shared lore, KMAG, and community drafts live under{' '}
            <code className="text-sm bg-zinc-100 dark:bg-zinc-800 px-1 rounded">content/story-management/</code>. They are
            not published as web pages; sync the canon into{' '}
            <code className="text-sm bg-zinc-100 dark:bg-zinc-800 px-1 rounded">data/chronicles</code> when ready.
          </p>
        </section>

        <section id="drafts" className="scroll-mt-24 chronicles-vault-card rounded-2xl border border-dashed border-amber-500/35 bg-amber-500/5 dark:bg-amber-500/10 p-6 sm:p-8 space-y-3">
          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">Draft characters</h2>
          <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
            Folders such as Axel Vane and Torq appear in the sidebar as drafts until they have a public slug in{' '}
            <code className="text-sm bg-zinc-100 dark:bg-zinc-800 px-1 rounded">data/chronicles/characters.json</code> and
            an entry in <code className="text-sm bg-zinc-100 dark:bg-zinc-800 px-1 rounded">story-folder-map.json</code>.
          </p>
        </section>
      </div>
    </div>
  );
}
