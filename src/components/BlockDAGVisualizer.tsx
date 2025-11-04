/**
 * BlockDAG Visualizer Component
 * 
 * Visualizes Kaspa BlockDAG structure with real-time updates
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import type { KaspaBlock, BlockDAGNode } from '@/lib/kaspa/types';

interface BlockDAGVisualizerProps {
  /** Blocks to visualize */
  blocks: KaspaBlock[];
  /** Whether to auto-refresh */
  autoRefresh?: boolean;
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
  /** Callback when a block is clicked */
  onBlockClick?: (block: KaspaBlock) => void;
}

export function BlockDAGVisualizer({
  blocks,
  autoRefresh = false,
  refreshInterval = 10000,
  onBlockClick,
}: BlockDAGVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedBlock, setSelectedBlock] = useState<KaspaBlock | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !blocks.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const container = containerRef.current;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = Math.max(600, blocks.length * 80);
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw blocks
    drawBlockDAG(ctx, canvas, blocks, selectedBlock, (block) => {
      setSelectedBlock(block);
      onBlockClick?.(block);
    });
  }, [blocks, selectedBlock, onBlockClick]);

  const formatHash = (hash: string): string => {
    if (!hash) return '';
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  };

  const formatTimestamp = (timestamp?: number): string => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString();
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          BlockDAG Visualizer
        </h3>
        {autoRefresh && (
          <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live</span>
          </div>
        )}
      </div>

      <div
        ref={containerRef}
        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-auto"
        style={{ maxHeight: '800px' }}
      >
        <canvas
          ref={canvasRef}
          className="w-full cursor-pointer"
          onClick={(e) => {
            if (!canvasRef.current) return;
            const rect = canvasRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const block = findBlockAtPosition(canvasRef.current, blocks, x, y);
            if (block) {
              setSelectedBlock(block);
              onBlockClick?.(block);
            }
          }}
        />
      </div>

      {selectedBlock && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Block Details
            </h4>
            <button
              onClick={() => setSelectedBlock(null)}
              className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500 dark:text-zinc-400">Hash:</span>
              <span className="text-zinc-900 dark:text-zinc-100 font-mono">
                {formatHash(selectedBlock.hash)}
              </span>
            </div>
            {selectedBlock.height !== undefined && (
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Height:</span>
                <span className="text-zinc-900 dark:text-zinc-100">
                  {selectedBlock.height.toLocaleString()}
                </span>
              </div>
            )}
            {selectedBlock.blueScore !== undefined && (
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Blue Score:</span>
                <span className="text-zinc-900 dark:text-zinc-100">
                  {selectedBlock.blueScore.toLocaleString()}
                </span>
              </div>
            )}
            {selectedBlock.daaScore !== undefined && (
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">DAA Score:</span>
                <span className="text-zinc-900 dark:text-zinc-100">
                  {selectedBlock.daaScore.toLocaleString()}
                </span>
              </div>
            )}
            {selectedBlock.transactionCount !== undefined && (
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Transactions:</span>
                <span className="text-zinc-900 dark:text-zinc-100">
                  {selectedBlock.transactionCount}
                </span>
              </div>
            )}
            {selectedBlock.timestamp && (
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Time:</span>
                <span className="text-zinc-900 dark:text-zinc-100">
                  {formatTimestamp(selectedBlock.timestamp)}
                </span>
              </div>
            )}
            {selectedBlock.parents && selectedBlock.parents.length > 0 && (
              <div>
                <span className="text-zinc-500 dark:text-zinc-400">Parents:</span>
                <div className="mt-1 space-y-1">
                  {selectedBlock.parents.map((parent, idx) => (
                    <div key={idx} className="text-xs font-mono text-zinc-700 dark:text-zinc-300">
                      {formatHash(parent)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {blocks.length === 0 && !isLoading && (
        <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
          No blocks available to visualize
        </div>
      )}
    </div>
  );
}

/**
 * Draw BlockDAG on canvas
 */
function drawBlockDAG(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  blocks: KaspaBlock[],
  selectedBlock: KaspaBlock | null,
  onBlockClick: (block: KaspaBlock) => void
) {
  const blockWidth = 120;
  const blockHeight = 60;
  const spacing = 20;
  const startX = 50;
  let currentY = 50;

  // Sort blocks by blue score or height
  const sortedBlocks = [...blocks].sort((a, b) => {
    const aScore = a.blueScore || a.height || 0;
    const bScore = b.blueScore || b.height || 0;
    return bScore - aScore;
  });

  sortedBlocks.forEach((block, index) => {
    const x = startX;
    const y = currentY;
    const isSelected = selectedBlock?.hash === block.hash;

    // Draw block
    ctx.fillStyle = isSelected
      ? '#02abb8'
      : index === 0
      ? '#10b981'
      : '#6366f1';
    ctx.strokeStyle = isSelected ? '#028a94' : '#475569';
    ctx.lineWidth = isSelected ? 3 : 2;

    ctx.fillRect(x, y, blockWidth, blockHeight);
    ctx.strokeRect(x, y, blockWidth, blockHeight);

    // Draw block text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const hashShort = block.hash
      ? `${block.hash.substring(0, 6)}...${block.hash.substring(block.hash.length - 6)}`
      : 'N/A';

    ctx.fillText(hashShort, x + blockWidth / 2, y + blockHeight / 2 - 10);

    if (block.height !== undefined) {
      ctx.font = '10px sans-serif';
      ctx.fillText(`Height: ${block.height}`, x + blockWidth / 2, y + blockHeight / 2 + 10);
    }

    // Draw connections to parents (simplified)
    if (block.parents && block.parents.length > 0 && index > 0) {
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      block.parents.forEach((parentHash, parentIdx) => {
        const parentBlock = sortedBlocks.find((b) => b.hash === parentHash);
        if (parentBlock && parentBlock !== block) {
          const parentIndex = sortedBlocks.indexOf(parentBlock);
          if (parentIndex >= 0 && parentIndex < index) {
            const parentY = 50 + parentIndex * (blockHeight + spacing);
            ctx.beginPath();
            ctx.moveTo(x + blockWidth / 2, y);
            ctx.lineTo(startX + blockWidth / 2, parentY + blockHeight);
            ctx.stroke();
          }
        }
      });
    }

    currentY += blockHeight + spacing;
  });
}

/**
 * Find block at canvas position
 */
function findBlockAtPosition(
  canvas: HTMLCanvasElement,
  blocks: KaspaBlock[],
  x: number,
  y: number
): KaspaBlock | null {
  const blockWidth = 120;
  const blockHeight = 60;
  const spacing = 20;
  const startX = 50;
  let currentY = 50;

  const sortedBlocks = [...blocks].sort((a, b) => {
    const aScore = a.blueScore || a.height || 0;
    const bScore = b.blueScore || b.height || 0;
    return bScore - aScore;
  });

  for (let i = 0; i < sortedBlocks.length; i++) {
    if (
      x >= startX &&
      x <= startX + blockWidth &&
      y >= currentY &&
      y <= currentY + blockHeight
    ) {
      return sortedBlocks[i];
    }
    currentY += blockHeight + spacing;
  }

  return null;
}

