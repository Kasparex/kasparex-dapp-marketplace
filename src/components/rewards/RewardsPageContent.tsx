'use client';

import { useCallback, useMemo, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { currentSeasonWindowUtc } from '@/lib/leaderboard/seasons';
import { FilterBar } from '@/components/FilterBar';
import { ChroniclesFilterDropdown } from '@/components/chronicles/ChroniclesFilterDropdown';
import { RewardsL2Gate, rewardsItemRequiresL2Gate } from '@/components/rewards/RewardsL2Gate';
import { GameItemCard } from '@/components/games/shop/GameItemCard';
import { useRedeemablePointsBreakdown } from '@/hooks/useRedeemablePointsBreakdown';
import {
  UNIFIED_REWARD_CATALOG,
  type RewardCatalogKind,
  type RewardFulfillment,
  type UnifiedRewardItem,
} from '@/lib/rewards/unified-catalog';
import { appendHubLedgerRedeemSpend } from '@/lib/rewards/hub-ledger';
import { describeL2RedemptionAvailability } from '@/lib/rewards/l2-redemption-route';
import { CHAIN_IDS } from '@/lib/wagmi';

function normKaspa(a: string): string {
  try {
    return normalizeKaspaAddress(a);
  } catch {
    return a.startsWith('kaspa:') ? a : `kaspa:${a}`;
  }
}

type KindFilter = RewardCatalogKind | 'all';
type FulfillmentFilter = RewardFulfillment | 'all';

type SortKey = 'cost-asc' | 'cost-desc' | 'name-asc' | 'name-desc';

function fulfillmentLabel(f: RewardFulfillment): string {
  if (f === 'local_mvp') return 'Local MVP';
  if (f === 'l2_contract') return 'L2 routed';
  return 'Coming soon';
}

function fulfillmentBadgeClass(f: RewardFulfillment): string {
  if (f === 'local_mvp') return 'border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:text-emerald-100';
  if (f === 'l2_contract') return 'border-sky-500/35 bg-sky-500/10 text-sky-900 dark:text-sky-100';
  return 'border-zinc-400/35 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300';
}

function catalogMatches(kind: RewardCatalogKind, filter: KindFilter): boolean {
  return filter === 'all' || kind === filter;
}

function fulfillmentMatches(f: RewardFulfillment, filter: FulfillmentFilter): boolean {
  return filter === 'all' || f === filter;
}

export function RewardsPageContent() {
  const { state: kaspaState } = useKaspaWallet();
  const { isConnected: evmConnected, address: evmAddr } = useAccount();
  const chainId = useChainId();
  const breakdown = useRedeemablePointsBreakdown();
  const kaspaAddr = kaspaState.address ? normKaspa(kaspaState.address) : '';
  const season = useMemo(() => currentSeasonWindowUtc(), []);

  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [fulfillmentFilter, setFulfillmentFilter] = useState<FulfillmentFilter>('all');
  const [sort, setSort] = useState<SortKey>('cost-asc');
  const [note, setNote] = useState<string | null>(null);

  const igraReady = Boolean(evmConnected && chainId === CHAIN_IDS.IGRA_MAINNET);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = UNIFIED_REWARD_CATALOG.filter(
      (it) =>
        catalogMatches(it.kind, kindFilter) &&
        fulfillmentMatches(it.fulfillment, fulfillmentFilter) &&
        (q.length === 0 ||
          `${it.title} ${it.description} ${it.category}`.toLowerCase().includes(q)),
    );
    const next = [...base];
    next.sort((a, b) => {
      if (sort === 'name-asc') return a.title.localeCompare(b.title);
      if (sort === 'name-desc') return b.title.localeCompare(a.title);
      if (sort === 'cost-asc') return a.costPointsPerUnit - b.costPointsPerUnit || a.title.localeCompare(b.title);
      return b.costPointsPerUnit - a.costPointsPerUnit || a.title.localeCompare(b.title);
    });
    return next;
  }, [search, kindFilter, fulfillmentFilter, sort]);

  const redeem = useCallback(
    async (item: UnifiedRewardItem, qty: number) => {
      setNote(null);
      if (!kaspaAddr) {
        setNote('Connect Kaspa L1 wallet to redeem with your unified balance.');
        return;
      }
      if (item.fulfillment === 'coming_soon') {
        setNote('This catalog item is staged for upcoming partner routes.');
        return;
      }

      const unit = Math.max(1, Math.floor(item.costPointsPerUnit));
      const q = Math.max(item.minQty, Math.min(item.maxQty, Math.floor(qty)));
      const cost = unit * q;
      if (breakdown.totalRedeemable < cost) {
        setNote(`Need ${cost.toLocaleString()} redeemable points. Earn more from Minecore or Chronicles activity.`);
        return;
      }

      if (rewardsItemRequiresL2Gate(item.fulfillment)) {
        if (!evmConnected || !evmAddr) {
          setNote('Connect an EVM wallet and verify IGRA Mainnet inside the Rewards L2 gate first.');
          return;
        }
        if (!igraReady) {
          setNote('Switch your EVM wallet to IGRA Mainnet via the Rewards L2 gate.');
          return;
        }
      }

      appendHubLedgerRedeemSpend({
        walletL1: kaspaAddr,
        seasonId: season.id,
        costPoints: cost,
        catalogItemId: item.id,
        quantity: q,
      });

      const l2Extras = rewardsItemRequiresL2Gate(item.fulfillment)
        ? ` ${describeL2RedemptionAvailability()} Local ledger captures this intent.`
        : '';

      try {
        window.dispatchEvent(
          new CustomEvent('reward-catalog-redeem', {
            detail: {
              walletKaspa: kaspaAddr,
              evm: evmAddr,
              catalogItemId: item.id,
              quantity: q,
              points: cost,
              fulfillment: item.fulfillment,
            },
          }),
        );
      } catch {
        /* ignore */
      }

      setNote(`${item.title} ×${q}: recorded locally (${cost.toLocaleString()} pts).${l2Extras}`);
    },
    [breakdown.totalRedeemable, igraReady, evmAddr, evmConnected, kaspaAddr, season.id],
  );

  const kindDropdownOptions = useMemo(
    () =>
      ([
        { value: 'token_pool', label: 'Token pools' },
        { value: 'badge', label: 'Badges' },
        { value: 'perk', label: 'Perks' },
        { value: 'coupon', label: 'Coupons' },
        { value: 'partner_pool', label: 'Partner pools' },
      ] satisfies { value: RewardCatalogKind; label: string }[]).map((o) => o),
    [],
  );

  return (
    <div className="space-y-8">
      <RewardsL2Gate />

      <div id="rewards-filters" className="scroll-mt-24 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/40 p-4 sm:p-5">
        <FilterBar
          search={{ value: search, onChange: setSearch, placeholder: 'Search rewards, perks, badges, pools…' }}
          onReset={() => {
            setSearch('');
            setKindFilter('all');
            setFulfillmentFilter('all');
            setSort('cost-asc');
          }}
          flexWrap
        >
          <ChroniclesFilterDropdown
            ariaLabel="Filter reward kinds"
            value={kindFilter}
            onChange={(v) => setKindFilter(v as KindFilter)}
            allLabel="All kinds"
            options={kindDropdownOptions}
            minWidthClassName="min-w-[170px]"
          />
          <ChroniclesFilterDropdown
            ariaLabel="Filter fulfillment"
            value={fulfillmentFilter}
            onChange={(v) => setFulfillmentFilter(v as FulfillmentFilter)}
            allLabel="All fulfillment modes"
            options={[
              { value: 'local_mvp', label: fulfillmentLabel('local_mvp') },
              { value: 'l2_contract', label: fulfillmentLabel('l2_contract') },
              { value: 'coming_soon', label: fulfillmentLabel('coming_soon') },
            ]}
            minWidthClassName="min-w-[190px]"
          />
          <ChroniclesFilterDropdown
            ariaLabel="Sort catalog"
            value={sort}
            onChange={(v) => setSort(v as SortKey)}
            allLabel="Cost (asc)"
            options={[
              { value: 'cost-asc', label: 'Cost (low→high)' },
              { value: 'cost-desc', label: 'Cost (high→low)' },
              { value: 'name-asc', label: 'Name (A-Z)' },
              { value: 'name-desc', label: 'Name (Z-A)' },
            ]}
            minWidthClassName="min-w-[180px]"
          />
        </FilterBar>
      </div>

      {note ? (
        <p className="text-sm text-amber-700 dark:text-amber-300 px-1" role="status">
          {note}
        </p>
      ) : null}

      <div id="rewards-catalog" className="scroll-mt-24 space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Catalog</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {filtered.length} item{filtered.length !== 1 ? 's' : ''} · cards mirror Minecore shop layout for consistent quantity selection.
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center text-zinc-500 dark:text-zinc-400">No rewards match your filters.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => {
              const unit = Math.max(1, Math.floor(item.costPointsPerUnit));
              const maxAffordableQty = Math.min(
                item.maxQty,
                breakdown.totalRedeemable > 0 && unit > 0
                  ? Math.max(item.minQty, Math.floor(breakdown.totalRedeemable / unit))
                  : item.minQty,
              );

              const canInteractBase =
                !!kaspaAddr &&
                item.fulfillment !== 'coming_soon' &&
                breakdown.totalRedeemable >= unit * item.minQty;

              const l2Blocked =
                rewardsItemRequiresL2Gate(item.fulfillment) && (!evmConnected || !igraReady);

              const buyDisabled = !canInteractBase || l2Blocked || item.fulfillment === 'coming_soon';

              return (
                <div key={item.id} data-reward-kind={item.kind}>
                  <GameItemCard
                    title={item.title}
                    category={item.category}
                    description={
                      <>
                        <p>{item.description}</p>
                        {item.fulfillmentNotes ? (
                          <p className="text-xs mt-3 text-zinc-500">{item.fulfillmentNotes}</p>
                        ) : null}
                      </>
                    }
                    icon={item.icon}
                    imageSrc={item.imageSrc}
                    specifications={[
                      {
                        label: 'Fulfillment',
                        value: fulfillmentLabel(item.fulfillment),
                        color: item.fulfillment === 'l2_contract' ? 'sky' : item.fulfillment === 'coming_soon' ? 'zinc' : 'emerald',
                      },
                      ...(item.effects ?? []),
                    ]}
                    priceOptions={[
                      {
                        currency: 'PTS',
                        unitPrice: unit,
                        label: 'Redeemable points',
                      },
                    ]}
                    defaultCurrency="PTS"
                    quantitySelector={{ min: item.minQty, max: Math.max(item.minQty, maxAffordableQty) }}
                    buyLabel={item.fulfillment === 'coming_soon' ? 'Locked' : 'Redeem'}
                    buyDisabled={buyDisabled}
                    hidePricing={false}
                    titleAccessory={
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${fulfillmentBadgeClass(item.fulfillment)}`}>
                        {item.kind.replace('_', ' ')}
                      </span>
                    }
                    onBuy={({ quantity }) => {
                      void redeem(item, quantity);
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
