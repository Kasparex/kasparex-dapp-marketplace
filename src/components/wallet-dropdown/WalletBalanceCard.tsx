'use client';

export function WalletBalanceCard({
  value,
  symbol,
  subtleLabel,
}: {
  value: string;
  symbol: string;
  /** optional tiny label above the value */
  subtleLabel?: string;
}) {
  return (
    <div className="px-4 py-3">
      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 border border-zinc-200/60 dark:border-zinc-700/60">
        {subtleLabel ? (
          <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
            {subtleLabel}
          </div>
        ) : null}
        <div className="flex items-baseline gap-2">
          <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{value}</div>
          <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">{symbol}</div>
        </div>
      </div>
    </div>
  );
}

