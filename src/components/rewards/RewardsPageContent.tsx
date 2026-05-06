'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Info } from 'lucide-react';
import { useAccount, useChainId } from 'wagmi';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { currentSeasonWindowUtc } from '@/lib/leaderboard/seasons';
import { FilterBar } from '@/components/FilterBar';
import { ChroniclesFilterDropdown } from '@/components/chronicles/ChroniclesFilterDropdown';
import { rewardsItemRequiresL2Gate } from '@/components/rewards/RewardsL2Gate';
import { GameItemCard, type GameItemEffectLine } from '@/components/games/shop/GameItemCard';
import { Tooltip } from '@/components/ui/Tooltip';
import { gameTooltipRich } from '@/components/games/gameTooltipRich';
import { useRedeemablePointsBreakdown } from '@/hooks/useRedeemablePointsBreakdown';
import {
  UNIFIED_REWARD_CATALOG,
  isTokenPoolClaimItem,
  type RewardCatalogKind,
  type RewardFulfillment,
  type UnifiedRewardItem,
} from '@/lib/rewards/unified-catalog';
import { recordUnifiedCatalogRedeem } from '@/lib/rewards/hub-ledger';
import { describeL2RedemptionAvailability } from '@/lib/rewards/l2-redemption-route';
import { readRewardsL2SessionVerified } from '@/lib/rewards/rewards-l2-session-verify';
import { CHAIN_IDS } from '@/lib/wagmi';
import { readMinecorePoolAndDailyHeadroom } from '@/lib/game/minecore/read-pool-daily-headroom';
import { RewardsHistoryTable } from '@/components/rewards/RewardsHistoryTable';

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

type RewardsHubTab = 'catalog' | 'history' | 'balances';

