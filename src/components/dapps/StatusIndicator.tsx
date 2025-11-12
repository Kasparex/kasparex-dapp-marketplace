'use client';

import { useState } from 'react';
import { DApp, getDAppChainIds } from '@/lib/dapps';
import { getChainById } from '@/lib/wagmi';
import { CHAIN_IDS } from '@/lib/wagmi';

interface StatusIndicatorProps {
  dapp: DApp;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

type StatusType = 'mainnet' | 'testnet' | 'both' | 'none' | 'suspended';

/**
 * Determines the status type based on dApp's supported networks
 */
function getStatusType(dapp: DApp): StatusType {
  // Check if suspended first
  if (dapp.status === 'Suspended') {
    return 'suspended';
  }

  const supportedChainIds = getDAppChainIds(dapp);
  
  if (supportedChainIds.length === 0) {
    return 'none';
  }

  const hasMainnet = supportedChainIds.includes(CHAIN_IDS.KASPLEX_L2_MAINNET);
  const hasTestnet = supportedChainIds.includes(CHAIN_IDS.KASPLEX_L2_TESTNET);

  if (hasMainnet && hasTestnet) {
    return 'both';
  } else if (hasMainnet) {
    return 'mainnet';
  } else if (hasTestnet) {
    return 'testnet';
  }

  return 'none';
}

/**
 * Status Indicator Component
 * Shows a pulsating dot indicator based on network availability
 */
export function StatusIndicator({ dapp, className = '', size = 'md' }: StatusIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const statusType = getStatusType(dapp);
  const supportedChainIds = getDAppChainIds(dapp);
  const supportedNetworks = supportedChainIds
    .map(id => getChainById(id))
    .filter(Boolean)
    .map(chain => chain!.name);

  // Size classes
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  // Color classes based on status type
  const getColorClasses = (type: StatusType) => {
    switch (type) {
      case 'mainnet':
        return 'bg-green-500 shadow-green-500/50';
      case 'testnet':
        return 'bg-yellow-500 shadow-yellow-500/50';
      case 'both':
        return 'bg-gradient-to-br from-green-500 to-yellow-500 shadow-green-500/30 shadow-yellow-500/30';
      case 'suspended':
        return 'bg-red-500 shadow-red-500/50';
      case 'none':
      default:
        return 'bg-purple-500 shadow-purple-500/50';
    }
  };

  const colorClasses = getColorClasses(statusType);
  const sizeClass = sizeClasses[size];

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`
          ${sizeClass}
          ${colorClasses}
          rounded-full
          cursor-help
          animate-pulse
          shadow-lg
          ring-2 ring-white dark:ring-zinc-900
        `}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        title="Network availability"
      />
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-zinc-900 dark:bg-zinc-100 border-2 border-zinc-700 dark:border-zinc-300 rounded-lg shadow-xl z-[100] p-3 pointer-events-none">
          <p className="text-xs font-semibold text-white dark:text-zinc-900 mb-2">
            Available Networks:
          </p>
          {supportedNetworks.length > 0 ? (
            <ul className="space-y-1.5">
              {supportedNetworks.map((network, index) => (
                <li key={index} className="text-xs text-zinc-200 dark:text-zinc-700 flex items-center gap-2">
                  <svg className="w-3 h-3 text-green-400 dark:text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="truncate">{network}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-zinc-400 dark:text-zinc-600">
              No networks configured
            </p>
          )}
          {statusType === 'suspended' && (
            <div className="mt-2 pt-2 border-t border-zinc-700 dark:border-zinc-300">
              <p className="text-xs font-medium text-red-400 dark:text-red-600">
                ⚠ Suspended
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

