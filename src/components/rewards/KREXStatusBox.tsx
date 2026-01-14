'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { createPortal } from 'react-dom';
import { KREX_TIERS } from '@/lib/rewards/types';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import { KREXBuyWizard } from './KREXBuyWizard';
import { useKREXBalance } from '@/hooks/useKREXBalance';

export function KREXStatusBox() {
  const { isConnected } = useAccount();
  const { balance, tier: krexTier, isLoading, error } = useKREXBalance();
  const tierConfig = KREX_TIERS[krexTier];
  const [showModal, setShowModal] = useState(false);
  const [showBuyWizard, setShowBuyWizard] = useState(false);

  return (
    <>
      <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            KREX Status
          </h3>
          <button
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
            onClick={() => setShowModal(true)}
            aria-label="View tier requirements"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>

      <div className="space-y-2">
        {isLoading && (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 py-2">
            Loading KREX balance...
          </div>
        )}
        {error && (
          <div className="text-xs text-red-500 dark:text-red-400 py-2">
            Error: {error}
          </div>
        )}
        {!isLoading && !error && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                Current Tier
              </span>
              <span className="text-sm font-bold text-[#02abb8]">
                {tierConfig.label}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                KREX Balance
              </span>
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {formatLargeNumber(balance)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                Multiplier
              </span>
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {tierConfig.multiplier}x
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                Fee
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {tierConfig.feePercent}%
              </span>
            </div>
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
              <button
                onClick={() => setShowBuyWizard(true)}
                className="block w-full mt-2 px-3 py-2 text-xs font-medium text-center bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg transition-colors"
              >
                Buy & Bridge KREX
              </button>
            </div>
          </>
        )}
      </div>

      </div>

      {/* KREX Requirements Modal */}
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
                  KREX Requirements
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  KREX holders with specific amounts unlock these rewards
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
                      <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Tier</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Requirement</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Reward Multiplier</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Fee</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Points Multiplier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(KREX_TIERS).map((tier) => {
                      const isUserTier = tier.tier === krexTier;
                      return (
                        <tr
                          key={tier.tier}
                          className={`border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${
                            isUserTier ? 'bg-[#02abb8]/10 dark:bg-[#02abb8]/20' : ''
                          }`}
                        >
                          <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                            {tier.label}
                            {isUserTier && (
                              <span className="ml-2 text-xs text-[#02abb8] font-medium">(Current)</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">
                            {tier.minKREX === 0 ? '< 10M' : `≥ ${formatLargeNumber(tier.minKREX)}`}
                          </td>
                          <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100">
                            {tier.multiplier}x
                          </td>
                          <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">
                            {tier.feePercent}%
                          </td>
                          <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100">
                            {tier.pointsMultiplier}x
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Buy KREX Button and Balance */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <button
                  className="px-6 py-2 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg font-medium transition-colors"
                  onClick={() => {
                    setShowModal(false);
                    setShowBuyWizard(true);
                  }}
                >
                  Buy KREX
                </button>
                <div className="flex items-center justify-end">
                  <div className="text-right">
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                      Your KREX Balance
                    </div>
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {isConnected ? (isLoading ? 'Loading...' : formatLargeNumber(balance)) : '—'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* KREX Buy & Bridge Wizard */}
      <KREXBuyWizard
        isOpen={showBuyWizard}
        onClose={() => setShowBuyWizard(false)}
      />
    </>
  );
}
