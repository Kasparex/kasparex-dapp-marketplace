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
  
  // Get all available chains for comparison
  const allChainIds = [CHAIN_IDS.KASPLEX_L2_MAINNET, CHAIN_IDS.KASPLEX_L2_TESTNET];
  const allNetworks = allChainIds
    .map(id => getChainById(id))
    .filter(Boolean)
    .map(chain => chain!.name);
  const unavailableNetworks = allNetworks.filter(network => !supportedNetworks.includes(network));

  // Size classes
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  // Color classes and shadow styles based on status type
  const getColorClasses = (type: StatusType) => {
    switch (type) {
      case 'mainnet':
        return {
          bg: 'bg-green-500',
          shadow: '0 0 8px rgba(34, 197, 94, 0.6), 0 0 12px rgba(34, 197, 94, 0.4)',
        };
      case 'testnet':
        return {
          bg: 'bg-yellow-500',
          shadow: '0 0 8px rgba(234, 179, 8, 0.6), 0 0 12px rgba(234, 179, 8, 0.4)',
        };
      case 'both':
        return {
          bg: 'bg-green-500',
          shadow: '0 0 8px rgba(34, 197, 94, 0.6), 0 0 12px rgba(34, 197, 94, 0.4)',
        };
      case 'suspended':
        return {
          bg: 'bg-red-500',
          shadow: '0 0 8px rgba(239, 68, 68, 0.6), 0 0 12px rgba(239, 68, 68, 0.4)',
        };
      case 'none':
      default:
        return {
          bg: 'bg-purple-500',
          shadow: '0 0 8px rgba(168, 85, 247, 0.6), 0 0 12px rgba(168, 85, 247, 0.4)',
        };
    }
  };

  const colorConfig = getColorClasses(statusType);
  const sizeClass = sizeClasses[size];

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`
          ${sizeClass}
          ${colorConfig.bg}
          rounded-full
          cursor-help
          animate-pulse
          ring-2 ring-white dark:ring-zinc-900
        `}
        style={{
          boxShadow: colorConfig.shadow,
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        title="Network availability"
      />
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg shadow-xl z-[100] p-3 pointer-events-none">
          {statusType === 'suspended' && (
            <div className="mb-3 pb-3 border-b border-zinc-300 dark:border-zinc-600">
              <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                ⚠ Suspended
              </p>
            </div>
          )}
          
          {supportedNetworks.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Available Networks:
              </p>
              <ul className="space-y-1">
                {supportedNetworks.map((network, index) => (
                  <li key={index} className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                    <svg className="w-3 h-3 text-green-500 dark:text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="truncate">{network}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {unavailableNetworks.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Not Available Networks:
              </p>
              <ul className="space-y-1">
                {unavailableNetworks.map((network, index) => (
                  <li key={index} className="text-xs text-zinc-500 dark:text-zinc-500 flex items-center gap-2">
                    <svg className="w-3 h-3 text-zinc-400 dark:text-zinc-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="truncate">{network}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {supportedNetworks.length === 0 && unavailableNetworks.length === 0 && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              No networks configured
            </p>
          )}
        </div>
      )}
    </div>
  );
}

