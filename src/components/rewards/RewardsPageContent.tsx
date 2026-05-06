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
import { PointsTables } from '@/components/rewards/PointsTables';

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

type RewardsHubTab = 'catalog' | 'history' | 'balances' | 'points';

function rewardsHubTabFromHash(hash: string): RewardsHubTab | null {
  const h = hash.replace(/^#/, '');
  if (h === 'rewards-history') return 'history';
  if (h === 'rewards-balances') return 'balances';
  if (h === 'rewards-points' || h === 'module-scoring-rules' || h === 'nft-slot-points') return 'points';
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

function rewardsHubAnchor(tab: RewardsHubTab): string {
  switch (tab) {
    case 'catalog':
      return 'rewards-catalog';
    case 'history':
      return 'rewards-history';
    case 'balances':
      return 'rewards-balances';
    case 'points':
      return 'rewards-points';
  }
}

function fulfillmentLabel(f: RewardFulfillment): string {
  if (f === 'local_mvp') return 'Hub delivery';
  if (f === 'l2_contract') return 'Verified wallet delivery';
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
        label: 'Pool',
        value: 'Connect wallet',
        color: 'zinc',
        specTooltip: 'Connect the same Kaspa wallet you use across Kasparex Hub to see pool info for this offer.',
      },
    ];
  }
  const poolRem = sym === 'GRID' ? h.poolGridRemaining : h.poolKrexRemaining;
  return [
    {
      label: 'Pool',
      value: `About ${poolRem.toLocaleString()} ${sym} left`,
      color: 'sky',
      specTooltip:
        'Rough estimate of how much is left in the shared reward pool for this token on Kasparex Hub. Live totals will tighten up as partner rails go fully online.',
    },
  ];
}

