'use client';

import { useState } from 'react';
import { payKaspaL1 } from '@/lib/games/sdk';
import { useKaspaWallet } from '@/lib/kaspa/context';
import * as Icons from 'lucide-react';

const PANEL = 'rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6';
const LABEL = 'text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1.5 block';
const INPUT = 'h-11 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 text-sm font-semibold outline-none focus:border-sky-500 dark:text-white transition-colors';

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
    } catch {
      alert('Verification failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  const refineOutput = typeof refineAmount === 'number' ? refineAmount : 0;
  const redeemOutput = typeof redeemPoints === 'number'
    ? (targetToken === 'GRID' ? redeemPoints * 100 : redeemPoints * 10)
    : 0;

  return (
    <div className="space-y-4">

      {/* ── Diamond Refinement ── */}
      <div className={PANEL}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Diamond Refinement</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Convert mined diamonds into Refinement Points (1:1).</p>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-semibold text-amber-500">Available</div>
            <div className="text-xl font-bold tabular-nums text-amber-500">{diamondsBalance.toLocaleString()} D</div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 items-end">
          <div>
            <label className={LABEL}>Amount to Refine</label>
            <div className="relative">
              <input
                type="number"
                value={refineAmount}
                onChange={(e) => setRefineAmount(e.target.value === '' ? '' : Math.max(0, Math.min(diamondsBalance, parseInt(e.target.value, 10))))}
                placeholder="0"
                className={INPUT}
              />
              <button
                onClick={() => setRefineAmount(diamondsBalance)}
                className="absolute right-2 top-2 h-7 rounded px-2 text-[10px] font-bold uppercase bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
              >
                Max
              </button>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">You receive</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">+{refineOutput.toLocaleString()} Points</span>
            </div>
            <button
              onClick={() => {
                if (onRefine && typeof refineAmount === 'number') onRefine(refineAmount);
                setRefineAmount('');
              }}
              disabled={!refineAmount || refineAmount <= 0}
              className="k-cta-games h-11 w-full text-sm disabled:opacity-40"
            >
              Refine Now
            </button>
          </div>
        </div>
      </div>

      {/* ── Token Redemption ── */}
      <div className={PANEL}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Redeem Points</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Claim tokens to your L2 wallet.</p>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Balance</div>
            <div className="text-xl font-bold tabular-nums text-emerald-500">{refinementPointsBalance.toLocaleString()} P</div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Step 1: L2 Wallet */}
          <div className={`rounded-lg border p-4 transition-colors ${isVerified ? 'border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10' : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={LABEL} style={{marginBottom: 0}}>1. Link L2 Wallet</span>
              {isVerified && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                  <Icons.CheckCircle2 className="w-3 h-3" /> Linked
                </span>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                placeholder="kaspa:... or 0x..."
                value={l2Address}
                onChange={(e) => setL2Address(e.target.value)}
                disabled={isVerified}
                className={INPUT + ' flex-1 disabled:opacity-50'}
              />
              {!isVerified && (
                <button
                  onClick={handleVerify}
                  disabled={isVerifying || !l2Address}
                  className="px-4 h-11 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold uppercase transition-colors disabled:opacity-40"
                >
                  {isVerifying ? 'Wait…' : 'Verify'}
                </button>
              )}
            </div>
          </div>

          {/* Step 2 + 3: Token + Amount */}
          <div className="grid gap-3 sm:grid-cols-2 items-end">
            <div>
              <label className={LABEL}>2. Select Token</label>
              <div className="grid grid-cols-2 gap-2">
                {(['GRID', 'KREX'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTargetToken(t)}
                    className={`h-11 rounded-lg text-xs font-bold uppercase transition-all border ${
                      targetToken === t
                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={LABEL}>3. Amount</label>
              <div className="relative">
                <input
                  type="number"
                  value={redeemPoints}
                  onChange={(e) => setRedeemPoints(e.target.value === '' ? '' : Math.max(0, Math.min(refinementPointsBalance, parseInt(e.target.value, 10))))}
                  placeholder="0"
                  className={INPUT}
                />
                <button
                  onClick={() => setRedeemPoints(refinementPointsBalance)}
                  className="absolute right-2 top-2 h-7 rounded px-2 text-[10px] font-bold uppercase bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
                >
                  All
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              onClick={() => {
                if (onRedeem && typeof redeemPoints === 'number') onRedeem(redeemPoints);
                setRedeemPoints('');
              }}
              disabled={!isVerified || !redeemPoints || redeemPoints <= 0}
              className="k-cta-games h-11 w-full text-sm disabled:opacity-40"
            >
              {redeemPoints ? `Receive ${redeemOutput.toLocaleString()} ${targetToken}` : 'Redeem Points'}
            </button>
            <p className="mt-2 text-center text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
              Rate: 1 Point = {targetToken === 'GRID' ? '100 GRID' : '10 KREX'}
            </p>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
