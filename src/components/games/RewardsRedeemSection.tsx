'use client';

import { useState } from 'react';
import Link from 'next/link';
import { payKaspaL1 } from '@/lib/games/sdk';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { GameTooltip } from '@/components/game/diamond-veins/GameTooltip';
import { IconRewards } from '@/components/games/icons/TabIcons';

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
  const [directDiamondsAmount, setDirectDiamondsAmount] = useState<number | ''>('');
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

  const handleClaimAction = (type: 'GRID' | 'KREX', points: number) => {
    if (!isVerified) return alert('Please verify your L2 address first.');
    if (!points || points <= 0) return alert('Please enter an amount to claim.');
    if (onRedeem) {
      onRedeem(points);
    }
    alert(`Claim action for ${type} triggered with ${points} points.`);
  };

  const handleDirectClaim = (type: 'GRID' | 'KREX') => {
    if (!isVerified) return alert('Please verify your L2 address first.');
    if (!directDiamondsAmount || directDiamondsAmount <= 0) return alert('Please enter a diamond amount.');
    
    // Auto-Refine + Claim
    const points = Number(directDiamondsAmount); // 1 Diamond = 1 Point
    if (onRefine) onRefine(points);
    if (onRedeem) onRedeem(points);
    
    alert(`Direct Claim for ${type} triggered. Refined ${points} diamonds and claimed rewards.`);
    setDirectDiamondsAmount('');
  };

  const currentClaimPoints = typeof claimAmount === 'number' ? claimAmount : 0;
  const gridOutput = currentClaimPoints * 100;
  const krexOutput = currentClaimPoints * 10;

  const currentDirectDiamonds = typeof directDiamondsAmount === 'number' ? directDiamondsAmount : 0;
  const directGridOutput = currentDirectDiamonds * 100;
  const directKrexOutput = currentDirectDiamonds * 10;

  const handleRefineAction = () => {
    if (!refineAmount || refineAmount <= 0) return;
    if (onRefine) {
      onRefine(Number(refineAmount));
      setRefineAmount('');
    }
  };

  const totalRewardWeight = diamondsBalance + refinementPointsBalance;

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

      {/* Reward Weight Overview */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 dark:border-emerald-500/10 dark:bg-emerald-500/5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-2xl font-bold text-emerald-500">Total Reward Progress</div>
            <div className="text-sm text-zinc-500">Combined Diamonds and Refinement Points ready for claim.</div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-emerald-500">{(diamondsBalance + refinementPointsBalance).toLocaleString()}</span>
            <span className="text-sm font-bold uppercase tracking-wider text-emerald-500/60">Weight</span>
          </div>
        </div>
      </div>

      {/* One-Click Direct Claim (NEW) */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60 shadow-sm relative overflow-hidden">
        <div className="absolute -top-4 -right-4 p-4 opacity-5">
          <IconRewards className="w-32 h-32" />
        </div>
        <h3 className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          One-Click Claim (Diamonds to L2)
        </h3>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Skip manual refinement. Convert Diamonds directly into GRID or KREX tokens on L2.
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Diamonds in Bag: <span className="text-zinc-900 dark:text-zinc-100 font-bold">{diamondsBalance.toLocaleString()}</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max={diamondsBalance}
                  value={directDiamondsAmount}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (isNaN(v)) setDirectDiamondsAmount('');
                    else setDirectDiamondsAmount(Math.max(0, Math.min(diamondsBalance, v)));
                  }}
                  placeholder="Diamonds amount"
                  className="flex-1 h-11 rounded-xl border border-zinc-200 px-4 text-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                />
                <button
                  onClick={() => setDirectDiamondsAmount(diamondsBalance)}
                  className="px-3 h-11 text-xs font-bold rounded-xl bg-zinc-100 dark:bg-zinc-800"
                >
                  MAX
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-500/10 bg-zinc-50 dark:bg-zinc-800/40 p-4">
            <div className="text-xs font-semibold text-zinc-500 uppercase mb-2">You get:</div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {directGridOutput.toLocaleString()} GRID
            </div>
            <button
              onClick={() => handleDirectClaim('GRID')}
              disabled={!directDiamondsAmount}
              className="w-full k-cta-games h-9 text-xs mt-3 disabled:opacity-50"
            >
              One-Click GRID
            </button>
          </div>

          <div className="rounded-xl border border-emerald-500/10 bg-zinc-50 dark:bg-zinc-800/40 p-4">
            <div className="text-xs font-semibold text-zinc-500 uppercase mb-2">You get:</div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {directKrexOutput.toLocaleString()} KREX
            </div>
            <button
              onClick={() => handleDirectClaim('KREX')}
              disabled={!directDiamondsAmount}
              className="w-full k-cta-games h-9 text-xs mt-3 disabled:opacity-50"
            >
              One-Click KREX
            </button>
          </div>
        </div>
      </div>

      {/* Claim Points (Legacy Flow) */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60 shadow-sm">
        <h3 className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          Redeem Points (L2 Claim)
        </h3>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Claim accumulated refinement points into tokens on L2.
        </p>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Points: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{refinementPointsBalance.toLocaleString()}</span>
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
                  className="flex-1 h-11 rounded-xl border border-zinc-200 px-4 text-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                />
                <button
                  onClick={() => setClaimAmount(refinementPointsBalance)}
                  className="px-3 h-11 text-xs font-bold rounded-xl bg-zinc-100 dark:bg-zinc-800"
                >
                  MAX
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-500/5 bg-zinc-50/50 dark:bg-zinc-800/20 p-4">
            <div className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              {gridOutput.toLocaleString()} GRID
            </div>
            <button
              onClick={() => handleClaimAction('GRID', Number(claimAmount))}
              disabled={!claimAmount}
              className="w-full k-cta-games h-9 text-xs mt-3 disabled:opacity-50"
            >
              Claim GRID
            </button>
          </div>

          <div className="rounded-xl border border-emerald-500/5 bg-zinc-50/50 dark:bg-zinc-800/20 p-4">
            <div className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              {krexOutput.toLocaleString()} KREX
            </div>
            <button
              onClick={() => handleClaimAction('KREX', Number(claimAmount))}
              disabled={!claimAmount}
              className="w-full k-cta-games h-9 text-xs mt-3 disabled:opacity-50"
            >
              Claim KREX
            </button>
          </div>
        </div>
      </div>

      {/* Manual Refine Section */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60 shadow-sm">
        <h3 className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          Manual Refine (L1 Conversion)
        </h3>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Manually convert Diamonds to Refinement Points. 1 Diamond = 1 Point.
        </p>

        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2 flex-1 min-w-[200px]">
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
              className="w-full h-11 rounded-xl border border-zinc-200 px-4 text-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
            />
          </div>
          <button
            onClick={handleRefineAction}
            disabled={!refineAmount}
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
