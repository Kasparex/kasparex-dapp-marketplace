'use client';

import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useChainId } from 'wagmi';
import { DApp, getDAppNetworkType } from '@/lib/dapps';
import { getDAppPaymentConfig, getActionCost } from '@/lib/payments/config';
import { getDefaultRewardsBreakdown } from '@/lib/rewards/mockData';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import { getNativeCurrencySymbol } from '@/lib/wagmi';

interface DAppFeesModalProps {
  dapp: DApp;
  clickable?: boolean;
}

export function DAppFeesModal({ dapp, clickable = true }: DAppFeesModalProps) {
  const chainId = useChainId();
  const [showModal, setShowModal] = useState(false);
  const networkType = getDAppNetworkType(dapp);
  const paymentConfig = getDAppPaymentConfig(dapp, networkType);
  const nativeSymbol = getNativeCurrencySymbol(chainId);
  const rewards = getDefaultRewardsBreakdown(chainId);
  const fees = useMemo(() => {
    const actions = paymentConfig?.actions ?? [{ actionId: 'use-dapp', actionName: 'Use dApp', baseCost: 1.0 }];
    return actions.map((a) => {
      const costKAS = getActionCost(dapp, a.actionId, networkType);
      return {
        action: a.actionName,
        cost: `${costKAS} ${nativeSymbol}`,
        rewards: `${formatLargeNumber(costKAS * rewards.gridPerKas)} GRID → ${formatLargeNumber(costKAS * rewards.xpPerKas)} XP`,
      };
    });
  }, [dapp, networkType, paymentConfig?.actions, nativeSymbol, rewards.gridPerKas, rewards.xpPerKas]);

  if (!clickable) {
    return (
      <div className="p-1 text-zinc-400 rounded" title="Fees and rewards">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    );
  }

  return (
    <>
      <button
        className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
        onClick={() => setShowModal(true)}
        title="View fees and rewards"
        aria-label="View fees and rewards"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {showModal && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
          
          <div
            className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
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

            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
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
                  Rewards are multiplied based on your KREX tier and NFT holdings. Fees may be reduced for KREX holders.
                </p>
              </div>

              <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  Understanding Rewards
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">
                  When you use dApps in the Kasparex ecosystem, you earn GRID (Global Reward Token) and XP Points.
                </p>
                <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-2 mb-3 list-disc list-inside">
                  <li>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">GRID (Global Reward Token):</span> Earned across the entire Kasparex ecosystem. Fixed supply: 10B on Kaspa L1. L2 deployments are operational layers used for rewards and utility.
                  </li>
                  <li>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">XP Points:</span> Earned with every action. Unlock perks and badges as you level up.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
