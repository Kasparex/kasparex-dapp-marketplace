'use client';

import { CHAIN_IDS } from '@/lib/wagmi';

interface StatusIndicatorDotProps {
  statusType: 'mainnet' | 'testnet' | 'both' | 'none' | 'suspended';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Simple status indicator dot for use in filters and lists
 * Shows a pulsating dot based on network availability
 */
export function StatusIndicatorDot({ statusType, size = 'md', className = '' }: StatusIndicatorDotProps) {
  // Size classes
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  // Color classes based on status type
  const getColorClasses = (type: typeof statusType) => {
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
    <div
      className={`
        ${sizeClass}
        ${colorClasses}
        rounded-full
        animate-pulse
        shadow-lg
        ring-2 ring-white dark:ring-zinc-900
        ${className}
      `}
    />
  );
}

/**
 * Helper function to determine status type from status string
 * This is used for filtering in the sidebar
 */
export function getStatusTypeFromString(status: string): 'mainnet' | 'testnet' | 'both' | 'none' | 'suspended' {
  if (status === 'Suspended') {
    return 'suspended';
  }
  if (status === 'Mainnet') {
    return 'mainnet';
  }
  if (status === 'Testnet') {
    return 'testnet';
  }
  // For filtering purposes, we'll treat other statuses as 'none'
  return 'none';
}

