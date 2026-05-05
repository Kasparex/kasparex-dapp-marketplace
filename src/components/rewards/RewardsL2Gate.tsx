'use client';

import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { CHAIN_IDS, igraMainnet } from '@/lib/wagmi';
import Link from 'next/link';

/** EVM readiness strip for Reward redemptions targeting IGRA Mainnet contracts. */
export function RewardsL2Gate(props: { disabled?: boolean; className?: string }) {
  const { address: evm, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, isPending: switching } = useSwitchChain();
  const target = CHAIN_IDS.IGRA_MAINNET;
  const onIgraMainnet = chainId === target && isConnected;
  const showSwitch = isConnected && !onIgraMainnet;

  return (
    <div
      className={`rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/40 p-4 sm:p-5 space-y-2 ${props.className ?? ''}`}
      id="rewards-l2-gate"
    >
      <p className="text-sm font-black uppercase tracking-widest text-[#02abb8]">Verify L2 wallet</p>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Redemptions that touch smart contracts should use an EVM wallet on IGRA Mainnet. Connect your L2 wallet and switch network before
        confirming token pool redemptions. Local-only perks still work with Kaspa L1 connected.
      </p>
      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
        <span>
          EVM:{' '}
          <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
            {evm ? `${evm.slice(0, 8)}…${evm.slice(-6)}` : 'not connected'}
          </span>
        </span>
        <span>
          Chain:{' '}
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">{isConnected ? chainId : '—'}</span>
          {onIgraMainnet ? <span className="ml-2 text-emerald-600 dark:text-emerald-400">IGRA OK</span> : null}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {!isConnected ? (
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 inline-flex items-center gap-2">
            Use your browser wallet modal (Rainbow Kit) from the header to connect EVM before L2-catalog items send real txs.
          </span>
        ) : showSwitch ? (
          <button
            type="button"
            disabled={props.disabled || switching}
            className="k-control-btn disabled:opacity-50"
            onClick={() =>
              switchChainAsync?.({ chainId: igraMainnet.id }).catch(() => {
                /* ignore wallet reject noise */
              })
            }
          >
            {switching ? 'Switching…' : 'Switch to IGRA Mainnet'}
          </button>
        ) : (
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">L2 prerequisite satisfied for guarded sends.</span>
        )}
        <Link href="/dapps" className="k-control-btn">
          Explore dApps
        </Link>
      </div>
    </div>
  );
}

export function rewardsItemRequiresL2Gate(itemFulfillment: 'l2_contract' | 'local_mvp' | 'coming_soon'): boolean {
  return itemFulfillment === 'l2_contract';
}
