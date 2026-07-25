'use client';

import { useMemo, useState } from 'react';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import {
  getVBlogModuleCombinedDiscountPercent,
  getVBlogModuleDiscountPercent,
  getVBlogModuleEffectivePriceKas,
  getVBlogModuleNftDiscountPercent,
  VBLOG_MODULE_OFFERS,
} from '@/lib/vblog/modules';
import type { VBlogModuleId } from '@/lib/vblog/types';
import { FilterBar } from '@/components/FilterBar';
import { ChroniclesFilterDropdown } from '@/components/chronicles/ChroniclesFilterDropdown';
import { KxInFormPremiumList, KxInFormPremiumRow } from '@/components/ui/KxInFormPremiumRow';

interface VBlogModuleUnlockCardsProps {
  title?: string;
  className?: string;
  recommendedModuleIds?: VBlogModuleId[];
  showToggleLabel?: string;
  enableControls?: boolean;
}

export function VBlogModuleUnlockCards({
  title = 'Vault modules',
  className = '',
  recommendedModuleIds,
  showToggleLabel = 'Show all modules',
  enableControls = false,
}: VBlogModuleUnlockCardsProps) {
  const { tier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const [showAllModules, setShowAllModules] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'title-asc' | 'price-asc' | 'price-desc'>('title-asc');
  const krexDiscountPct = getVBlogModuleDiscountPercent(tier);
  const nftDiscountPct = getVBlogModuleNftDiscountPercent(nftStatus);
  const combinedDiscountPct = getVBlogModuleCombinedDiscountPercent(tier, nftStatus);

  const cards = useMemo(() => {
    if (!recommendedModuleIds || recommendedModuleIds.length === 0 || showAllModules) {
      return VBLOG_MODULE_OFFERS;
    }
    const order = new Map(recommendedModuleIds.map((id, index) => [id, index]));
    return VBLOG_MODULE_OFFERS.filter((offer) => order.has(offer.id)).sort(
      (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
    );
  }, [recommendedModuleIds, showAllModules]);

  const visibleCards = useMemo(() => {
    let list = cards.slice();
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((x) => x.title.toLowerCase().includes(q) || x.description.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      if (sort === 'title-asc') return a.title.localeCompare(b.title);
      if (sort === 'price-asc') return a.unlockPriceKas - b.unlockPriceKas;
      return b.unlockPriceKas - a.unlockPriceKas;
    });
    return list;
  }, [cards, search, sort]);

  return (
    <section className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-base font-black uppercase tracking-widest text-[#e30d1b] dark:text-[#ff6b73]">{title}</p>
        <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
          KREX {tier} | Combined discount {combinedDiscountPct}%
        </span>
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Vault modules are billed per article when you publish or update. Each new article requires its own module payment.
      </p>

      {recommendedModuleIds && recommendedModuleIds.length > 0 ? (
        <div className="flex items-center justify-between gap-3 text-sm">
          <p className="font-semibold text-zinc-600 dark:text-zinc-400">
            {showAllModules ? 'Showing all module offers' : 'Showing recommended modules for this editor'}
          </p>
          <button
            type="button"
            onClick={() => setShowAllModules((x) => !x)}
            className="k-control-btn !py-1.5 !px-3 !text-[11px]"
          >
            {showAllModules ? 'Show recommended only' : showToggleLabel}
          </button>
        </div>
      ) : null}

      {enableControls ? (
        <FilterBar
          search={{ value: search, onChange: setSearch, placeholder: 'Search module offers...' }}
          onReset={() => {
            setSearch('');
            setSort('title-asc');
          }}
          flexWrap
        >
          <ChroniclesFilterDropdown
            ariaLabel="Sort module offers"
            value={sort}
            onChange={(v) => setSort(v as 'title-asc' | 'price-asc' | 'price-desc')}
            allLabel="Title (A-Z)"
            options={[
              { value: 'title-asc', label: 'Title (A-Z)' },
              { value: 'price-asc', label: 'Price (low-high)' },
              { value: 'price-desc', label: 'Price (high-low)' },
            ]}
            minWidthClassName="min-w-[180px]"
          />
        </FilterBar>
      ) : null}

      <KxInFormPremiumList>
        {visibleCards.map((offer) => {
          const effectiveKas = getVBlogModuleEffectivePriceKas(offer.unlockPriceKas, tier, nftStatus);
          const hasDiscount = effectiveKas < offer.unlockPriceKas;
          return (
            <KxInFormPremiumRow
              key={offer.id}
              title={offer.title}
              description={offer.description}
              priceLabel={`${effectiveKas} KAS / article${hasDiscount ? '' : ''}`}
            />
          );
        })}
      </KxInFormPremiumList>

      {(krexDiscountPct > 0 || nftDiscountPct > 0) && (
        <div className="flex flex-wrap gap-2 text-[11px]">
          {krexDiscountPct > 0 ? (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-bold">
              KREX -{krexDiscountPct}%
            </span>
          ) : null}
          {nftDiscountPct > 0 ? (
            <span className="px-2 py-0.5 rounded-full bg-[#e30d1b]/15 border border-[#e30d1b]/25 text-red-700 dark:text-red-300 font-bold">
              NFT -{nftDiscountPct}%
            </span>
          ) : null}
        </div>
      )}
    </section>
  );
}

/** @deprecated Modules are paid per article at publish time. */
export function VBlogInlineModuleUnlockCard() {
  return null;
}