function nonPoolSpecifications(item: UnifiedRewardItem): GameItemEffectLine[] {
  return [
    {
      label: 'Delivery',
      value: fulfillmentLabel(item.fulfillment),
      color: item.fulfillment === 'l2_contract' ? 'sky' : item.fulfillment === 'coming_soon' ? 'zinc' : 'emerald',
      specTooltip:
        item.fulfillment === 'local_mvp'
          ? 'We confirm your redemption here first and guide any extra steps on the offer itself.'
          : item.fulfillment === 'l2_contract'
            ? 'Uses your verified Layer 2 wallet when partner delivery is turned on for this offer.'
            : 'Not available yet — check back as partners open this reward.',
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
        setNote('Connect your Kaspa wallet in the header to redeem with your hub-wide balance.');
        return;
      }
      if (item.fulfillment === 'coming_soon') {
        setNote('This offer opens soon — partners are still wiring delivery.');
        return;
      }

      if (isTokenPoolClaimItem(item) && item.tokenPoolRate) {
        const pointsSpend = Math.max(0, Math.floor(quantityFromCard));
        if (pointsSpend < 1) {
          setNote('Use at least 1 point to claim from this pool.');
          return;
        }
        if (breakdown.totalRedeemable < pointsSpend) {
          setNote(`You need ${pointsSpend.toLocaleString()} redeemable points. Earn more by playing hub experiences and joining hub programs.`);
          return;
        }
        if (rewardsItemRequiresL2Gate(item.fulfillment)) {
          if (!evmConnected || !evmAddr) {
            setNote('Connect your EVM wallet using the verification strip below, then choose IGRA Mainnet.');
            return;
          }
          if (!igraReady) {
            setNote('Switch your EVM wallet to IGRA Mainnet using the controls below.');
            return;
          }
          if (!readRewardsL2SessionVerified(CHAIN_IDS.IGRA_MAINNET, evmAddr)) {
            setNote('Sign once in the verification strip below before claiming token pools.');
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
          ? ` ${describeL2RedemptionAvailability()} Saved to your Rewards activity on this device.`
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
          `${item.title}: ${pointsSpend.toLocaleString()} points → about ${tokenOut.toLocaleString()} ${item.tokenPoolRate.payoutSymbol}. Confirmation saved on this device.${l2Extras}`,
        );
        return;
      }

      const unit = Math.max(1, Math.floor(item.costPointsPerUnit));
      const q = Math.max(item.minQty, Math.min(item.maxQty, Math.floor(quantityFromCard)));
      const cost = unit * q;
      if (breakdown.totalRedeemable < cost) {
        setNote(`You need ${cost.toLocaleString()} redeemable points. Earn more by playing hub experiences and joining hub programs.`);
        return;
      }

      if (rewardsItemRequiresL2Gate(item.fulfillment)) {
        if (!evmConnected || !evmAddr) {
          setNote('Connect your EVM wallet using the verification strip below, then choose IGRA Mainnet.');
          return;
        }
        if (!igraReady) {
          setNote('Switch your EVM wallet to IGRA Mainnet using the controls below.');
          return;
        }
        if (!readRewardsL2SessionVerified(CHAIN_IDS.IGRA_MAINNET, evmAddr)) {
          setNote('Sign once in the verification strip below before claiming token pools.');
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
        ? ` ${describeL2RedemptionAvailability()} Saved to your Rewards activity on this device.`
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

      setNote(`${item.title} ×${q}: confirmation saved (${cost.toLocaleString()} points).${l2Extras}`);
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
      <div className="mb-6">
        <div className="k-control-group w-full overflow-x-auto">
          {(
            [
              { id: 'catalog' as const, label: 'Catalog' },
              { id: 'points' as const, label: 'Points' },
              { id: 'history' as const, label: 'History' },
              { id: 'balances' as const, label: 'Balances' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setHubTab(t.id);
                try {
                  window.history.replaceState(null, '', `#${rewardsHubAnchor(t.id)}`);
                } catch {
                  /* ignore */
                }
              }}
              className={`h-10 px-4 text-sm font-medium whitespace-nowrap transition-colors ${
                hubTab === t.id
                  ? 'bg-[#02abb8]/10 text-[#017a84] dark:text-[#8ff1f8]'
                  : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {note ? (
        <p className="text-sm text-amber-700 dark:text-amber-300 px-1" role="status">
          {note}
        </p>
      ) : null}

      {hubTab === 'catalog' ? (
        <>
          <div id="rewards-catalog" className="scroll-mt-24 space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Offers</h2>
                <Tooltip
                  content={gameTooltipRich(
                    'Offers',
                    <>
                      Browse everything you can unlock with redeemable points. Pools turn points into tokens at the rate on each card; other offers use a fixed price per item when quantity applies.
                    </>,
                  )}
                >
                  <button
                    type="button"
                    className="rounded-md p-1 text-zinc-400 hover:bg-zinc-200/80 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
                    aria-label="About offers"
                  >
                    <Info className="h-5 w-5" aria-hidden />
                  </button>
                </Tooltip>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {filtered.length} offer{filtered.length !== 1 ? 's' : ''} · one wallet-wide balance covers everything (matches the total above); spends draw from gameplay-linked points first, then your Rewards wallet.
              </p>
            </div>

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
                  ariaLabel="Filter delivery type"
                  value={fulfillmentFilter}
                  onChange={(v) => setFulfillmentFilter(v as FulfillmentFilter)}
                  allLabel="All delivery types"
                  options={[
                    { value: 'local_mvp', label: fulfillmentLabel('local_mvp') },
                    { value: 'l2_contract', label: fulfillmentLabel('l2_contract') },
                    { value: 'coming_soon', label: fulfillmentLabel('coming_soon') },
                  ]}
                  minWidthClassName="min-w-[190px]"
                />
                <ChroniclesFilterDropdown
                  ariaLabel="Sort offers"
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

            {filtered.length === 0 ? (
              <div className="p-10 text-center text-zinc-500 dark:text-zinc-400">No offers match your filters.</div>
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
                        specificationsBelowPricing
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
                                  return `${pointsSpend.toLocaleString()} points → about ${tok.toLocaleString()} ${rate.payoutSymbol}`;
                                }
                              : fixedQty
                                ? ({ pointsSpend, quantity: q }) =>
                                    q <= 1 || pointsSpend === unit * q
                                      ? `${pointsSpend.toLocaleString()} points`
                                      : `${q.toLocaleString()} × ${unit.toLocaleString()} = ${pointsSpend.toLocaleString()} points`
                                : ({ quantity: q, pointsSpend }) =>
                                    `${q.toLocaleString()} × ${unit.toLocaleString()} = ${pointsSpend.toLocaleString()} points`
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

      {hubTab === 'points' ? (
        <div id="rewards-points" className="scroll-mt-24 space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Points</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Leaderboard scoring rules — module reads and NFT slot tables used for seasonal scores.
            </p>
          </div>
          <PointsTables />
        </div>
      ) : null}

      {hubTab === 'history' ? (
        <div id="rewards-history" className="scroll-mt-24 space-y-3">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">History</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Newest activity first — points you earned and rewards you claimed across Kasparex Hub.
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
              Your redeemable total adds two buckets: points tied to gameplay on your wallet, plus credits tracked in your Rewards wallet (earned minus spent). When you redeem here, gameplay-linked points are used first so your balance stays honest everywhere on the hub.
            </p>
          </div>
          {!kaspaAddr ? (
            <p className="text-sm text-zinc-500">Connect your Kaspa wallet to see the split.</p>
          ) : (
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/40 p-5 space-y-3">
              <div className="flex justify-between gap-4">
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Total redeemable</span>
                <span className="font-mono font-bold tabular-nums text-lg">{breakdown.totalRedeemable.toLocaleString()} points</span>
              </div>
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 space-y-2">
                {breakdown.lines.map((line) => (
                  <div key={line.id} className="flex justify-between gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                    <span>{line.label}</span>
                    <span className="font-mono font-semibold tabular-nums">{line.points.toLocaleString()} points</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-zinc-500 dark:text-zinc-500 leading-relaxed">
            More ways to earn and redeem will appear here over time — seasonal boosts, partners, and new hub drops — without cluttering the main catalog.
          </p>
        </div>
      ) : null}
    </div>
  );
}
