'use client';

import { useCallback, useState } from 'react';
import { useAccount, useChainId, useSignMessage, useSwitchChain } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { CheckCircle2, Info } from 'lucide-react';
import { CHAIN_IDS, igraMainnet } from '@/lib/wagmi';
import { readRewardsL2SessionVerified, writeRewardsL2SessionVerified } from '@/lib/rewards/rewards-l2-session-verify';
import { Tooltip } from '@/components/ui/Tooltip';
import { gameTooltipRich } from '@/components/games/gameTooltipRich';

const L2_GATE_HELP_BODY =
  'For some offers, connect an EVM wallet on the right network and sign once to verify. Other rewards only need your main wallet.';

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
        <Tooltip content={gameTooltipRich('Wallet verification', L2_GATE_HELP_BODY)}>
          <button
            type="button"
            className="rounded-md p-1 text-zinc-500 hover:bg-zinc-200/80 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
            aria-label="About wallet verification"
          >
            <Info className="w-4 h-4" aria-hidden />
          </button>
        </Tooltip>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="min-w-0">
          EVM:{' '}
          <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200 break-all">
            {evm ? `${evm.slice(0, 8)}…${evm.slice(-6)}` : 'not connected'}
          </span>
        </span>
        <span className="shrink-0">
          Chain:{' '}
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">{isConnected ? chainId : '-'}</span>
          {onIgraMainnet ? <span className="ml-2 text-emerald-600 dark:text-emerald-400">IGRA OK</span> : null}
        </span>
      </div>
      <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-stretch sm:items-center min-w-0">
        {!isConnected ? (
          <ConnectButton.Custom>
            {({ openConnectModal, mounted }) => (
              <button
                type="button"
                disabled={props.disabled || !mounted}
                onClick={() => openConnectModal?.()}
                className="w-full sm:w-auto rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider bg-[#02abb8] text-white border border-transparent hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                Connect EVM wallet
              </button>
            )}
          </ConnectButton.Custom>
        ) : showSwitch ? (
          <button
            type="button"
            disabled={props.disabled || switching}
            className="w-full sm:w-auto rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider bg-[#02abb8] text-white border border-transparent hover:opacity-90 disabled:opacity-50 transition-opacity"
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
            className="w-full sm:w-auto rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider bg-[#02abb8] text-white border border-transparent hover:opacity-90 disabled:opacity-50 transition-opacity"
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
      <div id="rewards-l2-gate" className={`space-y-3 scroll-mt-24 ${props.className ?? ''}`}>
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
