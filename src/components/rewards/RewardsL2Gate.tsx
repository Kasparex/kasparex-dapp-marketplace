'use client';

import { useCallback, useState } from 'react';
import { useAccount, useChainId, useSignMessage, useSwitchChain } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { CheckCircle2, Info } from 'lucide-react';
import { CHAIN_IDS, igraMainnet } from '@/lib/wagmi';
import { readRewardsL2SessionVerified, writeRewardsL2SessionVerified } from '@/lib/rewards/rewards-l2-session-verify';
import { Tooltip } from '@/components/ui/Tooltip';

const L2_GATE_HELP =
  'Token pool catalog items expect an EVM wallet on IGRA Mainnet. Connect, switch chain, then sign once to prove control. Local perks only need Kaspa L1.';

/** EVM readiness strip for Reward redemptions targeting IGRA Mainnet contracts. */
export function RewardsL2Gate(props: {
  disabled?: boolean;
  className?: string;
  /** When true, omit outer card chrome (e.g. inside halo stats panel). */
  embedded?: boolean;
  /** Bump when session verify flag updates so parents can recalc gated actions without reading storage indirectly. */
  onSessionVerifiedChange?: () => void;
}) {
  const { address: evm, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, isPending: switching } = useSwitchChain();
  const { signMessageAsync, isPending: signing } = useSignMessage();
  const target = CHAIN_IDS.IGRA_MAINNET;
  const onIgraMainnet = chainId === target && isConnected;
  const showSwitch = isConnected && !onIgraMainnet;

  const [, setVerifyTick] = useState(0);
  const sessionOk = readRewardsL2SessionVerified(chainId, evm);
  const verifiedUi = sessionOk && onIgraMainnet;

  const onSessionVerifiedChange = props.onSessionVerifiedChange;

  const handleSignVerify = useCallback(async () => {
    if (!evm || !onIgraMainnet || props.disabled) return;
    const issuedAtIso = new Date().toISOString();
    const message =
      `Kasparex Rewards hub: wallet check\n` +
      `address: ${evm}\n` +
      `chainId: ${target}\n` +
      `time (UTC): ${issuedAtIso}`;
    await signMessageAsync({ message });
    writeRewardsL2SessionVerified(target, evm);
    setVerifyTick((n) => n + 1);
    onSessionVerifiedChange?.();
  }, [evm, onIgraMainnet, props.disabled, onSessionVerifiedChange, signMessageAsync, target]);

  const inner = (
    <>
      <div className="flex items-center gap-2">
        <p className="text-sm font-black uppercase tracking-widest text-[#02abb8] m-0">Verify L2 wallet</p>
        <Tooltip content={L2_GATE_HELP}>
          <button
            type="button"
            className="rounded-md p-1 text-zinc-500 hover:bg-zinc-200/80 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
            aria-label="About L2 verification"
          >
            <Info className="w-4 h-4" aria-hidden />
          </button>
        </Tooltip>
      </div>
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
      <div className="flex flex-wrap gap-2 items-center">
        {!isConnected ? (
          <ConnectButton.Custom>
            {({ openConnectModal, mounted }) => (
              <button
                type="button"
                disabled={props.disabled || !mounted}
                onClick={() => openConnectModal?.()}
                className="k-control-btn bg-[#0097b2] text-white border-transparent hover:opacity-90 disabled:opacity-50"
              >
                Connect EVM wallet
              </button>
            )}
          </ConnectButton.Custom>
        ) : showSwitch ? (
          <button
            type="button"
            disabled={props.disabled || switching}
            className="k-control-btn disabled:opacity-50"
            onClick={() =>
              switchChainAsync?.({ chainId: igraMainnet.id }).catch(() => {
                /* wallet reject */
              })
            }
          >
            {switching ? 'Switching…' : 'Switch to IGRA Mainnet'}
          </button>
        ) : verifiedUi ? (
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> Wallet verified this session
          </span>
        ) : (
          <button
            type="button"
            disabled={props.disabled || signing}
            className="k-control-btn bg-[#0097b2] text-white border-transparent hover:opacity-90 disabled:opacity-50"
            onClick={() =>
              void handleSignVerify().catch(() => {
                /* sign rejected */
              })
            }
          >
            {signing ? 'Waiting for signature…' : 'Sign to verify'}
          </button>
        )}
      </div>
    </>
  );

  if (props.embedded) {
    return (
      <div id="rewards-l2-gate" className={`space-y-2 scroll-mt-24 ${props.className ?? ''}`}>
        {inner}
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/40 p-4 sm:p-5 space-y-2 ${props.className ?? ''}`}
      id="rewards-l2-gate"
    >
      {inner}
    </div>
  );
}

export function rewardsItemRequiresL2Gate(itemFulfillment: 'l2_contract' | 'local_mvp' | 'coming_soon'): boolean {
  return itemFulfillment === 'l2_contract';
}
