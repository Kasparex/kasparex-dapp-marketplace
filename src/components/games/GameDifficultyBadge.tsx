'use client';

import { GameDifficulty, difficultyLevels } from '@/lib/games/games';
import { KxBadge, type KxBadgeVariant } from '@/components/ui/KxBadge';

interface GameDifficultyBadgeProps {
  difficulty: GameDifficulty;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const DIFFICULTY_VARIANT: Record<GameDifficulty, KxBadgeVariant> = {
  easy: 'emerald',
  medium: 'amber',
  hard: 'orange',
  expert: 'rose',
};

export function GameDifficultyBadge({ difficulty, size = 'md', className = '' }: GameDifficultyBadgeProps) {
  const level = difficultyLevels[difficulty];
  const badgeSize = size === 'lg' ? 'default' : size === 'sm' ? 'sm' : 'default';

  return (
    <span title={`Difficulty: ${level.name}`} aria-label={`Difficulty: ${level.name}`}>
      <KxBadge variant={DIFFICULTY_VARIANT[difficulty]} size={badgeSize} className={className}>
        {level.name}
      </KxBadge>
    </span>
  );
}
