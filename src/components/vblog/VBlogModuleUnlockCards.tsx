'use client';

import { useMemo, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { kasToSompi } from '@/lib/ads/config';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { getVBlogTreasuryL1Address } from '@/lib/vblog/config';
import {
  getAuthorUnlockedModules,
  getVBlogModuleCombinedDiscountPercent,
  getVBlogModuleDiscountPercent,
  getVBlogModuleEffectivePriceKas,
  getVBlogModuleNftDiscountPercent,
  unlockAuthorModule,
  VBLOG_MODULE_OFFERS,
} from '@/lib/vblog/modules';
import { utf8ToHex } from '@/lib/vblog/payloadHex';
import type { VBlogModuleId } from '@/lib/vblog/types';
import { FilterBar } from '@/components/FilterBar';
import { ChroniclesFilterDropdown } from '@/components/chronicles/ChroniclesFilterDropdown';
import { KxInFormPremiumList, KxInFormPremiumRow } from '@/components/ui/KxInFormPremiumRow';

interface VBlogModuleUnlockCardsProps {
  title?: string;
  className?: string;
  onUnlockChange?: (ids: string[]) => void;
  recommendedModuleIds?: VBlogModuleId[];
  showToggleLabel?: string;
  enableControls?: boolean;
}

export function VBlogModuleUnlockCards({
  title = 'Unlock modules',
  className = '',
  onUnlockChange,
  recommendedModuleIds,
  showToggleLabel = 'Show all modules',
  enableControls = false,
}: VBlogModuleUnlockCardsProps) {
  const { state: kaspaState } = useKaspaWallet();
  const { tier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const [refreshTick, setRefreshTick] = useState(0);
  const [unlockingModuleId, setUnlockingModuleId] = useState<string | null>(null);
  const [showAllModules, setShowAllModules] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'locked' | 'unlocked'>('');
  const [sort, setSort] = useState<'title-asc' | 'price-asc' | 'price-desc'>('title-asc');
  const krexDiscountPct = getVBlogModuleDiscountPercent(tier);
  const nftDiscountPct = getVBlogModuleNftDiscountPercent(nftStatus);
  const combinedDiscountPct = getVBlogModuleCombinedDiscountPercent(tier, nftStatus);

  const unlocked = useMemo(() => {
    if (!kaspaState.address) return [];
    return getAuthorUnlockedModules(kaspaState.address);
  }, [kaspaState.address, refreshTick]);

  const cards = useMemo(() => {
    if (!recommendedModuleIds || recommendedModuleIds.length === 0 || showAllModules) {
      return VBLOG_MODULE_OFFERS;
    }
    const order = new Map(recommendedModuleIds.map((id, index) => [id, index]));
    return VBLOG_MODULE_OFFERS
      .filter((offer) => order.has(offer.id))
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  }, [recommendedModuleIds, showAllModules]);

  const visibleCards = useMemo(() => {
    let list = cards.slice();
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((x) => x.title.toLowerCase().includes(q) || x.description.toLowerCase().includes(q));
    }
    if (statusFilter) {
      list = list.filter((x) => {
        const isUnlocked = unlocked.includes(x.id);
        return statusFilter === 'unlocked' ? isUnlocked : !isUnlocked;
      });
    }
    list.sort((a, b) => {
      if (sort === 'title-asc') return a.title.localeCompare(b.title);
      if (sort === 'price-asc') return a.unlockPriceKas - b.unlockPriceKas;
      return b.unlockPriceKas - a.unlockPriceKas;
    });
    return list;
  }, [cards, search, statusFilter, sort, unlocked]);

  const handleUnlock = async (moduleId: VBlogModuleId, basePriceKas: number) => {
    if (!kaspaState.address || !kaspaState.provider || !kaspaState.isConnected) return;
    const effectiveKas = getVBlogModuleEffectivePriceKas(basePriceKas, tier, nftStatus);
    setUnlockingModuleId(moduleId);
    try {
      const note = `kvb1:module_unlock:${moduleId}:${Date.now()}`;
      const tx = await sendKaspaTransaction(kaspaState.provider as KaspaWalletProvider, {
        to: getVBlogTreasuryL1Address(),
        amount: String(kasToSompi(effectiveKas)),
        note,
        payload: utf8ToHex(note),
      });
      if (tx.status === 'failed' || !tx.txHash) {
        throw new Error(tx.error ?? 'Unlock transaction failed');
      }
      const txHash = extractKaspaTransactionId(tx.txHash) ?? tx.txHash;
      console.info('[vblog-module-unlock]', moduleId, txHash);
      const nextUnlocked = unlockAuthorModule(kaspaState.address, moduleId);
      setRefreshTick((x) => x + 1);
      onUnlockChange?.(nextUnlocked);
    } catch (err) {
      console.error(err);
    } finally {
      setUnlockingModuleId(null);
    }
  };

  return (
    <section className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-base font-black uppercase tracking-widest text-[#02abb8] dark:text-[#4db8d4]">{title}</p>
        <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
          KREX {tier} | Combined discount {combinedDiscountPct}%
        </span>
      </div>
      {recommendedModuleIds && recommendedModuleIds.length > 0 ? (
        <div className="flex items-center justify-between gap-3 text-sm">
          <p className="font-semibold text-zinc-600 dark:text-zinc-400">
            {showAllModules ? 'Showing all unlock modules' : 'Showing recommended modules for this editor'}
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
            setStatusFilter('');
            setSort('title-asc');
          }}
          flexWrap
        >
          <ChroniclesFilterDropdown
            ariaLabel="Filter by status"
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as '' | 'locked' | 'unlocked')}
            allLabel="All statuses"
            options={[
              { value: 'locked', label: 'Locked' },
              { value: 'unlocked', label: 'Unlocked' },
            ]}
            minWidthClassName="min-w-[160px]"
          />
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
          const isUnlocked = unlocked.includes(offer.id);
          const isUnlocking = unlockingModuleId === offer.id;
          const effectiveKas = getVBlogModuleEffectivePriceKas(offer.unlockPriceKas, tier, nftStatus);
          const hasDiscount = effectiveKas < offer.unlockPriceKas;
          return (
            <KxInFormPremiumRow
              key={offer.id}
              title={offer.title}
              description={offer.description}
              priceLabel={isUnlocked ? 'Unlocked' : `${effectiveKas} KAS`}
              trailing={
                isUnlocked ? (
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 shrink-0">Active</span>
                ) : (
                  <button
                    type="button"
                    disabled={isUnlocking || !kaspaState.isConnected}
                    onClick={() => void handleUnlock(offer.id, offer.unlockPriceKas)}
                    className="k-control-btn !py-1.5 !px-3 !text-[11px] shrink-0 disabled:opacity-60"
                  >
                    {isUnlocking ? 'Unlocking...' : `Unlock${hasDiscount ? ` (${offer.unlockPriceKas} KAS)` : ''}`}
                  </button>
                )
              }
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
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/25 text-cyan-700 dark:text-cyan-300 font-bold">
              NFT -{nftDiscountPct}%
            </span>
          ) : null}
        </div>
      )}

      {!kaspaState.isConnected ? (
        <p className="text-sm text-amber-700 dark:text-amber-300">Connect Kaspa wallet to unlock modules.</p>
      ) : null}
    </section>
  );
}

