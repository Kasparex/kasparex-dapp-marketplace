'use client';

import { useState } from 'react';
import Link from 'next/link';

import { payKaspaL1 } from '@/lib/games/sdk';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { GameTooltip } from '@/components/game/diamond-veins/GameTooltip';

export function RewardsRedeemSection({
  diamondsBalance,
  children,
}: {
  diamondsBalance: number;
  children?: React.ReactNode;
}) {
  const [redeemAmount, setRedeemAmount] = useState<number | ''>('');
  const [l2Address, setL2Address] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  
  const { state: kaspaWalletState } = useKaspaWallet();

  const handleVerify = async () => {
    if (!l2Address.startsWith('kaspa:') && !l2Address.startsWith('0x')) return;
    setIsVerifying(true);
    
    try {
      if (!kaspaWalletState.isConnected || !kaspaWalletState.address || !kaspaWalletState.provider) {
        alert('Please connect your Kaspa wallet first.');
        setIsVerifying(false);
        return;
      }
      const result = await payKaspaL1({
        provider: kaspaWalletState.provider,
        fromKaspaAddress: kaspaWalletState.address,
        toKaspaAddress: 'kaspa:qre2h08c3wqyyd8d227z54nvzex4028wz3nvf4xy226jry9d5uqpqxdfwxfn2',
        amountKas: 0.1,
      });
      
      if (result.ok) {
        setIsVerified(true);
      } else {
        alert('Verification payment failed. Please try again.');
      }
    } catch (e) {
      console.error(e);
      alert('Verification payment failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClaim = (type: string) => {
    if (!isVerified) return alert('Please verify your L2 address first.');
    alert(`Claim action for ${type} triggered with amount: ${redeemAmount}.`);
  };

  const currentRedeem = typeof redeemAmount === 'number' ? redeemAmount : 0;
  const gridReceived = currentRedeem * 100;
  const krexReceived = currentRedeem * 10;

  return (
    <div className="space-y-6 mt-8">
      {/* Verify L2 Wallet */}
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Verify L2 Wallet
          <GameTooltip content="To prevent Sybil attacks, we require a tiny Kaspa transaction to cryptographically verify wallet ownership before you can claim tokens to L2.">
            <button type="button" className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 text-[10px] font-bold dark:border-zinc-600">
              ?
            </button>
          </GameTooltip>
        </h3>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Assign and verify your L2 Kasplex address before claiming token rewards. A 0.1 KAS verification transaction is required.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Enter L2 Address (0x... or kaspa:...)"
            value={l2Address}
            onChange={(e) => setL2Address(e.target.value)}
            disabled={isVerified}
            className="flex-1 min-w-[250px] h-11 rounded-xl border border-zinc-200 px-4 text-sm dark:border-zinc-800 dark:bg-zinc-950 disabled:opacity-50"
          />
          <button
            onClick={handleVerify}
            disabled={isVerified || !l2Address}
            className="k-cta-games h-11 px-6 text-sm disabled:opacity-50"
          >
            {isVerifying ? 'Awaiting Payment...' : isVerified ? 'Verified ✓' : 'Verify'}
          </button>
        </div>
      </div>

      {/* Diamonds and Refinement Points */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
        <h3 className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          Diamonds and Refinement Points
        </h3>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Total available diamonds for redemption:{' '}
          <strong className="text-emerald-600 dark:text-emerald-400">{diamondsBalance.toLocaleString()}</strong>
        </p>

        <div className="space-y-4 max-w-lg">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setRedeemAmount(100)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors"
            >
              Redeem 100
            </button>
            <button
              onClick={() => setRedeemAmount(diamondsBalance)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors"
            >
              Redeem All
            </button>
          </div>
          
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Amount to redeem
            </label>
            <input
              type="number"
              min="0"
              max={diamondsBalance}
              value={redeemAmount}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (isNaN(v)) setRedeemAmount('');
                else setRedeemAmount(Math.max(0, Math.min(diamondsBalance, v)));
              }}
              placeholder="Enter amount"
              className="w-full h-11 rounded-xl border border-zinc-200 px-4 text-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-col gap-1 mt-4">
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Output Calculation:
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{gridReceived.toLocaleString()}</span> GRID
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{krexReceived.toLocaleString()}</span> KREX
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* GRID Pool */}
        <div className="rounded-2xl border border-emerald-500/20 bg-white p-6 shadow-sm dark:border-emerald-500/10 dark:bg-zinc-900/60">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">GRID Pool</h4>
            <span className="text-xs font-semibold text-zinc-500">1 Diamond = 100 GRID</span>
          </div>
          <div className="mb-4 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            Available GRID:{' '}
            <strong className="text-emerald-600 dark:text-emerald-400">
              {(diamondsBalance * 100).toLocaleString()}
            </strong>
          </div>
          <button
            onClick={() => handleClaim('GRID')}
            disabled={!currentRedeem || currentRedeem <= 0}
            className="w-full k-cta-games h-11 text-sm mt-2 disabled:opacity-50"
          >
            Claim {gridReceived.toLocaleString()} GRID
          </button>
        </div>

        {/* KREX Pool */}
        <div className="rounded-2xl border border-emerald-500/20 bg-white p-6 shadow-sm dark:border-emerald-500/10 dark:bg-zinc-900/60">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">KREX Pool</h4>
            <span className="text-xs font-semibold text-zinc-500">1 Diamond = 10 KREX</span>
          </div>
          <div className="mb-4 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            Available KREX:{' '}
            <strong className="text-emerald-600 dark:text-emerald-400">
              {(diamondsBalance * 10).toLocaleString()}
            </strong>
          </div>
          <button
            onClick={() => handleClaim('KREX')}
            disabled={!currentRedeem || currentRedeem <= 0}
            className="w-full k-cta-games h-11 text-sm mt-2 disabled:opacity-50"
          >
            Claim {krexReceived.toLocaleString()} KREX
          </button>
        </div>
      </div>

      {children}

      <div className="rounded-2xl border border-zinc-200 bg-zinc-100 p-6 text-center dark:border-zinc-800 dark:bg-zinc-900/50 flex flex-col items-center">
        <h3 className="mb-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">Looking for more benefits?</h3>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400 max-w-md">
          Visit the global rewards page to see all available perks and multi-game benefits.
        </p>
        <Link
          href="/rewards-and-points"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-6 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Go to Global Rewards
        </Link>
      </div>
    </div>
  );
}
