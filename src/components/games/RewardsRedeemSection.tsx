'use client';

import { useState } from 'react';
import Link from 'next/link';

// Assume simple mock or imported SDK for Kaspa L1 payment
// In Kasparex, payKaspaL1 usually takes ({ amount, to, memo })
import { payKaspaL1 } from '@/lib/games/sdk';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { GameTooltip } from '@/components/game/diamond-veins/GameTooltip';

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
  
  // Note: we can use the Kaspa wallet context if we want to default the L2 address to current L1 address (they are often the same Kaspa format).
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
      // Trigger a small transaction for verification, similar to CrowdKAS campaign creation
      const result = await payKaspaL1({
        provider: kaspaWalletState.provider,
        fromKaspaAddress: kaspaWalletState.address,
        toKaspaAddress: 'kaspa:qre2h08c3wqyyd8d227z54nvzex4028wz3nvf4xy226jry9d5uqpqxdfwxfn2', // generic kasparex treasury
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
    alert(`Claim action for ${type} triggered! Smart contract connection coming soon.`);
  };

  return (
    <div className="space-y-6 mt-8">
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
          L2 Wallet Setup
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

      <div className="grid gap-6 md:grid-cols-2">
        {/* GRID Pool */}
        <div className="rounded-2xl border border-[#02abb8]/20 bg-white p-6 shadow-sm dark:border-[#02abb8]/10 dark:bg-zinc-900/60">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-[#02abb8]">GRID Pool</h4>
            <span className="text-xs font-semibold text-zinc-500">1 Diamond = 100 GRID</span>
          </div>
          <div className="mb-4 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            Available to claim: <strong className="text-[#02abb8]">{(diamondsBalance * 100).toLocaleString()} GRID</strong>
            <GameTooltip content="GRID tokens are the standard Kasparex game reward currency. The exchange rate is fixed by the current reward epoch.">
              <button type="button" className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-zinc-300 text-[8px] font-bold dark:border-zinc-600">
                ?
              </button>
            </GameTooltip>
          </div>
          <div className="space-y-3">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Diamonds to redeem:</label>
            <input
              type="number"
              min="0"
              max={diamondsBalance}
              value={redeemAmountGRID}
              onChange={(e) => setRedeemAmountGRID(Number(e.target.value))}
              className="w-full h-10 rounded-xl border border-zinc-200 px-3 text-sm focus:border-[#02abb8] focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-[#02abb8]"
            />
            <div className="text-sm font-semibold text-[#02abb8]">
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
        <div className="rounded-2xl border border-[#02abb8]/20 bg-white p-6 shadow-sm dark:border-[#02abb8]/10 dark:bg-zinc-900/60">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-[#02abb8]">KREX Pool</h4>
            <span className="text-xs font-semibold text-zinc-500">1 Diamond = 0.5 KREX</span>
          </div>
          <div className="mb-4 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            Available to claim: <strong className="text-[#02abb8]">{(diamondsBalance * 0.5).toLocaleString()} KREX</strong>
            <GameTooltip content="KREX tokens grant premium system features and governance power.">
              <button type="button" className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-zinc-300 text-[8px] font-bold dark:border-zinc-600">
                ?
              </button>
            </GameTooltip>
          </div>
          <div className="space-y-3">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Diamonds to redeem:</label>
            <input
              type="number"
              min="0"
              max={diamondsBalance}
              value={redeemAmountKREX}
              onChange={(e) => setRedeemAmountKREX(Number(e.target.value))}
              className="w-full h-10 rounded-xl border border-zinc-200 px-3 text-sm focus:border-[#02abb8] focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-[#02abb8]"
            />
            <div className="text-sm font-semibold text-[#02abb8]">
              You will receive: {(redeemAmountKREX * 0.5).toLocaleString()} KREX
            </div>
            <button
              onClick={() => handleClaim('KREX')}
              className="w-full rounded-xl bg-[#02abb8] px-4 py-2 font-semibold text-white transition-colors hover:bg-teal-500 h-11 text-sm mt-2"
            >
              Claim KREX
            </button>
          </div>
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
