'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getMockLRTSupplyMetrics, getDefaultRewardsBreakdown } from '@/lib/rewards/mockData';
import { formatLargeNumber } from '@/lib/rewards/calculator';

interface DAppCardRewardsProps {
  tokenTicker?: string | null;
}

export function DAppCardRewards({ 
  tokenTicker,
}: DAppCardRewardsProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);
  
  const lrtMetrics = getMockLRTSupplyMetrics();
  const rewards = getDefaultRewardsBreakdown(tokenTicker || undefined);

  const formatDays = (days: number): string => {
    if (days === Infinity || days > 36500) {
      return 'Never';
    }
    if (days >= 365) {
      const years = days / 365;
      return `${years.toFixed(1)} years`;
    }
    if (days >= 30) {
      const months = days / 30;
      return `${months.toFixed(1)} months`;
    }
    return `${Math.round(days)} days`;
  };

  useEffect(() => {
    if (showTooltip && tooltipRef.current && mousePosition) {
      const tooltipWidth = 280;
      const tooltipHeight = 80;
      const padding = 12;
      const offset = 10; // Distance from mouse pointer
      
      let left = mousePosition.x + offset;
      let top = mousePosition.y - tooltipHeight - offset;
      
      // Check right boundary
      if (left + tooltipWidth > window.innerWidth - padding) {
        left = mousePosition.x - tooltipWidth - offset;
      }
      
      // Check left boundary
      if (left < padding) {
        left = padding;
      }
      
      // Check top boundary - if not enough space above, show below
      if (top < padding) {
        top = mousePosition.y + offset;
      }
      
      // Check bottom boundary
      if (top + tooltipHeight > window.innerHeight - padding) {
        top = window.innerHeight - tooltipHeight - padding;
      }
      
      setTooltipPosition({ top, left });
    }
  }, [showTooltip, mousePosition]);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="mt-4 pt-4 border-t border-zinc-200/50 dark:border-zinc-800/50">
      {/* LRT Supply Metrics */}
      <div 
        ref={tooltipRef}
        className="space-y-2 mb-3"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => {
          setShowTooltip(false);
          setMousePosition(null);
        }}
        onMouseMove={handleMouseMove}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            {rewards.tokenTicker} Token Supply
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {lrtMetrics.progress.toFixed(2)}% minted
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
          <div
            className="bg-[#02abb8] h-2 rounded-full transition-all"
            style={{ width: `${Math.min(100, lrtMetrics.progress)}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>{formatLargeNumber(lrtMetrics.minted)} / {formatLargeNumber(lrtMetrics.maxSupply)}</span>
          <span>{formatDays(lrtMetrics.daysUntilExhaustion)}</span>
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && tooltipPosition && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg shadow-xl z-[99999] p-3 pointer-events-none"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            width: '280px',
            maxWidth: 'calc(100vw - 16px)',
          }}
        >
          <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
            Using this dApp rewards you with {rewards.tokenTicker} tokens (Local Reward Token). 
            This works as Use-To-Mint / Proof of Utility — the more you use the dApp, the more rewards you earn.
          </p>
        </div>,
        document.body
      )}
    </div>
  );
}

