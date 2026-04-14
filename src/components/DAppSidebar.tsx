'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAccount, useChainId } from 'wagmi';
import { DApp } from '@/lib/dapps';
import { isDeployer } from '@/lib/dapps/deployer';
import { useDAppFromContract } from '@/lib/dapps/contractData';
// Edit functionality removed - dApps are now read-only
import { getDAppContractAddress } from '@/lib/dapps/contractResolver';
import { mergeDAppData } from '@/lib/dapps/contractData';
import { UnifiedStatusBox } from './rewards/UnifiedStatusBox';
import { QuickGuideWizard } from './rewards/QuickGuideWizard';
import { getDAppNetworkType } from '@/lib/dapps';
import { SidebarSection } from './sidebar/SidebarSection';
import { SidebarHeader } from './sidebar/SidebarHeader';
import { usePathname } from 'next/navigation';

interface DAppSidebarProps {
  dapp: DApp;
}

// Helper function to get icon based on link label or URL
const getLinkIcon = (label: string, url: string) => {
  const lowerLabel = label.toLowerCase();
  const lowerUrl = url.toLowerCase();

  if (lowerLabel.includes('website') || lowerLabel.includes('site') || (!lowerUrl.includes('t.me') && !lowerUrl.includes('twitter') && !lowerUrl.includes('x.com') && !lowerUrl.includes('github'))) {
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    );
  }
  if (lowerLabel.includes('telegram') || lowerUrl.includes('t.me')) {
    return (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.226-.46-1.9-.902-1.056-.69-1.653-1.12-2.678-1.794-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    );
  }
  if (lowerLabel.includes('twitter') || lowerLabel.includes('x') || lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
    return (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }
  if (lowerLabel.includes('github') || lowerUrl.includes('github.com')) {
    return (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
    );
  }
  // Default icon (link/external)
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
};

export function DAppSidebar({ dapp }: DAppSidebarProps) {
  const { address: connectedAddress } = useAccount();
  const chainId = useChainId();
  const pathname = usePathname();
  const [showQuickGuide, setShowQuickGuide] = useState(false);
  // Edit functionality removed

  // Sidebar hide/show and resize state
  const [isHidden, setIsHidden] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256); // Default 256px (w-64)
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedHidden = localStorage.getItem('dapp-sidebar-hidden');
    const savedWidth = localStorage.getItem('dapp-sidebar-width');
    if (savedHidden === 'true') setIsHidden(true);
    if (savedWidth) setSidebarWidth(parseInt(savedWidth, 10));
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('dapp-sidebar-hidden', String(isHidden));
  }, [isHidden]);

  useEffect(() => {
    localStorage.setItem('dapp-sidebar-width', String(sidebarWidth));
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

  // Check if this is an L1 dApp
  const isL1DApp = getDAppNetworkType(dapp) === 'L1';

  let contractAddress = '';
  if (!isL1DApp) {
    contractAddress = dapp.contractAddress || getDAppContractAddress(dapp, chainId) || '';
  }

  // Fetch contract data to get deployer address (only for L2 dApps)
  const { data: contractData } = useDAppFromContract(
    !isL1DApp && contractAddress && contractAddress.startsWith('0x') ? contractAddress : undefined,
    chainId
  );

  const deployerAddress = contractData?.deployerAddress || dapp.deployerAddress || dapp.developer || '';
  const isDeployerUser = isDeployer(connectedAddress, deployerAddress);
  
  // Merge localStorage data
  const mergedDApp = mergeDAppData(contractData, dapp);

  return (
    <>
      {/* Mobile Back Button */}
      <div className="lg:hidden px-4 pt-4 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
        <Link
          href="/dapps"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to dApps
        </Link>
      </div>

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

      {/* Desktop Sidebar */}
      <aside 
        ref={sidebarRef}
        className={`
          hidden lg:block flex-shrink-0
          fixed lg:sticky top-16 lg:top-0 left-0 z-40
          h-[calc(100vh-4rem)] lg:h-screen
          overflow-y-auto
          bg-white dark:bg-zinc-950
          border-r border-zinc-200 dark:border-zinc-800
          transition-all duration-300 ease-in-out
          ${isHidden ? 'translate-x-[-100%]' : ''}
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
            // Full height border detection (right side)
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
          // Make the right border draggable (full height)
          if (!isHidden && sidebarRef.current) {
            const rect = sidebarRef.current.getBoundingClientRect();
            if (e.clientX >= rect.right - 4 && e.clientX <= rect.right) {
              e.preventDefault();
              setIsResizing(true);
            }
          }
        }}
      >
        {/* Standard sidebar header with interactive back link and hide */}
        <SidebarHeader
          backHref="/dapps"
          backLabel="Back to dApps"
          onHide={() => setIsHidden(true)}
          className="bg-white dark:bg-zinc-950"
        />

        <div className={`p-5 space-y-6 ${isHidden ? 'lg:hidden' : ''}`}>
            <div className="mb-8">
              <div className="space-y-2">
                <Link href="/list-dapp" className="k-control-btn w-full">
                  List dApp
                </Link>
                <Link href="/tree/dashboard" className="k-control-btn w-full">
                  Revenue Tree
                </Link>
                <Link href="/dapp-modules" className="k-control-btn w-full">
                  Modules
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <UnifiedStatusBox />
              <button
                type="button"
                onClick={() => setShowQuickGuide(true)}
                className="w-full px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 rounded-lg font-bold text-[11px] uppercase tracking-wider hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Quick Guide
              </button>
            </div>
        </div>
      </aside>

      <QuickGuideWizard
        isOpen={showQuickGuide}
        onClose={() => setShowQuickGuide(false)}
      />

      {/* Edit functionality removed - dApps are now read-only */}
    </>
  );
}

