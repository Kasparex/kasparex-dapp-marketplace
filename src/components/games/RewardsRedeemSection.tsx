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
  const [refineAmount, setRefineAmount] = useState<number | ''>('');
  const [redeemPoints, setRedeemPoints] = useState<number | ''>('');
  const [targetToken, setTargetToken] = useState<'GRID' | 'KREX'>('GRID');
  
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

  const refineOutput = typeof refineAmount === 'number' ? refineAmount * 1 : 0;
  const redeemOutput = typeof redeemPoints === 'number' ? (targetToken === 'GRID' ? redeemPoints * 100 : redeemPoints * 10) : 0;

  return (
    <div className="space-y-6">
      {/* ── SECTION 1: DIAMOND REFINEMENT ── */}
      <div className="group relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-950 shadow-2xl">
        <div className="relative z-10 rounded-[22px] bg-zinc-50 p-6 dark:bg-zinc-900/40">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">Diamond Refinement</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Convert mined diamonds into persistent points.</p>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Available</div>
              <div className="text-2xl font-black text-amber-500">{diamondsBalance.toLocaleString()} D</div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Amount to Refine</label>
              <div className="relative">
                <input
                  type="number"
                  value={refineAmount}
                  onChange={(e) => setRefineAmount(e.target.value === '' ? '' : Math.max(0, Math.min(diamondsBalance, parseInt(e.target.value, 10))))}
                  placeholder="0"
                  className="h-14 w-full rounded-2xl border border-zinc-200 bg-white px-5 text-xl font-black outline-none transition-all focus:border-amber-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                />
                <button 
                  onClick={() => setRefineAmount(diamondsBalance)}
                  className="absolute right-3 top-3 h-8 rounded-lg bg-zinc-100 px-3 text-[10px] font-black uppercase hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                >
                  Max
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-black uppercase text-zinc-400">Ratio 1:1</span>
                <span className="text-sm font-black text-emerald-500">+{refineOutput.toLocaleString()} Points</span>
              </div>
              <button
                onClick={() => {
                  if (onRefine && typeof refineAmount === 'number') onRefine(refineAmount);
                  setRefineAmount('');
                }}
                disabled={!refineAmount || refineAmount <= 0}
                className="h-14 w-full rounded-2xl bg-amber-500 font-black uppercase tracking-widest text-white shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40"
              >
                Refine Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: TOKEN REDEMPTION ── */}
      <div className="group relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-950 shadow-2xl">
        <div className="relative z-10 rounded-[22px] bg-zinc-50 p-6 dark:bg-zinc-900/40">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">Point Redemption</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Claim your rewards to an L2 wallet.</p>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Balance</div>
              <div className="text-2xl font-black text-emerald-500">{refinementPointsBalance.toLocaleString()} P</div>
            </div>
          </div>

          <div className="space-y-4">
            {/* L2 Verification Row */}
            <div className={`rounded-2xl border p-4 transition-colors ${isVerified ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">1. Link L2 Wallet</span>
                {isVerified && <span className="text-[9px] font-black uppercase text-emerald-500 flex items-center gap-1"><Icons.CheckCircle2 className="w-3 h-3" /> Linked</span>}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="kaspa:... or 0x..."
                  value={l2Address}
                  onChange={(e) => setL2Address(e.target.value)}
                  disabled={isVerified}
                  className="flex-1 h-11 rounded-xl border border-zinc-100 bg-zinc-50 px-4 text-xs font-medium outline-none dark:border-zinc-800 dark:bg-zinc-900/50"
                />
                {!isVerified && (
                  <button
                    onClick={handleVerify}
                    disabled={isVerifying || !l2Address}
                    className="px-4 h-11 rounded-xl bg-sky-500 text-white text-[10px] font-black uppercase hover:bg-sky-600 transition-colors"
                  >
                    {isVerifying ? 'Wait…' : 'Verify'}
                  </button>
                )}
              </div>
            </div>

            {/* Redemption Flow */}
            <div className="grid gap-4 sm:grid-cols-2 items-end">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">2. Select Token</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['GRID', 'KREX'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setTargetToken(t)}
                      className={`h-11 rounded-xl font-black text-xs transition-all ${targetToken === t ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'bg-white dark:bg-zinc-800 text-zinc-500 border border-zinc-100 dark:border-zinc-700'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">3. Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    value={redeemPoints}
                    onChange={(e) => setRedeemPoints(e.target.value === '' ? '' : Math.max(0, Math.min(refinementPointsBalance, parseInt(e.target.value, 10))))}
                    placeholder="0"
                    className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm font-black outline-none dark:border-zinc-800 dark:bg-zinc-950"
                  />
                  <button 
                    onClick={() => setRedeemPoints(refinementPointsBalance)}
                    className="absolute right-2 top-2 h-7 rounded bg-zinc-100 px-2 text-[9px] font-black uppercase dark:bg-zinc-800"
                  >
                    All
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  if (onRedeem && typeof redeemPoints === 'number') onRedeem(redeemPoints);
                  setRedeemPoints('');
                }}
                disabled={!isVerified || !redeemPoints || redeemPoints <= 0}
                className="h-14 w-full rounded-2xl bg-emerald-600 font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40"
              >
                {redeemPoints ? `Receive ${redeemOutput.toLocaleString()} ${targetToken}` : 'Redeem Points'}
              </button>
              <p className="mt-3 text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Ratio 1 P : {targetToken === 'GRID' ? '100' : '10'} {targetToken}
              </p>
            </div>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
