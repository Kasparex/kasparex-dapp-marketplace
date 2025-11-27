'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { createPortal } from 'react-dom';
import { NFT_MULTIPLIER, NFT_FEE_REDUCTION, DIAMOND_NFT_MULTIPLIER, DIAMOND_NFT_FEE_REDUCTION, RAREST_NFT_MULTIPLIER, RAREST_NFT_FEE_REDUCTION } from '@/lib/rewards/types';

// Mock NFT status for simulation
const mockNFTStatus = {
  hasKREXPRIME: false,
  hasPIXELKREX: false,
  hasDiamondKREXPRIME: false,
  hasDiamondPIXELKREX: false,
  hasRarestNFT: false,
};

export function NFTStatusBox() {
  const { isConnected } = useAccount();
  const hasAnyNFT = mockNFTStatus.hasKREXPRIME || mockNFTStatus.hasPIXELKREX;
  const hasDiamondNFT = mockNFTStatus.hasDiamondKREXPRIME || mockNFTStatus.hasDiamondPIXELKREX;
  const hasRarestNFT = mockNFTStatus.hasRarestNFT;
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            NFT Status
          </h3>
          <div className="flex items-center gap-2">
            {hasAnyNFT && (
              <span className="text-xs px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full">
                Active
              </span>
            )}
            <button
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
              onClick={() => setShowModal(true)}
              aria-label="View NFT rewards"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-600 dark:text-zinc-400">KREXPRIME:</span>
          <span className={mockNFTStatus.hasKREXPRIME ? 'text-green-600 dark:text-green-400 font-medium' : 'text-zinc-400'}>
            {mockNFTStatus.hasKREXPRIME ? '✓ Owned' : 'Not owned'}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-600 dark:text-zinc-400">PIXELKREX:</span>
          <span className={mockNFTStatus.hasPIXELKREX ? 'text-green-600 dark:text-green-400 font-medium' : 'text-zinc-400'}>
            {mockNFTStatus.hasPIXELKREX ? '✓ Owned' : 'Not owned'}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-600 dark:text-zinc-400">💎 Diamond:</span>
          <span className={hasDiamondNFT ? 'text-purple-600 dark:text-purple-400 font-medium' : 'text-zinc-400'}>
            {hasDiamondNFT ? '✓ Owned' : 'Not owned'}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-600 dark:text-zinc-400">⭐ Rarest:</span>
          <span className={hasRarestNFT ? 'text-yellow-600 dark:text-yellow-400 font-medium' : 'text-zinc-400'}>
            {hasRarestNFT ? '✓ Owned' : 'Not owned'}
          </span>
        </div>
        {hasAnyNFT && (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-200 dark:border-zinc-700">
            {hasRarestNFT ? (
              <>
                <span className="text-yellow-600 dark:text-yellow-400 font-medium">+5x multiplier, 0.0% fee</span>
              </>
            ) : hasDiamondNFT ? (
              <>
                <span className="text-purple-600 dark:text-purple-400 font-medium">+3x multiplier, -0.2% fee</span>
              </>
            ) : (
              <>
                <span className="text-green-600 dark:text-green-400 font-medium">+1x multiplier, -0.1% fee</span>
              </>
            )}
          </div>
        )}
      </div>
      </div>

      {/* NFT Rewards Modal */}
      {showModal && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" />
          
          {/* Modal Content */}
          <div
            className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  NFT Rewards
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  KREXPRIME and PIXELKREX NFT holders unlock additional rewards
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
                      <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">NFT Type</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Reward Multiplier</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Fee Reduction</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                        Regular NFT
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          (KREXPRIME or PIXELKREX)
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100">
                        +{NFT_MULTIPLIER}x
                      </td>
                      <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">
                        -{NFT_FEE_REDUCTION}%
                      </td>
                    </tr>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                        💎 Diamond NFT
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          (Any Diamond from any collection)
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100">
                        +{DIAMOND_NFT_MULTIPLIER}x
                      </td>
                      <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">
                        -{DIAMOND_NFT_FEE_REDUCTION}%
                      </td>
                    </tr>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                        ⭐ Rarest NFT
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          (#515 PIXELKREX or #345 KREXPRIME)
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100">
                        +{RAREST_NFT_MULTIPLIER}x
                      </td>
                      <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">
                        -{RAREST_NFT_FEE_REDUCTION}% (Zero Fee)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Buy Buttons */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <button
                  className="px-6 py-2 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg font-medium transition-colors"
                  onClick={() => {
                    // TODO: Add link when provided
                    console.log('Buy KREXPRIME clicked');
                  }}
                >
                  Buy KREXPRIME
                </button>
                <button
                  className="px-6 py-2 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg font-medium transition-colors"
                  onClick={() => {
                    // TODO: Add link when provided
                    console.log('Buy PIXELKREX clicked');
                  }}
                >
                  Buy PIXELKREX
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

