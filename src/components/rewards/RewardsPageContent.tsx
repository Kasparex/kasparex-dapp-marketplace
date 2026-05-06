'use client';

import { useCallback, useMemo, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { currentSeasonWindowUtc } from '@/lib/leaderboard/seasons';
import { FilterBar } from '@/components/FilterBar';
import { ChroniclesFilterDropdown } from '@/components/chronicles/ChroniclesFilterDropdown';
import { rewardsItemRequiresL2Gate } from '@/components/rewards/RewardsL2Gate';
import { GameItemCard } from '@/components/games/shop/GameItemCard';
import { useRedeemablePointsBreakdown } from '@/hooks/useRedeemablePointsBreakdown';
import {
  UNIFIED_REWARD_CATALOG,
  isTokenPoolClaimItem,
  type RewardCatalogKind,
  type RewardFulfillment,
  type UnifiedRewardItem,
} from '@/lib/rewards/unified-catalog';
import { appendHubLedgerRedeemSpend } from '@/lib/rewards/hub-ledger';
import { describeL2RedemptionAvailability } from '@/lib/rewards/l2-redemption-route';
import { readRewardsL2SessionVerified } from '@/lib/rewards/rewards-l2-session-verify';
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
          setNote('Enter at least 1 point to claim.');
          return;
        }
        if (breakdown.totalRedeemable < pointsSpend) {
          setNote(`Need ${pointsSpend.toLocaleString()} redeemable points. Earn more from Minecore or Chronicles activity.`);
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
        appendHubLedgerRedeemSpend({
          walletL1: kaspaAddr,
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
        setNote(`Need ${cost.toLocaleString()} redeemable points. Earn more from Minecore or Chronicles activity.`);
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

      {note ? (
        <p className="text-sm text-amber-700 dark:text-amber-300 px-1" role="status">
          {note}
        </p>
      ) : null}

      <div id="rewards-catalog" className="scroll-mt-24 space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Catalog</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {filtered.length} item{filtered.length !== 1 ? 's' : ''} · token pools spend points at the published rate; other rows use fixed point prices per unit.
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center text-zinc-500 dark:text-zinc-400">No rewards match your filters.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => {
              const poolClaim = isTokenPoolClaimItem(item);
              const unit = poolClaim ? 1 : Math.max(1, Math.floor(item.costPointsPerUnit));

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
                    specifications={[
                      {
                        label: 'Fulfillment',
                        value: fulfillmentLabel(item.fulfillment),
                        color:
                          item.fulfillment === 'l2_contract' ? 'sky' : item.fulfillment === 'coming_soon' ? 'zinc' : 'emerald',
                      },
                      ...(item.effects ?? []),
                    ]}
                    priceOptions={[
                      {
                        currency: 'PTS',
                        unitPrice: unit,
                        label: poolClaim ? 'Points' : 'Redeemable points',
                      },
                    ]}
                    defaultCurrency="PTS"
                    quantitySelector={{ min: poolClaim ? 1 : item.minQty, max: Math.max(poolClaim ? 1 : item.minQty, maxAffordableQty) }}
                    quantityLabel={poolClaim ? 'Points' : 'Quantity'}
                    quantityLabelLayout="stacked"
                    pricingActionsLayout="stacked"
                    showQuantityMaxButton
                    pricingFooterExtra={
                      item.fulfillment === 'coming_soon'
                        ? undefined
                        : poolClaim && item.tokenPoolRate
                          ? ({ pointsSpend }) => {
                              const rate = item.tokenPoolRate!;
                              const tok = Math.floor(pointsSpend * rate.tokensPerPoint);
                              return (
                                <>
                                  <p className="mt-0.5 text-center text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                                    Rate: 1 pt = {rate.tokensPerPoint.toLocaleString()} {rate.payoutSymbol}
                                  </p>
                                  <p className="text-center text-[11px] font-bold tabular-nums text-zinc-700 dark:text-zinc-200">
                                    {pointsSpend.toLocaleString()} pts → {tok.toLocaleString()} {rate.payoutSymbol}
                                  </p>
                                </>
                              );
                            }
                          : ({ quantity: q, pointsSpend }) => (
                              <>
                                <p className="mt-0.5 text-center text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                                  Rate: {unit.toLocaleString()} pts per unit
                                </p>
                                <p className="text-center text-[11px] font-bold tabular-nums text-zinc-700 dark:text-zinc-200">
                                  {q.toLocaleString()} × {unit.toLocaleString()} = {pointsSpend.toLocaleString()} pts
                                </p>
                              </>
                            )
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
    </div>
  );
}
