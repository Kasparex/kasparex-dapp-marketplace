'use client';

import { useState } from 'react';
import Link from 'next/link';

import { payKaspaL1 } from '@/lib/games/sdk';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { GameTooltip } from '@/components/game/diamond-veins/GameTooltip';

export function RewardsRedeemSection({
  diamondsBalance,
  refinementPointsBalance,
  onRefine,
  onRedeem,
  children,
}: {
  diamondsBalance: number;
  refinementPointsBalance: number;
  onRefine?: (amount: number) => void;
  onRedeem?: (points: number) => void;
  children?: React.ReactNode;
}) {
  const [refineAmount, setRefineAmount] = useState<number | ''>('');
  const [claimAmount, setClaimAmount] = useState<number | ''>('');
  const [l2Address, setL2Address] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  
  const { state: kaspaWalletState } = useKaspaWallet();

  const handleVerify = async () => {
    if (!l2Address.startsWith('kaspa:') && !l2Address.startsWith('0x')) {
      alert('Please enter a valid L2 address (0x... or kaspa:...)');
      return;
    }
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

  const handleClaimAction = (type: 'GRID' | 'KREX') => {
    if (!isVerified) return alert('Please verify your L2 address first.');
    if (!claimAmount || claimAmount <= 0) return alert('Please enter an amount of points to claim.');
    if (onRedeem) {
      onRedeem(Number(claimAmount));
    }
    alert(`Claim action for ${type} triggered with ${claimAmount} points.`);
  };

  const currentClaimPoints = typeof claimAmount === 'number' ? claimAmount : 0;
  const gridOutput = currentClaimPoints * 100;
  const krexOutput = currentClaimPoints * 10;

  const handleRefineAction = () => {
    if (!refineAmount || refineAmount <= 0) return;
    if (onRefine) {
      onRefine(Number(refineAmount));
      setRefineAmount('');
    }
  };

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

      {/* Redeem V1 - Claim Points to Tokens */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <IconRewards className="w-16 h-16" />
        </div>
        <h3 className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          Claim Rewards (L2)
        </h3>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Redeem your accumulated refinement points into GRID and KREX tokens on L2.
        </p>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
          <div className="space-y-3">
            <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Accumulated Points: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{refinementPointsBalance.toLocaleString()}</span>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Points to claim
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max={refinementPointsBalance}
                  value={claimAmount}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (isNaN(v)) setClaimAmount('');
                    else setClaimAmount(Math.max(0, Math.min(refinementPointsBalance, v)));
                  }}
                  placeholder="Points amount"
                  className="flex-1 h-11 rounded-xl border border-zinc-200 px-4 text-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-emerald-500"
                />
                <button
                  onClick={() => setClaimAmount(refinementPointsBalance)}
                  className="px-3 h-11 text-xs font-bold rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
                >
                  MAX
                </button>
              </div>
            </div>
          </div>

          {/* GRID Pool */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-emerald-700 dark:text-emerald-400">GRID Output</h4>
              <span className="text-[10px] font-bold text-zinc-500">1:100</span>
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
              {gridOutput.toLocaleString()} <span className="text-xs font-bold opacity-70">GRID</span>
            </div>
            <button
              onClick={() => handleClaimAction('GRID')}
              disabled={!currentClaimPoints || currentClaimPoints <= 0}
              className="w-full k-cta-games h-9 text-xs mt-3 disabled:opacity-50"
            >
              Claim GRID
            </button>
          </div>

          {/* KREX Pool */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-emerald-700 dark:text-emerald-400">KREX Output</h4>
              <span className="text-[10px] font-bold text-zinc-500">1:10</span>
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
              {krexOutput.toLocaleString()} <span className="text-xs font-bold opacity-70">KREX</span>
            </div>
            <button
              onClick={() => handleClaimAction('KREX')}
              disabled={!currentClaimPoints || currentClaimPoints <= 0}
              className="w-full k-cta-games h-9 text-xs mt-3 disabled:opacity-50"
            >
              Claim KREX
            </button>
          </div>
        </div>
      </div>

      {/* Refine Diamonds - Diamonds to Points */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60 shadow-sm">
        <h3 className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          Refine Diamonds (L1)
        </h3>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Convert your in-game Diamonds into Refinement Points to prepare for L2 claiming.
        </p>

        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2 flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Available: <span className="text-zinc-900 dark:text-zinc-100 font-bold">{diamondsBalance.toLocaleString()} Diamonds</span>
            </label>
            <input
              type="number"
              min="0"
              max={diamondsBalance}
              value={refineAmount}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (isNaN(v)) setRefineAmount('');
                else setRefineAmount(Math.max(0, Math.min(diamondsBalance, v)));
              }}
              placeholder="Enter diamonds to refine"
              className="w-full h-11 rounded-xl border border-zinc-200 px-4 text-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-emerald-500"
            />
          </div>
          <button
            onClick={() => setRefineAmount(100)}
            className="h-11 px-4 text-xs font-bold rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
          >
            100
          </button>
          <button
            onClick={() => setRefineAmount(diamondsBalance)}
            className="h-11 px-4 text-xs font-bold rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
          >
            ALL
          </button>
          <button
            onClick={handleRefineAction}
            disabled={!refineAmount || refineAmount <= 0}
            className="k-cta-games h-11 px-8 text-sm disabled:opacity-50"
          >
            Refine Now
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
