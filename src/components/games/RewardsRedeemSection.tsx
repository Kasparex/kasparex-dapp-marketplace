'use client';

import { useState } from 'react';
import Link from 'next/link';
import { payKaspaL1 } from '@/lib/games/sdk';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { Tooltip } from '@/components/ui/Tooltip';
import * as Icons from 'lucide-react';

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
  const [l2Address, setL2Address] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const [swapFrom, setSwapFrom] = useState<'diamonds' | 'points'>('diamonds');
  const [swapAmount, setSwapAmount] = useState<number | ''>('');
  const [swapTo, setSwapTo] = useState<'points' | 'GRID' | 'KREX'>('points');

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
        return;
      }
      const result = await payKaspaL1({
        provider: kaspaWalletState.provider,
        fromKaspaAddress: kaspaWalletState.address,
        toKaspaAddress: 'kaspa:qre2h08c3wqyyd8d227z54nvzex4028wz3nvf4xy226jry9d5uqpqxdfwxfn2',
        amountKas: 0.1,
      });
      if (result.ok) setIsVerified(true);
      else alert('Verification failed.');
    } catch (e) {
      alert('Verification failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  const maxAmount = swapFrom === 'diamonds' ? diamondsBalance : refinementPointsBalance;
  const currentAmount = typeof swapAmount === 'number' ? swapAmount : 0;

  let output = 0;
  if (swapFrom === 'diamonds') output = currentAmount; // 1:1 to points
  else if (swapTo === 'GRID')  output = currentAmount * 100;
  else if (swapTo === 'KREX')  output = currentAmount * 10;

  const handleSwap = () => {
    if (!currentAmount || currentAmount <= 0) return;
    if (swapFrom === 'diamonds') {
      if (onRefine) onRefine(currentAmount);
      setSwapFrom('points');
      setSwapTo('GRID');
    } else {
      if (!isVerified) return alert('Verify L2 wallet first.');
      if (onRedeem) onRedeem(currentAmount);
    }
    setSwapAmount('');
  };

  return (
    <div className="space-y-6">
      {/* ── Wallet Verification ── */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Icons.Wallet className="w-5 h-5 text-sky-500" />
              L2 Verification
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Verify your L2 address to claim rewards. Requires a 0.1 KAS fee.
            </p>
          </div>
          {isVerified && (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              <Icons.CheckCircle2 className="w-3 h-3" />
              Verified
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="L2 Address (kaspa:... or 0x...)"
            value={l2Address}
            onChange={(e) => setL2Address(e.target.value)}
            disabled={isVerified}
            className="flex-1 min-w-[200px] h-11 rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm focus:border-sky-500 outline-none dark:border-zinc-800 dark:bg-zinc-950 disabled:opacity-50"
          />
          <button
            onClick={handleVerify}
            disabled={isVerified || !l2Address || isVerifying}
            className="h-11 px-6 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold text-sm transition-all hover:opacity-90 disabled:opacity-40"
          >
            {isVerifying ? 'Verifying…' : isVerified ? 'Done' : 'Verify Now'}
          </button>
        </div>
      </div>

      {/* ── Unified Swap Panel ── */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/80 shadow-xl relative">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">Reward Swap</h3>
          <div className="flex gap-4">
             <div className="text-right">
                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Bag</div>
                <div className="text-sm font-black text-amber-500">{diamondsBalance.toLocaleString()} D</div>
             </div>
             <div className="text-right border-l border-zinc-100 dark:border-zinc-800 pl-4">
                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Points</div>
                <div className="text-sm font-black text-emerald-500">{refinementPointsBalance.toLocaleString()} P</div>
             </div>
          </div>
        </div>

        <div className="space-y-2">
          {/* FROM */}
          <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-950 p-4 border border-zinc-100 dark:border-zinc-800">
            <div className="flex justify-between mb-2">
              <span className="text-xs font-bold text-zinc-500 uppercase">From</span>
              <span className="text-xs font-bold text-zinc-400">Balance: {maxAmount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="number"
                value={swapAmount}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (isNaN(v)) setSwapAmount('');
                  else setSwapAmount(Math.max(0, Math.min(maxAmount, v)));
                }}
                placeholder="0.0"
                className="bg-transparent text-2xl font-black text-zinc-900 dark:text-zinc-100 outline-none flex-1 min-w-0"
              />
              <button
                onClick={() => setSwapFrom(swapFrom === 'diamonds' ? 'points' : 'diamonds')}
                className="flex items-center gap-2 bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-sm"
              >
                <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                  {swapFrom === 'diamonds' ? <Icons.Gem className="w-3 h-3 text-white" /> : <Icons.Zap className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm font-black uppercase">{swapFrom}</span>
              </button>
            </div>
          </div>

          {/* DIVIDER */}
          <div className="relative h-2 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-100 dark:border-zinc-800" /></div>
            <button
              onClick={() => {
                if (swapFrom === 'diamonds') { setSwapFrom('points'); setSwapTo('GRID'); }
                else { setSwapFrom('diamonds'); setSwapTo('points'); }
              }}
              className="relative z-10 p-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-full shadow-md hover:scale-110 transition-transform"
            >
              <Icons.ArrowDown className="w-4 h-4 text-zinc-500" />
            </button>
          </div>

          {/* TO */}
          <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-950 p-4 border border-zinc-100 dark:border-zinc-800">
            <div className="flex justify-between mb-2">
              <span className="text-xs font-bold text-zinc-500 uppercase">To (Estimated)</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 flex-1">
                {output.toLocaleString()}
              </div>
              <div className="flex gap-1 bg-white dark:bg-zinc-800 p-1 rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-sm">
                {(swapFrom === 'diamonds' ? ['points'] : ['GRID', 'KREX']).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSwapTo(t as any)}
                    className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg transition-all ${
                      swapTo === t ? 'bg-sky-500 text-white' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSwap}
          disabled={!currentAmount || (swapFrom === 'points' && !isVerified)}
          className="mt-6 w-full h-14 rounded-2xl bg-sky-500 text-white font-black text-lg uppercase tracking-wider shadow-lg shadow-sky-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:grayscale"
        >
          {swapFrom === 'diamonds' ? 'Refine Diamonds' : `Redeem to ${swapTo}`}
        </button>

        {swapFrom === 'points' && !isVerified && (
          <p className="mt-3 text-center text-[11px] font-bold text-rose-500 uppercase tracking-widest">
            Verify L2 Wallet to Redeem
          </p>
        )}
      </div>

      {children}

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase mb-2">Global Rewards</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
          Claimed tokens can be used across the Kasparex ecosystem.
        </p>
        <Link
          href="/rewards-and-points"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-6 text-xs font-bold text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
        >
          View Benefits Directory
        </Link>
      </div>
    </div>
  );
}
