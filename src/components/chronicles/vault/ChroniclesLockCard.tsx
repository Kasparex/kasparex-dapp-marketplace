'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

export function ChroniclesLockCard({
  locked,
  title,
  description,
  priceLabel,
  children,
  unlockLabel = 'Unlock',
  /** Blur preview (chapters); `none` keeps children interactive (vault checkout cards). */
  overlay = 'blur',
  vaultHref,
}: {
  locked: boolean;
  title: string;
  description?: string;
  priceLabel?: string;
  children?: ReactNode;
  /** Shown on CTA when locked */
  unlockLabel?: string;
  overlay?: 'blur' | 'none';
  vaultHref?: string;
}) {
  if (!locked) {
    return <>{children}</>;
  }

  if (overlay === 'none') {
    return (
      <div className="relative rounded-2xl border border-cyan-500/30 chronicles-vault-card">
        <div className="absolute top-3 right-3 z-10 rounded-lg bg-cyan-500/15 border border-cyan-500/35 px-2.5 py-1 text-xs font-black uppercase tracking-wider text-[#02abb8]">
          Locked
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl border border-cyan-500/25 overflow-hidden chronicles-vault-card">
      {children != null ? (
        <div className="blur-sm opacity-35 pointer-events-none select-none max-h-48 overflow-hidden">{children}</div>
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/88 via-zinc-950/80 to-cyan-950/40 backdrop-blur-md flex flex-col items-center justify-center p-6 sm:p-8 text-center gap-3">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#02abb8]">Locked</p>
        <h3 className="text-xl font-black text-zinc-100">{title}</h3>
        {description ? <p className="text-base text-zinc-400 max-w-md leading-relaxed">{description}</p> : null}
        {priceLabel ? (
          <p className="text-sm font-mono text-cyan-300/90 border border-cyan-500/30 rounded-lg px-3 py-1.5">{priceLabel}</p>
        ) : null}
        {vaultHref ? (
          <Link
            href={vaultHref}
            className="k-control-btn text-sm font-bold uppercase tracking-wide no-underline inline-flex items-center justify-center"
          >
            {unlockLabel} in Vault
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="k-control-btn opacity-50 cursor-not-allowed text-sm font-bold uppercase tracking-wider"
            title="Unlock route not configured"
          >
            {unlockLabel} (soon)
          </button>
        )}
      </div>
    </div>
  );
}
