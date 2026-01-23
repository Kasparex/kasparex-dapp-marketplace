'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import type { Product, ProductCategory } from '@/lib/store/types';
import { getExplorerTxUrl } from '@/lib/store/utils';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { calculatePlatformFee } from '@/lib/store/fees';

interface ProductSidebarProps {
  product: Product;
  txHash?: string | null;
}

export function ProductSidebar({ product, txHash }: ProductSidebarProps) {
  const [isHidden, setIsHidden] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { tier: krexTier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  
  const categories: ProductCategory[] = ['Software', 'Art', 'Music', 'Templates', 'Other'];

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedHidden = localStorage.getItem('product-sidebar-hidden');
    const savedWidth = localStorage.getItem('product-sidebar-width');
    if (savedHidden === 'true') setIsHidden(true);
    if (savedWidth) setSidebarWidth(parseInt(savedWidth, 10));
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('product-sidebar-hidden', String(isHidden));
  }, [isHidden]);

  useEffect(() => {
    localStorage.setItem('product-sidebar-width', String(sidebarWidth));
  }, [sidebarWidth]);

  // Handle resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !sidebarRef.current) return;
      const sidebarRect = sidebarRef.current.getBoundingClientRect();
      const newWidth = e.clientX - sidebarRect.left;
      if (newWidth >= 200 && newWidth <= 500) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const explorerUrl = txHash ? getExplorerTxUrl(txHash) : null;

  return (
    <>
      {/* Show Sidebar Button - Fixed when hidden */}
      {isHidden && (
        <button
          onClick={() => setIsHidden(false)}
          className="hidden lg:block fixed left-0 top-20 z-[60] p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
          aria-label="Show sidebar"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`
          fixed lg:sticky top-16 lg:top-0 left-0 z-40
          h-[calc(100vh-4rem)] lg:h-screen
          bg-white dark:bg-zinc-950
          border-r border-zinc-200 dark:border-zinc-800
          transform transition-all duration-300 ease-in-out
          overflow-y-auto
          ${isHidden ? 'lg:translate-x-[-100%]' : ''}
        `}
        style={{ 
          width: isHidden ? 0 : `${sidebarWidth}px`,
          minWidth: isHidden ? 0 : `${sidebarWidth}px`,
          maxWidth: isHidden ? 0 : `${sidebarWidth}px`,
          cursor: isResizing ? 'col-resize' : ''
        }}
        onMouseMove={(e) => {
          if (!isHidden && !isResizing && sidebarRef.current) {
            const rect = sidebarRef.current.getBoundingClientRect();
            const isOnBorder = e.clientX >= rect.right - 4 && e.clientX <= rect.right;
            sidebarRef.current.style.cursor = isOnBorder ? 'col-resize' : '';
            if (isOnBorder) {
              sidebarRef.current.style.borderRight = '2px solid #06b6d4';
            } else {
              sidebarRef.current.style.borderRight = '';
            }
          }
        }}
        onMouseLeave={() => {
          if (sidebarRef.current && !isResizing) {
            sidebarRef.current.style.borderRight = '';
          }
        }}
        onMouseDown={(e) => {
          if (!isHidden && sidebarRef.current) {
            const rect = sidebarRef.current.getBoundingClientRect();
            if (e.clientX >= rect.right - 4 && e.clientX <= rect.right) {
              e.preventDefault();
              setIsResizing(true);
            }
          }
        }}
      >
        {/* Header */}
        <div className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/store"
              className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium transition-colors text-sm flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Store
            </Link>
            <button
              onClick={() => setIsHidden(true)}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
              aria-label="Hide sidebar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Categories Menu */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
              Categories
            </h3>
            <div className="space-y-1">
              {categories.map((category) => (
                <Link
                  key={category}
                  href={`/store?category=${category}`}
                  className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                    product.category === category
                      ? 'bg-[#02abb8] text-white font-medium'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {category}
                </Link>
              ))}
            </div>
          </div>

          {/* Rewards Box */}
          <div className="bg-gradient-to-br from-[#02abb8]/10 to-purple-500/10 border border-[#02abb8]/20 dark:border-purple-500/20 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
              Rewards & Benefits
            </h3>
            <div className="space-y-3 text-sm">
              {/* KREX Benefits */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-zinc-600 dark:text-zinc-400">KREX Tier:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {krexTier === 'none' ? 'None' : krexTier}
                  </span>
                </div>
                {krexTier !== 'none' && (
                  <div className="text-xs text-green-600 dark:text-green-400">
                    ✓ Fee discount active
                  </div>
                )}
              </div>

              {/* NFT Benefits */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-zinc-600 dark:text-zinc-400">NFT Status:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {nftStatus && (nftStatus.hasKREXPRIME || nftStatus.hasPIXELKREX || nftStatus.hasDiamondKREXPRIME || nftStatus.hasDiamondPIXELKREX)
                      ? 'Active'
                      : 'None'}
                  </span>
                </div>
                {nftStatus && (nftStatus.hasKREXPRIME || nftStatus.hasPIXELKREX || nftStatus.hasDiamondKREXPRIME || nftStatus.hasDiamondPIXELKREX) && (
                  <div className="text-xs text-green-600 dark:text-green-400">
                    ✓ Fee discount active
                  </div>
                )}
              </div>

              {/* Fee Calculation */}
              {(() => {
                const fee = calculatePlatformFee(product.priceKAS, krexTier, nftStatus);
                const hasDiscount = fee.feePercent < 5;
                
                return (
                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-zinc-600 dark:text-zinc-400">Platform Fee:</span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {fee.feePercent.toFixed(2)}%
                      </span>
                    </div>
                    {hasDiscount && (
                      <div className="text-xs text-green-600 dark:text-green-400">
                        Reduced from 5% base fee
                      </div>
                    )}
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Fee: {fee.feeAmount.toFixed(4)} KAS
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Transaction Link */}
          {explorerUrl && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                Transaction
              </h3>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-sm font-medium text-zinc-900 dark:text-zinc-100 transition-colors text-center"
              >
                View on Explorer
                <svg className="w-4 h-4 inline-block ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
