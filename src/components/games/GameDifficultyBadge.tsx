'use client';

import { GameDifficulty, difficultyLevels } from '@/lib/games/games';

interface GameDifficultyBadgeProps {
  difficulty: GameDifficulty;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function GameDifficultyBadge({ difficulty, size = 'md', className = '' }: GameDifficultyBadgeProps) {
  const level = difficultyLevels[difficulty];
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  const colorClasses = {
    easy: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700',
    medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
    hard: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700',
    expert: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${sizeClasses[size]} font-medium rounded-md border ${colorClasses[difficulty]} ${className}`}
      title={`Difficulty: ${level.name}`}
      aria-label={`Difficulty: ${level.name}`}
    >
      {level.name}
    </span>
  );
}
