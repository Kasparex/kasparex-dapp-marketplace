'use client';

import { Game, gameTypes, difficultyLevels } from '@/lib/games/games';
import { GameDifficultyBadge } from './GameDifficultyBadge';
import { GameTypeIcon } from './GameTypeIcon';

interface GameInfoPanelProps {
  game: Game;
}

export function GameInfoPanel({ game }: GameInfoPanelProps) {
  const gameType = gameTypes[game.gameType];
  const difficulty = difficultyLevels[game.difficulty];

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
          Game Information
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Type:</span>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              <span className="inline-flex items-center gap-2">
                <GameTypeIcon type={game.gameType} className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                {gameType.name}
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Difficulty:</span>
            <GameDifficultyBadge difficulty={game.difficulty} size="sm" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Status:</span>
            {game.status === 'beta' && (
              <span className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded">
                Beta
              </span>
            )}
            {game.status === 'active' && (
              <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded">
                Active
              </span>
            )}
            {game.status === 'coming-soon' && (
              <span className="px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded">
                Coming Soon
              </span>
            )}
            {game.status === 'maintenance' && (
              <span className="px-2 py-1 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded">
                Maintenance
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Developer:</span>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {game.developer}
            </span>
          </div>
          {game.version && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Version:</span>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {game.version}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
          Entry Cost
        </h3>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {game.entryCostKAS}
          </span>
          <span className="text-lg font-medium text-zinc-600 dark:text-zinc-400">KAS</span>
        </div>
      </div>

      {game.rewardConfig && (
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
            Rewards
          </h3>
          <div className="space-y-2">
            {game.rewardConfig.gridReward && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">GRID:</span>
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {game.rewardConfig.gridReward} GRID
                </span>
              </div>
            )}
            {game.rewardConfig.xpReward && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">L2 pts:</span>
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {game.rewardConfig.xpReward} L2 pts
                </span>
              </div>
            )}
            {game.rewardConfig.dAppTokenReward && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">dApp Token:</span>
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {game.rewardConfig.dAppTokenReward} Tokens
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {game.instructions && (
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
            How to Play
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {game.instructions}
          </p>
        </div>
      )}
    </div>
  );
}
