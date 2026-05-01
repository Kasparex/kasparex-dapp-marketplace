'use client';

import { useState } from 'react';
import { Tooltip } from '@/components/ui/Tooltip';
import { gameTooltipRich } from '@/components/games/gameTooltipRich';

export function WalletBalanceCard({
  value,
  symbol,
  subtleLabel,
  onCopyAddress,
  onOpenExplorer,
}: {
  value: string;
  symbol: string;
  /** optional tiny label above the value */
  subtleLabel?: string;
  onCopyAddress?: () => void;
  onOpenExplorer?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="px-4 py-3">
      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 border border-zinc-200/60 dark:border-zinc-700/60">
        <div className="flex items-center justify-between gap-3">
          <div>
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

          {(onCopyAddress || onOpenExplorer) ? (
            <div className="flex items-center gap-1 shrink-0">
              {onCopyAddress ? (
                <Tooltip content={copied ? 'Copied' : 'Copy'}>
                  <button
                    type="button"
                    onClick={() => {
                      onCopyAddress?.();
                      setCopied(true);
                      window.setTimeout(() => setCopied(false), 900);
                    }}
                    className="p-2 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 transition-colors"
                    aria-label="Copy address"
                  >
                    {copied ? (
                      <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </Tooltip>
              ) : null}
              {onOpenExplorer ? (
                <Tooltip content={gameTooltipRich('Block explorer', 'Opens this address or activity in the network explorer.')}>
                  <button
                    type="button"
                    onClick={onOpenExplorer}
                    className="p-2 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 transition-colors"
                    aria-label="Open in explorer"
                  >
                    <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                </Tooltip>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