function rewardsHubTabFromHash(hash: string): RewardsHubTab | null {
  const h = hash.replace(/^#/, '');
  if (h === 'rewards-history') return 'history';
  if (h === 'rewards-balances') return 'balances';
  if (
    h === 'rewards-catalog' ||
    h === 'rewards-filters' ||
    h === 'rewards-intro' ||
    h === 'rewards-l2-gate'
  ) {
    return 'catalog';
  }
  return null;
}

function fulfillmentLabel(f: RewardFulfillment): string {
  if (f === 'local_mvp') return 'Local MVP';
  if (f === 'l2_contract') return 'L2 routed';
  return 'Coming soon';
}

function catalogMatches(kind: RewardCatalogKind, filter: KindFilter): boolean {
  return filter === 'all' || kind === filter;
}

function fulfillmentMatches(f: RewardFulfillment, filter: FulfillmentFilter): boolean {
  return filter === 'all' || f === filter;
}

function poolCapSpecifications(sym: 'GRID' | 'KREX', kaspaAddr: string): GameItemEffectLine[] {
  const h = readMinecorePoolAndDailyHeadroom(kaspaAddr);
  if (!h) {
    return [
      {
        label: 'Pool & caps',
        value: 'Connect wallet',
        color: 'zinc',
        specTooltip: 'Wallet-scoped Minecore file supplies daily headroom and shared pool display constants.',
      },
    ];
  }
  const poolRem = sym === 'GRID' ? h.poolGridRemaining : h.poolKrexRemaining;
  const dailyRem = sym === 'GRID' ? h.gridDailyRemainingPts : h.krexDailyRemainingPts;
  const dailyCap = sym === 'GRID' ? h.gridDailyCap : h.krexDailyCap;
  return [
    {
      label: 'Pool (display)',
      value: `${poolRem.toLocaleString()} ${sym}`,
      color: 'sky',
      specTooltip:
        'Same display-only pool remaining model as Minecore redeem; authoritative balances arrive with server-backed pools.',
    },
    {
      label: 'Daily redeem budget',
      value: `${dailyRem.toLocaleString()} / ${dailyCap.toLocaleString()} pts`,
      color: 'amber',
      specTooltip: `Refinement pts you can still route toward ${sym} today before hitting the Minecore daily cap (UTC day).`,
    },
  ];
}

function nonPoolSpecifications(item: UnifiedRewardItem): GameItemEffectLine[] {
  return [
    {
      label: 'Fulfillment',
      value: fulfillmentLabel(item.fulfillment),
      color: item.fulfillment === 'l2_contract' ? 'sky' : item.fulfillment === 'coming_soon' ? 'zinc' : 'emerald',
      specTooltip:
        item.fulfillment === 'local_mvp'
          ? 'Redemption is recorded locally on this device first (MVP). No EVM signature required unless the offer says otherwise.'
          : item.fulfillment === 'l2_contract'
            ? 'This path targets your verified EVM wallet on IGRA Mainnet when the on-chain route is active.'
            : 'This row is preview-only until partner plumbing ships.',
    },
    ...(item.effects ?? []),
  ];
}

export function RewardsPageContent() {
  const { state: kaspaState } = useKaspaWallet();
  const { isConnected: evmConnected, address: evmAddr } = useAccount();
  const chainId = useChainId();
  const breakdown = useRedeemablePointsBreakdown();
  const kaspaAddr = kaspaState.address ? normKaspa(kaspaState.address) : '';
  const season = useMemo(() => currentSeasonWindowUtc(), []);

  const [hubTab, setHubTab] = useState<RewardsHubTab>('catalog');
  useEffect(() => {
    function syncFromHash() {
      const next = rewardsHubTabFromHash(typeof window !== 'undefined' ? window.location.hash : '');
      if (next) setHubTab(next);
    }
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);
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
          `${it.title} ${it.description} ${it.category} ${it.effects?.map((e) => e.value).join(' ') ?? ''}`.toLowerCase().includes(q)),
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
    async (item: UnifiedRewardItem, quantityFromCard: number) => {
      setNote(null);
      if (!kaspaAddr) {
        setNote('Connect Kaspa L1 wallet to redeem with your unified balance.');
        return;
      }
      if (item.fulfillment === 'coming_soon') {
        setNote('This catalog item is staged for upcoming partner routes.');
        return;
      }

      if (isTokenPoolClaimItem(item) && item.tokenPoolRate) {
        const pointsSpend = Math.max(0, Math.floor(quantityFromCard));
        if (pointsSpend < 1) {
          setNote('Enter at least 1 pt to claim.');
          return;
        }
        if (breakdown.totalRedeemable < pointsSpend) {
          setNote(`Need ${pointsSpend.toLocaleString()} redeemable pts. Earn more from Minecore or Hub activity.`);
          return;
        }
        if (rewardsItemRequiresL2Gate(item.fulfillment)) {
          if (!evmConnected || !evmAddr) {
            setNote('Connect your EVM wallet in the L2 gate, then switch to IGRA Mainnet.');
            return;
          }
          if (!igraReady) {
            setNote('Switch your EVM wallet to IGRA Mainnet in the L2 gate.');
            return;
          }
          if (!readRewardsL2SessionVerified(CHAIN_IDS.IGRA_MAINNET, evmAddr)) {
            setNote('Tap Sign to verify in the L2 gate before token pool redemptions.');
            return;
          }
        }
        const tokenOut = Math.floor(pointsSpend * item.tokenPoolRate.tokensPerPoint);
        recordUnifiedCatalogRedeem({
          walletKaspaL1: kaspaAddr,
          seasonId: season.id,
          costPoints: pointsSpend,
          catalogItemId: item.id,
          quantity: Math.max(0, tokenOut),
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
                quantity: tokenOut,
                points: pointsSpend,
                fulfillment: item.fulfillment,
                payoutSymbol: item.tokenPoolRate.payoutSymbol,
              },
            }),
          );
        } catch {
          /* ignore */
        }

        setNote(
          `${item.title}: ${pointsSpend.toLocaleString()} pts → ${tokenOut.toLocaleString()} ${item.tokenPoolRate.payoutSymbol} (logged locally).${l2Extras}`,
        );
        return;
      }

      const unit = Math.max(1, Math.floor(item.costPointsPerUnit));
      const q = Math.max(item.minQty, Math.min(item.maxQty, Math.floor(quantityFromCard)));
      const cost = unit * q;
      if (breakdown.totalRedeemable < cost) {
        setNote(`Need ${cost.toLocaleString()} redeemable pts. Earn more from Minecore or Hub activity.`);
        return;
      }

      if (rewardsItemRequiresL2Gate(item.fulfillment)) {
        if (!evmConnected || !evmAddr) {
          setNote('Connect your EVM wallet in the L2 gate, then switch to IGRA Mainnet.');
          return;
        }
        if (!igraReady) {
          setNote('Switch your EVM wallet to IGRA Mainnet in the L2 gate.');
          return;
        }
        if (!readRewardsL2SessionVerified(CHAIN_IDS.IGRA_MAINNET, evmAddr)) {
          setNote('Tap Sign to verify in the L2 gate before token pool redemptions.');
          return;
        }
      }

      recordUnifiedCatalogRedeem({
        walletKaspaL1: kaspaAddr,
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
      <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        {(
          [
            { id: 'catalog' as const, label: 'Catalog' },
            { id: 'history' as const, label: 'History' },
            { id: 'balances' as const, label: 'Balances' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setHubTab(t.id);
              const anchor =
                t.id === 'catalog'
                  ? 'rewards-catalog'
                  : t.id === 'history'
                    ? 'rewards-history'
                    : 'rewards-balances';
              try {
                window.history.replaceState(null, '', `#${anchor}`);
              } catch {
                /* ignore */
              }
            }}
            className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors ${
              hubTab === t.id
                ? 'bg-[#0097b2] text-white shadow-md shadow-cyan-500/15'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {note ? (
        <p className="text-sm text-amber-700 dark:text-amber-300 px-1" role="status">
          {note}
        </p>
      ) : null}

      {hubTab === 'catalog' ? (
        <>
          <div id="rewards-filters" className="scroll-mt-24 flex flex-col gap-4 mb-2">
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

          <div id="rewards-catalog" className="scroll-mt-24 space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Offers</h2>
                <Tooltip
                  content={gameTooltipRich(
                    'Catalog',
                    <>
                      Filter and sort redeemable offers. Token pools convert pts using the rate shown on each card; fixed-price rows multiply pts per unit by quantity when quantity applies.
                    </>,
                  )}
                >
                  <button
                    type="button"
                    className="rounded-md p-1 text-zinc-400 hover:bg-zinc-200/80 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
                    aria-label="About catalog"
                  >
                    <Info className="h-5 w-5" aria-hidden />
                  </button>
                </Tooltip>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {filtered.length} item{filtered.length !== 1 ? 's' : ''} · spends consume Minecore refinement first, then hub ledger pts (same total as the halo counter).
              </p>
            </div>

            {filtered.length === 0 ? (
              <div className="p-10 text-center text-zinc-500 dark:text-zinc-400">No rewards match your filters.</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((item) => {
                  const poolClaim = isTokenPoolClaimItem(item);
                  const unit = poolClaim ? 1 : Math.max(1, Math.floor(item.costPointsPerUnit));
                  const fixedQty = !poolClaim && item.minQty === item.maxQty;

                  const maxAffordableQty = poolClaim
                    ? Math.max(1, Math.floor(breakdown.totalRedeemable))
                    : Math.min(
                        item.maxQty,
                        breakdown.totalRedeemable > 0 && unit > 0
                          ? Math.max(item.minQty, Math.floor(breakdown.totalRedeemable / unit))
                          : item.minQty,
                      );

                  const canInteractBase =
                    !!kaspaAddr &&
                    item.fulfillment !== 'coming_soon' &&
                    (poolClaim ? breakdown.totalRedeemable >= 1 : breakdown.totalRedeemable >= unit * item.minQty);

                  const l2Blocked =
                    rewardsItemRequiresL2Gate(item.fulfillment) &&
                    (!evmConnected ||
                      !evmAddr ||
                      !igraReady ||
                      !readRewardsL2SessionVerified(CHAIN_IDS.IGRA_MAINNET, evmAddr));

                  const buyDisabled = !canInteractBase || l2Blocked || item.fulfillment === 'coming_soon';

                  const buyLabel = item.fulfillment === 'coming_soon' ? 'Locked' : poolClaim ? 'Claim' : 'Redeem';

                  const specifications: GameItemEffectLine[] = poolClaim
                    ? poolCapSpecifications(item.tokenPoolRate!.payoutSymbol, kaspaAddr)
                    : nonPoolSpecifications(item);

                  return (
                    <div key={item.id} data-reward-kind={item.kind}>
                      <GameItemCard
                        kxListingAccent="hub"
                        title={item.title}
                        category={item.category}
                        description={<p>{item.description}</p>}
                        icon={item.icon}
                        imageSrc={item.imageSrc}
                        hideSpecificationsHeading
                        specifications={specifications}
                        priceOptions={[
                          {
                            currency: 'pts',
                            unitPrice: unit,
                            label: 'pts',
                          },
                        ]}
                        defaultCurrency="pts"
                        quantitySelector={
                          fixedQty ? undefined : { min: poolClaim ? 1 : item.minQty, max: Math.max(poolClaim ? 1 : item.minQty, maxAffordableQty) }
                        }
                        quantityLockedAt={fixedQty ? item.minQty : undefined}
                        hideQuantityLabel
                        pricingActionsLayout="stacked"
                        showQuantityMaxButton={!fixedQty}
                        pricingCalculationSummary={
                          item.fulfillment === 'coming_soon'
                            ? undefined
                            : poolClaim && item.tokenPoolRate
                              ? ({ pointsSpend }) => {
                                  const rate = item.tokenPoolRate!;
                                  const tok = Math.floor(pointsSpend * rate.tokensPerPoint);
                                  return `${pointsSpend.toLocaleString()} pts → ${tok.toLocaleString()} ${rate.payoutSymbol}`;
                                }
                              : fixedQty
                                ? ({ pointsSpend, quantity: q }) =>
                                    q <= 1 || pointsSpend === unit * q
                                      ? `${pointsSpend.toLocaleString()} pts`
                                      : `${q.toLocaleString()} × ${unit.toLocaleString()} = ${pointsSpend.toLocaleString()} pts`
                                : ({ quantity: q, pointsSpend }) =>
                                    `${q.toLocaleString()} × ${unit.toLocaleString()} = ${pointsSpend.toLocaleString()} pts`
                        }
                        buyLabel={buyLabel}
                        buyDisabled={buyDisabled}
                        hidePricing={false}
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
        </>
      ) : null}

      {hubTab === 'history' ? (
        <div id="rewards-history" className="scroll-mt-24 space-y-3">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">History</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Chronological hub ledger (earns and catalog spends). Matches the unified balance math shown in the halo header.
            </p>
          </div>
          <RewardsHistoryTable walletNorm={kaspaAddr.toLowerCase()} />
        </div>
      ) : null}

      {hubTab === 'balances' ? (
        <div id="rewards-balances" className="scroll-mt-24 space-y-4 max-w-2xl">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Balances</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Unified redeemable = Minecore refinement pts + hub ledger net (Chronicles and other earns, minus catalog spends). Catalog spends drain Minecore refinement first, then ledger remainder, so you cannot double-spend across Minecore and /rewards.
            </p>
          </div>
          {!kaspaAddr ? (
            <p className="text-sm text-zinc-500">Connect Kaspa to preview split lines.</p>
          ) : (
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/40 p-5 space-y-3">
              <div className="flex justify-between gap-4">
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Total redeemable</span>
                <span className="font-mono font-bold tabular-nums text-lg">{breakdown.totalRedeemable.toLocaleString()} pts</span>
              </div>
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 space-y-2">
                {breakdown.lines.map((line) => (
                  <div key={line.id} className="flex justify-between gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                    <span>{line.label}</span>
                    <span className="font-mono font-semibold tabular-nums">{line.points.toLocaleString()} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-zinc-500 dark:text-zinc-500 leading-relaxed">
            Keeping Catalog / History / Balances as three tabs stays lightweight: everything reads the same local stores without extra network calls.
            A fourth tab could host partner integrations or seasonal boosts later; avoid merging heavy dashboards here so the hub stays fast on mobile.
          </p>
        </div>
      ) : null}
    </div>
  );
}
