'use client';

import type { ReactNode } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import type { ChronicleAccessMeta } from '@/lib/chronicles/types';
import { useChroniclesEntitlements } from '@/lib/chronicles/entitlements/useChroniclesEntitlements';
import { useChroniclesUnlock } from '@/components/chronicles/ChroniclesUnlockProvider';

export function ChroniclesChapterAccessGate({
  access,
  children,
}: {
  access?: ChronicleAccessMeta;
  children: ReactNode;
}) {
  const { state } = useKaspaWallet();
  const { isUnlocked } = useChroniclesEntitlements(state.address);
  const { openUnlock } = useChroniclesUnlock();

  if (!access || access.tier === 'free') {
    return <>{children}</>;
  }

  const ok = isUnlocked(access.contentId);

  if (ok) {
    return <>{children}</>;
  }

  return (
    <div className="relative rounded-xl overflow-hidden min-h-[200px]">
      <div className="blur-sm opacity-35 pointer-events-none select-none max-h-[480px] overflow-hidden">{children}</div>
      <button
        type="button"
        onClick={() => openUnlock(access.contentId)}
        className="absolute inset-0 bg-gradient-to-b from-zinc-950/88 via-zinc-950/80 to-cyan-950/40 backdrop-blur-md flex flex-col items-center justify-center p-5 sm:p-7 text-center gap-3 cursor-pointer border-0"
        aria-label="Unlock premium chapter"
      >
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#02abb8]">Premium chapter</p>
        <p className="text-base text-zinc-300 max-w-md leading-relaxed">
          Click to unlock and read this chapter. Payment is verified on-chain.
        </p>
        <span className="k-control-btn text-sm font-bold uppercase tracking-wide pointer-events-none">Unlock now</span>
      </button>
    </div>
  );
}
