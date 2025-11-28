'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { DApp } from '@/lib/dapps';
import { getDefaultRewardsBreakdown } from '@/lib/rewards/mockData';
import { formatLargeNumber } from '@/lib/rewards/calculator';

interface DAppFeesModalProps {
  dapp: DApp;
  tokenTicker?: string | null;
}

// Mock fees data based on dApp category/name
function getDAppFees(dapp: DApp, tokenTicker: string): Array<{ action: string; cost: string; rewards: string }> {
  const name = dapp.name.toLowerCase();
  const category = dapp.category.toLowerCase();
  const rewards = getDefaultRewardsBreakdown(tokenTicker);

  // DAO Voting specific fees
  if (name.includes('dao') || name.includes('voting')) {
    return [
      { action: 'Proposal', cost: '10 KAS', rewards: `${formatLargeNumber(rewards.grtPerKas * 10)} GRID → ${formatLargeNumber(rewards.lrtPerKas * 10)} ${rewards.tokenTicker} → ${formatLargeNumber(rewards.xpPerKas * 10)} XP` },
      { action: 'Vote', cost: '1 KAS', rewards: `${formatLargeNumber(rewards.grtPerKas)} GRID → ${formatLargeNumber(rewards.lrtPerKas)} ${rewards.tokenTicker} → ${formatLargeNumber(rewards.xpPerKas)} XP` },
      { action: 'Change Vote', cost: '1 KAS', rewards: `${formatLargeNumber(rewards.grtPerKas)} GRID → ${formatLargeNumber(rewards.lrtPerKas)} ${rewards.tokenTicker} → ${formatLargeNumber(rewards.xpPerKas)} XP` },
    ];
  }

  // Subscription specific fees
  if (category === 'subscription' || name.includes('subscription')) {
    return [
      { action: 'Check Subscription', cost: '0.5 KAS', rewards: `${formatLargeNumber(rewards.grtPerKas * 0.5)} GRID → ${formatLargeNumber(rewards.lrtPerKas * 0.5)} ${rewards.tokenTicker} → ${formatLargeNumber(rewards.xpPerKas * 0.5)} XP` },
      { action: 'Subscribe', cost: '5 KAS', rewards: `${formatLargeNumber(rewards.grtPerKas * 5)} GRID → ${formatLargeNumber(rewards.lrtPerKas * 5)} ${rewards.tokenTicker} → ${formatLargeNumber(rewards.xpPerKas * 5)} XP` },
      { action: 'Renew', cost: '5 KAS', rewards: `${formatLargeNumber(rewards.grtPerKas * 5)} GRID → ${formatLargeNumber(rewards.lrtPerKas * 5)} ${rewards.tokenTicker} → ${formatLargeNumber(rewards.xpPerKas * 5)} XP` },
    ];
  }

  // Payment specific fees
  if (category === 'payment' || name.includes('payment')) {
    return [
      { action: 'Send Payment', cost: '1 KAS', rewards: `${formatLargeNumber(rewards.grtPerKas)} GRID → ${formatLargeNumber(rewards.lrtPerKas)} ${rewards.tokenTicker} → ${formatLargeNumber(rewards.xpPerKas)} XP` },
      { action: 'Request Payment', cost: '0.5 KAS', rewards: `${formatLargeNumber(rewards.grtPerKas * 0.5)} GRID → ${formatLargeNumber(rewards.lrtPerKas * 0.5)} ${rewards.tokenTicker} → ${formatLargeNumber(rewards.xpPerKas * 0.5)} XP` },
    ];
  }

  // Default fees for other dApps
  return [
    { action: 'Use dApp', cost: '1 KAS', rewards: `${formatLargeNumber(rewards.grtPerKas)} GRID → ${formatLargeNumber(rewards.lrtPerKas)} ${rewards.tokenTicker} → ${formatLargeNumber(rewards.xpPerKas)} XP` },
    { action: 'Premium Action', cost: '5 KAS', rewards: `${formatLargeNumber(rewards.grtPerKas * 5)} GRID → ${formatLargeNumber(rewards.lrtPerKas * 5)} ${rewards.tokenTicker} → ${formatLargeNumber(rewards.xpPerKas * 5)} XP` },
  ];
}

export function DAppFeesModal({ dapp, tokenTicker }: DAppFeesModalProps) {
  const [showModal, setShowModal] = useState(false);
  const rewards = getDefaultRewardsBreakdown(tokenTicker || undefined);
  const fees = getDAppFees(dapp, rewards.tokenTicker);

  return (
    <>
      <button
        className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
        onClick={() => setShowModal(true)}
        aria-label="View fees and rewards"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Fees & Rewards Modal */}
      {showModal && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
          
          {/* Modal Content */}
          <div
            className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Fees & Rewards
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  Base fees and rewards for {dapp.name}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Table */}
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Action</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Cost</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Rewards</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fees.map((fee, index) => (
                      <tr
                        key={index}
                        className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                          {fee.action}
                        </td>
                        <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">
                          {fee.cost}
                        </td>
                        <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">
                          {fee.rewards}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                  💡 Rewards are multiplied based on your KREX tier and NFT holdings. Fees may be reduced for KREX holders.
                </p>
              </div>

              {/* Token Explanation */}
              <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  Understanding Reward Tokens
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">
                  When you use this dApp, you receive two types of reward tokens:
                </p>
                <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-2 mb-3 list-disc list-inside">
                  <li>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">GRID (Global Reward Token):</span> Earned across the entire Kasparex ecosystem. Max supply: 100B. Deflationary.
                  </li>
                  <li>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{rewards.tokenTicker} (Local Reward Token):</span> Earned only through using this specific dApp. Max supply: 100M. Deflationary.
                  </li>
                </ul>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  You receive both tokens until their respective supplies are fully minted. Holding KREX and NFTs multiplies your rewards.
                </p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

