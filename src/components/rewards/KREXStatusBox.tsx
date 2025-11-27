'use client';

import { useState, useRef, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { KREX_TIERS, type KREXTier } from '@/lib/rewards/types';
import { formatLargeNumber } from '@/lib/rewards/calculator';

// Mock KREX balance to determine tier (for simulation)
const mockKREXBalance = 0; // Default to Tier 0

function getKREXTierFromBalance(balance: number): KREXTier {
  if (balance >= 100_000_000) return 'Tier3';
  if (balance >= 10_000_000) return 'Tier2';
  if (balance >= 1_000_000) return 'Tier1';
  return 'Tier0';
}

export function KREXStatusBox() {
  const { isConnected } = useAccount();
  const krexTier = getKREXTierFromBalance(mockKREXBalance);
  const tierConfig = KREX_TIERS[krexTier];
  const [showTierTooltip, setShowTierTooltip] = useState(false);
  const tierTooltipRef = useRef<HTMLButtonElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (showTierTooltip && tierTooltipRef.current) {
      const rect = tierTooltipRef.current.getBoundingClientRect();
      const padding = 8;
      let left = rect.right + padding;
      let top = rect.top;
      
      // Check right boundary
      if (left + 280 > window.innerWidth - padding) {
        left = rect.left - 280 - padding;
      }
      
      // Check left boundary
      if (left < padding) {
        left = padding;
      }
      
      setTooltipPosition({ top, left });
    }
  }, [showTierTooltip]);

  return (
    <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          KREX Status
        </h3>
        <button
          ref={tierTooltipRef}
          className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
          onMouseEnter={() => setShowTierTooltip(true)}
          onMouseLeave={() => setShowTierTooltip(false)}
          aria-label="View tier requirements"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      <div className="space-y-2">
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
          <Link
            href="/rewards-calculator"
            className="block w-full mt-2 px-3 py-2 text-xs font-medium text-center bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
          >
            Rewards Calculator
          </Link>
        </div>
      </div>

      {/* Tier Requirements Tooltip */}
      {showTierTooltip && tooltipPosition && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg shadow-xl z-[99999] p-3 pointer-events-none"
          style={{ 
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            width: '280px',
            maxWidth: 'calc(100vw - 16px)',
          }}
        >
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">KREX Tier Requirements</p>
          <div className="space-y-1.5 text-xs">
            {Object.values(KREX_TIERS).map((tier) => (
              <div key={tier.tier} className="flex items-center justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">{tier.label}:</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {tier.minKREX === 0 ? '< 1M' : `≥ ${formatLargeNumber(tier.minKREX)}`} KREX
                </span>
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
