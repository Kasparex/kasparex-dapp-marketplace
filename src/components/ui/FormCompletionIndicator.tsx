'use client';

import React from 'react';

interface FormCompletionIndicatorProps {
  filled: number;
  total: number;
  type?: 'circular' | 'linear';
}

export function FormCompletionIndicator({
  filled,
  total,
  type = 'linear',
}: FormCompletionIndicatorProps) {
  const percentage = total > 0 ? Math.round((filled / total) * 100) : 0;

  if (type === 'circular') {
    const radius = 20;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="flex items-center gap-3">
        <div className="relative w-12 h-12">
          <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 44 44">
            <circle
              cx="22"
              cy="22"
              r={radius}
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-zinc-200 dark:text-zinc-800"
            />
            <circle
              cx="22"
              cy="22"
              r={radius}
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="text-[color:var(--hub-accent)] transition-all duration-300"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              {percentage}%
            </span>
          </div>
        </div>
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{filled}</span>
          {' / '}
          <span>{total}</span> fields
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Form Completion
        </span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {filled} / {total} ({percentage}%)
        </span>
      </div>
      <div className="relative h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-[color:var(--hub-accent)] transition-all duration-300 ease-out rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

