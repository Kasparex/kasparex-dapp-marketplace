/**
 * Kaspa Stat Card Component
 * 
 * Reusable card component for displaying Kaspa network metrics
 */

'use client';

import { ReactNode } from 'react';

interface KaspaStatCardProps {
  /** Card title */
  title: string;
  /** Main value to display */
  value: string | number | null | undefined;
  /** Optional subtitle or additional info */
  subtitle?: string;
  /** Optional icon */
  icon?: ReactNode;
  /** Optional loading state */
  isLoading?: boolean;
  /** Optional trend indicator (positive/negative) */
  trend?: 'up' | 'down' | 'neutral';
  /** Optional trend value */
  trendValue?: string;
  /** Optional color variant */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

export function KaspaStatCard({
  title,
  value,
  subtitle,
  icon,
  isLoading = false,
  trend,
  trendValue,
  variant = 'default',
}: KaspaStatCardProps) {
  const variantClasses = {
    default: 'border-zinc-200 dark:border-zinc-800',
    primary: 'border-[#02abb8] dark:border-[#02abb8]',
    success: 'border-green-200 dark:border-green-800',
    warning: 'border-yellow-200 dark:border-yellow-800',
    danger: 'border-red-200 dark:border-red-800',
  };

  const formatValue = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return 'N/A';
    if (typeof val === 'number') {
      if (val >= 1e18) return `${(val / 1e18).toFixed(2)}E`;
      if (val >= 1e15) return `${(val / 1e15).toFixed(2)}P`;
      if (val >= 1e12) return `${(val / 1e12).toFixed(2)}T`;
      if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
      if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
      if (val >= 1e3) return `${(val / 1e3).toFixed(2)}K`;
      return val.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
    return val;
  };

  return (
    <div
      className={`bg-white dark:bg-zinc-900 border rounded-lg p-4 sm:p-6 transition-all hover:shadow-md ${variantClasses[variant]}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon && <div className="text-zinc-500 dark:text-zinc-400">{icon}</div>}
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
            {title}
          </h3>
        </div>
        {trend && trend !== 'neutral' && (
          <div
            className={`flex items-center gap-1 text-xs ${
              trend === 'up'
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {trend === 'up' ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
            {trendValue && <span>{trendValue}</span>}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="animate-pulse">
          <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4 mb-2"></div>
          {subtitle && <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2"></div>}
        </div>
      ) : (
        <>
          <div className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
            {formatValue(value)}
          </div>
          {subtitle && (
            <div className="text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</div>
          )}
        </>
      )}
    </div>
  );
}

