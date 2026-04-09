'use client';

import Link from 'next/link';
import { useChainId, useSwitchChain } from 'wagmi';
import { CHAIN_IDS, getChainById } from '@/lib/wagmi';

export interface CrowdKASRightPanelProps {
  requiredChainId?: number;
}

export function CrowdKASRightPanel({ requiredChainId = CHAIN_IDS.IGRA_MAINNET }: CrowdKASRightPanelProps) {
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();
  const current = chainId ? getChainById(chainId) : null;
  const onRequiredChain = chainId === requiredChainId;

  return (
    <aside className="w-full lg:w-[320px] xl:w-[340px] shrink-0 space-y-4">
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/55 p-5 sm:p-6">
        <h3 className="text-xs font-black uppercase tracking-[0.18em] text-[#02abb8] mb-3">Network</h3>
        <div className="text-sm text-zinc-700 dark:text-zinc-300">
          Current: <span className="font-bold">{current?.name ?? (chainId ? `chain ${chainId}` : 'Not connected')}</span>
        </div>
        <div className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
          Required: <span className="font-bold">Igra Mainnet</span>
        </div>

        {!onRequiredChain && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Switch to Igra Mainnet to verify and manage your campaign.
            </p>
            <button
              type="button"
              onClick={() => switchChain?.({ chainId: requiredChainId })}
              disabled={isPending}
              className="k-control-btn w-full justify-center !bg-amber-600 hover:!bg-amber-700 !text-white !border-amber-500/30"
            >
              {isPending ? 'Switching…' : 'Switch network'}
            </button>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/55 p-5 sm:p-6">
        <h3 className="text-xs font-black uppercase tracking-[0.18em] text-[#02abb8] mb-3">How it works</h3>
        <ol className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300 list-decimal list-inside">
          <li>Verify your L2 wallet (tiny on-chain tx).</li>
          <li>Create your campaign (goal + deadline + metadata).</li>
          <li>Share your campaign link.</li>
          <li>
            If goal is reached and the deadline passes, you can <span className="font-semibold">claim</span>.
          </li>
          <li>If goal is not reached, donors can claim refunds.</li>
        </ol>
      </div>

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/55 p-5 sm:p-6">
        <h3 className="text-xs font-black uppercase tracking-[0.18em] text-[#02abb8] mb-3">Links</h3>
        <div className="space-y-2 text-sm">
          <Link href="/donations" className="block text-[#02abb8] font-bold hover:underline">
            Browse CrowdKAS campaigns
          </Link>
        </div>
      </div>
    </aside>
  );
}