export function VBlogInlineModuleUnlockCard({
  moduleId,
  onUnlocked,
}: {
  moduleId: VBlogModuleId;
  onUnlocked?: (ids: string[]) => void;
}) {
  const offer = VBLOG_MODULE_OFFERS.find((x) => x.id === moduleId);
  const { state: kaspaState } = useKaspaWallet();
  const { tier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const [busy, setBusy] = useState(false);
  if (!offer) return null;

  const payKas = getVBlogModuleEffectivePriceKas(offer.unlockPriceKas, tier, nftStatus);
  const isUnlocked = kaspaState.address ? getAuthorUnlockedModules(kaspaState.address).includes(offer.id) : false;

  if (isUnlocked) {
    return (
      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-300">Unlocked for this wallet.</p>
    );
  }

  return (
    <KxInFormPremiumRow
      title={offer.title}
      description={offer.description}
      priceLabel={`${payKas} KAS`}
      trailing={
        <button
          type="button"
          className="k-control-btn !py-1.5 !px-3 !text-[11px] shrink-0"
          disabled={busy || !kaspaState.isConnected || !kaspaState.address || !kaspaState.provider}
          onClick={async () => {
            if (!kaspaState.isConnected || !kaspaState.address || !kaspaState.provider) return;
            setBusy(true);
            try {
              const note = `kvb1:module_unlock:${offer.id}:${Date.now()}`;
              const tx = await sendKaspaTransaction(kaspaState.provider as KaspaWalletProvider, {
                to: getVBlogTreasuryL1Address(),
                amount: String(kasToSompi(payKas)),
                note,
                payload: utf8ToHex(note),
              });
              if (tx.status === 'failed' || !tx.txHash) {
                throw new Error(tx.error ?? 'Unlock transaction failed');
              }
              const nextUnlocked = unlockAuthorModule(kaspaState.address, offer.id);
              onUnlocked?.(nextUnlocked);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? 'Unlocking...' : 'Unlock'}
        </button>
      }
    />
  );
}
