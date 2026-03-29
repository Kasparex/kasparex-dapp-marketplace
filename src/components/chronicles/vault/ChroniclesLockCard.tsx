'use client';

import type { ReactNode } from 'react';

export function ChroniclesLockCard({
  locked,
  title,
  description,
  priceLabel,
  children,
  unlockLabel = 'Unlock',
}: {
  locked: boolean;
  title: string;
  description?: string;
  priceLabel?: string;
  children?: ReactNode;
  /** Shown on CTA when locked */
  unlockLabel?: string;
}) {
  if (!locked) {
    return <>{children}</>;
  }

  return (
    <div className="relative rounded-2xl border border-cyan-500/25 overflow-hidden chronicles-vault-card">
      {children != null ? (
        <div className="blur-sm opacity-35 pointer-events-none select-none max-h-48 overflow-hidden">{children}</div>
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/88 via-zinc-950/80 to-cyan-950/40 backdrop-blur-md flex flex-col items-center justify-center p-6 sm:p-8 text-center gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#02abb8]">Locked</p>
        <h3 className="text-lg font-black text-zinc-100">{title}</h3>
        {description ? <p className="text-sm text-zinc-400 max-w-md leading-relaxed">{description}</p> : null}
        {priceLabel ? (
          <p className="text-xs font-mono text-cyan-300/90 border border-cyan-500/30 rounded-lg px-3 py-1.5">{priceLabel}</p>
        ) : null}
        <button
          type="button"
          disabled
          className="k-control-btn opacity-50 cursor-not-allowed text-xs font-bold uppercase tracking-wider"
          title="Purchases and on-chain verification coming soon"
        >
          {unlockLabel} (soon)
        </button>
      </div>
    </div>
  );
}
