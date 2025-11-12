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

  // Color classes and shadow styles based on status type
  const getColorConfig = (type: typeof statusType) => {
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
          bg: 'bg-gradient-to-br from-green-500 to-yellow-500',
          shadow: '0 0 8px rgba(34, 197, 94, 0.4), 0 0 12px rgba(234, 179, 8, 0.4)',
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

  const colorConfig = getColorConfig(statusType);
  const sizeClass = sizeClasses[size];

  return (
    <div
      className={`
        ${sizeClass}
        ${colorConfig.bg}
        rounded-full
        animate-pulse
        ring-2 ring-white dark:ring-zinc-900
        ${className}
      `}
      style={{
        boxShadow: colorConfig.shadow,
      }}
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

