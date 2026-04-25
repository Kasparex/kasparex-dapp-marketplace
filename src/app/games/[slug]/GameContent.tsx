'use client';

import { GameInfoPanel } from '@/components/games/GameInfoPanel';
import { RelatedGames } from '@/components/games/RelatedGames';
import { CommentsSection } from '@/components/vblog/CommentsSection';
import { GamePayment } from '@/components/games/GamePayment';
import { GamesPlayAdRail } from '@/components/games/GamesPlayAdRail';
import type { Game } from '@/lib/games/games';

interface GameContentProps {
  game: Game;
}

export function GameContent({ game }: GameContentProps) {
  return (
    <main className="min-w-0 flex-1 p-4 sm:p-6 lg:px-16 lg:py-12">
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-3">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{game.name}</h1>
          {game.status === 'beta' && (
            <span className="rounded bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
              Beta
            </span>
          )}
        </div>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">{game.description}</p>
      </div>

      <div className="mb-6">
        <GameInfoPanel game={game} />
      </div>

      <div className="mb-6">
        <GamePayment game={game} />
      </div>

      {game.gameUrl && (
        <div className="mb-6 flex min-h-[400px] items-center justify-center rounded-lg bg-zinc-100 p-4 dark:bg-zinc-900">
          <p className="text-zinc-500 dark:text-zinc-400">Game will be embedded here: {game.gameUrl}</p>
        </div>
      )}

      <div className="mt-8">
        <CommentsSection articleId={`game:${game.slug || game.id}`} />
      </div>

      <div className="mt-8 flex justify-end">
        <div className="w-full max-w-sm">
          <GamesPlayAdRail />
        </div>
      </div>

      <RelatedGames currentGame={game} />
    </main>
  );
}
