/**
 * Token Minting Progress Component
 * Shows minting progress bar similar to dApp cards
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Token } from '@/lib/tokens/types';
import { formatLargeNumber } from '@/lib/rewards/calculator';

interface TokenMintingProgressProps {
  token: Token;
}

// Calculate minting progress
function calculateMintingProgress(token: Token): {
  minted: number;
  maxSupply: number;
  progress: number;
  isFullyMinted: boolean;
} {
  const maxSupply = token.maxSupply || token.totalSupply || 0;
  const minted = token.circulatingSupply || 0;
  const progress = maxSupply > 0 ? (minted / maxSupply) * 100 : 0;
  const isFullyMinted = progress >= 100 || (maxSupply > 0 && minted >= maxSupply);

  return {
    minted,
    maxSupply,
    progress: Math.min(100, progress),
    isFullyMinted,
  };
}

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

export function TokenMintingProgress({ token }: TokenMintingProgressProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);

  const metrics = calculateMintingProgress(token);

  useEffect(() => {
    if (showTooltip && tooltipRef.current && mousePosition) {
      const tooltipWidth = 280;
      const tooltipHeight = 80;
      const padding = 12;
      const offset = 10;

      let left = mousePosition.x + offset;
      let top = mousePosition.y - tooltipHeight - offset;

      if (left + tooltipWidth > window.innerWidth - padding) {
        left = mousePosition.x - tooltipWidth - offset;
      }

      if (left < padding) {
        left = padding;
      }

      if (top < padding) {
        top = mousePosition.y + offset;
      }

      if (top + tooltipHeight > window.innerHeight - padding) {
        top = window.innerHeight - tooltipHeight - padding;
      }

      setTooltipPosition({ top, left });
    }
  }, [showTooltip, mousePosition]);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  // Don't show if no supply data
  if (metrics.maxSupply === 0) {
    return null;
  }

  return (
    <section className="space-y-6">
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div
        ref={tooltipRef}
        className="space-y-2"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => {
          setShowTooltip(false);
          setMousePosition(null);
        }}
        onMouseMove={handleMouseMove}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {token.symbol} Token Supply
          </span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {metrics.progress.toFixed(2)}% minted
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
          <div
            className="bg-[#02abb8] h-2 rounded-full transition-all"
            style={{ width: `${metrics.progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
          <span>
            {formatLargeNumber(metrics.minted)} / {formatLargeNumber(metrics.maxSupply)}
          </span>
          {!metrics.isFullyMinted && (
            <span className="text-xs">
              {metrics.maxSupply - metrics.minted > 0
                ? `${formatLargeNumber(metrics.maxSupply - metrics.minted)} remaining`
                : 'Fully minted'}
            </span>
          )}
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && tooltipPosition && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg shadow-xl z-[99999] p-3 pointer-events-none"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            width: '320px',
            maxWidth: 'calc(100vw - 16px)',
          }}
        >
          <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
            {metrics.isFullyMinted
              ? `All ${token.symbol} tokens have been minted. The token is now fully in circulation.`
              : `${formatLargeNumber(metrics.maxSupply - metrics.minted)} ${token.symbol} tokens remain to be minted through usage and rewards.`}
          </p>
        </div>,
        document.body
      )}
    </div>
    </section>
  );
}
