'use client';

import React from 'react';

export type ProgressStage = 'ready' | 'processing' | 'confirming' | 'complete';

interface ProgressBarProps {
  stages: { id: ProgressStage; label: string; progress: number }[];
  currentStage: ProgressStage;
  progress?: number;
  className?: string;
}

export function ProgressBar({
  stages,
  currentStage,
  progress,
  className = '',
}: ProgressBarProps) {
  const currentStageIndex = stages.findIndex((s) => s.id === currentStage);
  const currentProgress = progress !== undefined
    ? progress
    : currentStageIndex >= 0
    ? stages[currentStageIndex].progress
    : 0;

  return (
    <div className={`w-full ${className}`}>
      {/* Desktop: Full progress bar with labels */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between mb-2">
          {stages.map((stage, index) => {
            const isActive = stage.id === currentStage;
            const isCompleted = currentStageIndex > index;
            return (
              <div
                key={stage.id}
                className="flex-1 flex flex-col items-center"
              >
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors
                    ${
                      isCompleted
                        ? 'bg-[color:var(--hub-accent)] text-white'
                        : isActive
                        ? 'bg-[color:var(--hub-accent)] text-white ring-2 ring-[color:var(--hub-accent)] ring-offset-2'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                    }
                  `}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`
                    mt-2 text-xs font-medium text-center
                    ${
                      isActive || isCompleted
                        ? 'text-zinc-900 dark:text-zinc-100'
                        : 'text-zinc-500 dark:text-zinc-400'
                    }
                  `}
                >
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
        <div className="relative h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-[color:var(--hub-accent)] transition-all duration-500 ease-out rounded-full"
            style={{ width: `${currentProgress}%` }}
          />
        </div>
      </div>

      {/* Mobile: Compact progress bar */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            {stages.find((s) => s.id === currentStage)?.label || 'Processing'}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {currentProgress}%
          </span>
        </div>
        <div className="relative h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-[color:var(--hub-accent)] transition-all duration-500 ease-out rounded-full"
            style={{ width: `${currentProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

