'use client';

import { useMemo, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { signKrc20Transfer } from '@/lib/kaspa/l1WalletActions';
import { isValidKaspaAddress } from '@/lib/kaspa/sdk';
import { useKrexBoosters } from '@/hooks/useKrexBoosters';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';

const DEFAULT_PRIORITY_FEE_KAS = 0.001;
const KREX_DECIMALS = 8;

type BoosterOption = {
  id: string;
  label: string;
  priceKrex: number;
  mult: number;
  durationMs: number;
};

function fmtTime(until: number): string {
  const ms = Math.max(0, until - Date.now());
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (m <= 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

export function KrexBoosterCard(props: { gameId: string; title?: string }) {
  const { state: kaspaState } = useKaspaWallet();
  const { l1Balance } = useKREXBalance();
  const { multiplier, isActive, until, txHash, activate, clear } = useKrexBoosters(props.gameId);

  const [isBuying, setIsBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const treasury = (process.env.NEXT_PUBLIC_KREX_BOOSTER_TREASURY_ADDRESS || '').trim();
  const canPay =
    kaspaState.isConnected && (kaspaState.provider === 'kasware' || kaspaState.provider === 'kastle') && Boolean(kaspaState.provider);

  const options: BoosterOption[] = useMemo(
    () => [
      { id: 'boost:small', label: 'Overclock', priceKrex: 25, mult: 1.1, durationMs: 60 * 60 * 1000 },
      { id: 'boost:medium', label: 'Deep Scan', priceKrex: 75, mult: 1.2, durationMs: 2 * 60 * 60 * 1000 },
      { id: 'boost:large', label: 'ARIA Sync', priceKrex: 150, mult: 1.3, durationMs: 3 * 60 * 60 * 1000 },
    ],
    []
  );

  const handleBuy = async (opt: BoosterOption) => {
    setError(null);
    if (!canPay || !kaspaState.provider) {
      setError('Connect KasWare or Kastle to buy KREX boosters.');
      return;
    }
    if (!treasury || !isValidKaspaAddress(treasury)) {
      setError('KREX booster treasury is not configured.');
      return;
    }
    if (opt.priceKrex <= 0) return;
    if (l1Balance < opt.priceKrex) {
      setError('Insufficient KREX balance on L1 for this booster.');
      return;
    }

    setIsBuying(true);
    try {
      const amountSmallest = Math.floor(opt.priceKrex * Math.pow(10, KREX_DECIMALS));
      const inscribeJson = {
        p: 'KRC-20',
        op: 'transfer',
        tick: 'KREX',
        amt: amountSmallest.toString(),
        to: treasury,
        // note: leave "gameId" out for now; wallet inscription should be minimal/compatible
      };
      const payload = JSON.stringify(inscribeJson);
      const tx = await signKrc20Transfer(kaspaState.provider, payload, 4, treasury, DEFAULT_PRIORITY_FEE_KAS);

      activate({ mult: opt.mult, durationMs: opt.durationMs, txHash: tx });

      // Best-effort analytics hook (consistent with other parts of the app)
      try {
        (window as Window & { dispatchEvent: typeof window.dispatchEvent }).dispatchEvent(
          new CustomEvent('record-transaction', {
            detail: {
              type: 'krex-booster',
              gameId: props.gameId,
              boosterId: opt.id,
              boosterLabel: opt.label,
              priceKrex: opt.priceKrex,
              mult: opt.mult,
              durationMs: opt.durationMs,
              txHash: tx,
              status: 'completed',
            },
          })
        );
      } catch {
        // ignore
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Booster purchase failed');
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {props.title ?? 'KREX boosters'}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            Optional score boost (KRC-20 transfer). Simple v1, per-game.
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Active</div>
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{isActive ? `×${multiplier.toFixed(2)}` : '—'}</div>
        </div>
      </div>

      {isActive && until ? (
        <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Booster active</div>
              <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
                Ends in {fmtTime(until)}{txHash ? ` • ${txHash.slice(0, 10)}…${txHash.slice(-8)}` : ''}
              </div>
            </div>
            <button
              type="button"
              onClick={clear}
              className="k-control-btn h-9 px-3 text-xs"
            >
              Clear
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
          <div className="text-sm text-red-800 dark:text-red-300">{error}</div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {options.map((opt) => (
          <KxListingCard key={opt.id} accent="games" className="relative flex min-h-0 flex-col">
            <KxListingCardMedia aspectClass="aspect-[3/2]">
              <div className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="h-12 w-12 text-zinc-400 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="pointer-events-none absolute left-4 top-4 z-20 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <span className="inline-flex items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-200">
                  KRC-20
                </span>
              </div>
            </KxListingCardMedia>

            <KxListingCardBody className="relative z-10 flex min-h-0 flex-1 flex-col">
              <div className="mb-2 flex items-start justify-between gap-3">
                <h3 className="flex-1 truncate text-[15px] font-semibold text-zinc-900 dark:text-zinc-100" title={opt.label}>
                  {opt.label}
                </h3>
              </div>

              <div className="mb-4 min-h-0 flex-grow">
                <p className="line-clamp-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  ×{opt.mult.toFixed(2)} multiplier for {Math.round(opt.durationMs / 60000)} minutes.
                </p>
              </div>

              <div className="mt-auto border-t border-zinc-100 pt-4 dark:border-zinc-800">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-black tabular-nums text-zinc-900 dark:text-zinc-100">
                    {opt.priceKrex} KREX
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleBuy(opt)}
                    disabled={isBuying || !canPay}
                    className="k-cta-primary disabled:opacity-50"
                  >
                    Buy
                  </button>
                </div>
              </div>
            </KxListingCardBody>
          </KxListingCard>
        ))}
      </div>

      <div className="mt-3 text-[11px] text-zinc-500 dark:text-zinc-400">
        Requires KasWare/Kastle. Treasury: {treasury ? treasury.slice(0, 12) + '…' : 'not set'}.
      </div>
    </div>
  );
}

