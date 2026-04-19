'use client';

import Link from 'next/link';
import { GameTooltip } from '@/components/game/diamond-veins/GameTooltip';

const GARAGE_ITEMS = [
  { id: 'nitrogen-overclock', name: "Vector's Overclock", price: 100, priceKAS: 0.5, desc: '+25% Yield (1h)', icon: '⚡', type: 'yield' as const, mult: 0.25 },
  { id: 'crystal-resonance', name: 'Crystal Resonance', price: 500, priceKAS: 2, desc: '+50% Rare Drops', icon: '📡', type: 'luck' as const, mult: 0.5 },
  { id: 'ai-auto-refiner', name: 'ARIA Auto-Refiner', price: 2500, priceKAS: 10, desc: 'Auto-claim every 4h', icon: '🤖', type: 'efficiency' as const, mult: 0.1 },
];

export function UpgradesPanel({
  canPayWithL1,
  krexL1Balance,
  kasBalance,
  kasBalanceLoading,
  krexTier,
  getPriceAfterDiscount,
  buyingItemId,
  revenuePoolPct,
  onBuyKrex,
  onBuyKas,
}: {
  canPayWithL1: boolean;
  krexL1Balance: number;
  kasBalance: number;
  kasBalanceLoading: boolean;
  krexTier: string;
  getPriceAfterDiscount: (n: number) => number;
  buyingItemId: string | null;
  revenuePoolPct: number;
  onBuyKrex: (item: (typeof GARAGE_ITEMS)[0]) => void;
  onBuyKas: (item: (typeof GARAGE_ITEMS)[0]) => void;
}) {
  const kasValid = typeof kasBalance === 'number' && !Number.isNaN(kasBalance);
  const kasBalanceNum = kasValid ? kasBalance : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-zinc-100 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          <GameTooltip content="KREX tier reduces Garage KREX prices. KAS path uses native L1 send to the Garage address; receipts are registered server-side for idempotency.">
            <span className="cursor-help border-b border-dotted border-zinc-400 font-semibold text-zinc-800 dark:text-zinc-200">
              Shop rules
            </span>
          </GameTooltip>
          : tier <strong>{krexTier}</strong> · KasWare/Kastle for payments.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-100 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="flex items-center justify-between border-b border-zinc-200 p-6 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Garage Shop</h2>
          <span className="rounded-full border border-zinc-300 bg-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
            Upgrades
          </span>
        </div>

        <div className="p-6">
          {!canPayWithL1 && (
            <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
              Connect <strong>KasWare</strong> to pay with KREX or KAS.
            </div>
          )}

          <div className="space-y-4">
            {GARAGE_ITEMS.map((item) => {
              const priceAfterDiscount = getPriceAfterDiscount(item.price);
              const canAffordKREX = canPayWithL1 && krexL1Balance >= priceAfterDiscount;
              const canAffordKAS = canPayWithL1 && !kasBalanceLoading && kasBalanceNum >= item.priceKAS * 0.999;
              const hasDiscount = priceAfterDiscount < item.price;
              const isBuying = buyingItemId === item.id;

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-4 transition-colors dark:border-zinc-800 dark:bg-zinc-800/30"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-200 text-xl dark:bg-zinc-700">{item.icon}</div>
                      <div>
                        <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{item.name}</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Pay:</span>
                    {hasDiscount && <span className="text-zinc-400 line-through dark:text-zinc-500">{item.price} KREX</span>}
                    <span className="font-semibold text-emerald-600 dark:text-emerald-500">{priceAfterDiscount} KREX</span>
                    <span className="text-zinc-400 dark:text-zinc-500">or</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">{item.priceKAS} KAS</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={!canPayWithL1 || !canAffordKREX || isBuying}
                      onClick={() => void onBuyKrex(item)}
                      className="rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-3 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50 dark:text-emerald-400"
                    >
                      {isBuying ? '…' : 'Pay KREX'}
                    </button>
                    <button
                      type="button"
                      disabled={!canPayWithL1 || kasBalanceLoading || !canAffordKAS || isBuying}
                      onClick={() => void onBuyKas(item)}
                      className="rounded-lg border border-amber-500/40 bg-amber-500/20 px-3 py-2 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-500/30 disabled:cursor-not-allowed disabled:opacity-50 dark:text-amber-400"
                    >
                      {isBuying ? '…' : 'Pay KAS'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4">
            <p className="text-center text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              {revenuePoolPct}% of Garage revenue goes to the Diamond Veins rewards pool
            </p>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-zinc-500 dark:text-zinc-500">
        GRID claims use <Link href="/rewards-and-points" className="font-semibold text-emerald-600 underline dark:text-emerald-400">Rewards &amp; Points</Link> ·{' '}
        <Link href="/rewards" className="underline">
          Rewards
        </Link>
      </p>
    </div>
  );
}
