'use client';

import { useState } from 'react';
import Link from 'next/link';

export function RewardsRedeemSection({
  diamondsBalance,
}: {
  diamondsBalance: number;
}) {
  const [redeemAmountGRID, setRedeemAmountGRID] = useState(0);
  const [redeemAmountKREX, setRedeemAmountKREX] = useState(0);
  const [l2Address, setL2Address] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const handleVerify = () => {
    if (!l2Address.startsWith('kaspa:') && !l2Address.startsWith('0x')) return;
    setIsVerifying(true);
    // Mock verification
    setTimeout(() => {
      setIsVerifying(false);
      setIsVerified(true);
    }, 1000);
  };

  const handleClaim = (type: string) => {
    if (!isVerified) return alert('Please verify your L2 address first.');
    alert(`Claim action for ${type} triggered! Smart contract connection coming soon.`);
  };

  return (
    <div className="space-y-6 mt-8">
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h3 className="mb-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">L2 Wallet Setup</h3>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Assign and verify your L2 address before claiming rewards.
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
            {isVerifying ? 'Verifying...' : isVerified ? 'Verified ✓' : 'Verify'}
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* GRID Pool */}
        <div className="rounded-2xl border border-emerald-500/20 bg-white p-6 shadow-sm dark:border-emerald-500/10 dark:bg-zinc-900/60">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">GRID Pool</h4>
            <span className="text-xs font-semibold text-zinc-500">1 Diamond = 100 GRID</span>
          </div>
          <div className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            Available to claim: <strong>{(diamondsBalance * 100).toLocaleString()} GRID</strong>
          </div>
          <div className="space-y-3">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Diamonds to redeem:</label>
            <input
              type="number"
              min="0"
              max={diamondsBalance}
              value={redeemAmountGRID}
              onChange={(e) => setRedeemAmountGRID(Number(e.target.value))}
              className="w-full h-10 rounded-xl border border-zinc-200 px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
            <div className="text-sm font-semibold text-emerald-600">
              You will receive: {(redeemAmountGRID * 100).toLocaleString()} GRID
            </div>
            <button
              onClick={() => handleClaim('GRID')}
              className="w-full k-cta-games h-11 text-sm mt-2"
            >
              Claim GRID
            </button>
          </div>
        </div>

        {/* KREX Pool */}
        <div className="rounded-2xl border border-amber-500/20 bg-white p-6 shadow-sm dark:border-amber-500/10 dark:bg-zinc-900/60">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-amber-600 dark:text-amber-400">KREX Pool</h4>
            <span className="text-xs font-semibold text-zinc-500">1 Diamond = 0.5 KREX</span>
          </div>
          <div className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            Available to claim: <strong>{(diamondsBalance * 0.5).toLocaleString()} KREX</strong>
          </div>
          <div className="space-y-3">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Diamonds to redeem:</label>
            <input
              type="number"
              min="0"
              max={diamondsBalance}
              value={redeemAmountKREX}
              onChange={(e) => setRedeemAmountKREX(Number(e.target.value))}
              className="w-full h-10 rounded-xl border border-zinc-200 px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
            <div className="text-sm font-semibold text-amber-600">
              You will receive: {(redeemAmountKREX * 0.5).toLocaleString()} KREX
            </div>
            <button
              onClick={() => handleClaim('KREX')}
              className="w-full rounded-xl bg-amber-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-amber-600 h-11 text-sm mt-2"
            >
              Claim KREX
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-purple-500/20 bg-purple-50 p-6 dark:border-purple-500/10 dark:bg-purple-900/10">
        <h4 className="mb-2 flex items-center gap-2 text-lg font-bold text-purple-700 dark:text-purple-400">
          More non-token rewards
        </h4>
        <p className="text-sm text-purple-600 dark:text-purple-300 mb-4">
          Redeem your Diamonds for exclusive in-game items, boosters, or partner perks. Select an item below:
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => handleClaim('Exclusive Skin')} className="rounded-lg border border-purple-200 bg-white px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:bg-zinc-900 dark:text-purple-300 dark:hover:bg-purple-900/30">
            Exclusive Skin (50 Diamonds)
          </button>
          <button onClick={() => handleClaim('XP Booster')} className="rounded-lg border border-purple-200 bg-white px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:bg-zinc-900 dark:text-purple-300 dark:hover:bg-purple-900/30">
            XP Booster (200 Diamonds)
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-100 p-6 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
        <h3 className="mb-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">Looking for more benefits?</h3>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Visit the global rewards page to see all available perks and multi-game benefits.
        </p>
        <Link
          href="/rewards"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-6 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Go to Global Rewards
        </Link>
      </div>
    </div>
  );
}
