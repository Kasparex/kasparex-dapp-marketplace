'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GamesSidebar } from '@/components/games/GamesSidebar';
import { GameInfoPanel } from '@/components/games/GameInfoPanel';
import { RelatedGames } from '@/components/games/RelatedGames';
import { CommentsSection } from '@/components/vblog/CommentsSection';
import { GamePayment } from '@/components/games/GamePayment';
import { placeholderGames, GameType, GameDifficulty, GameStatus, Game } from '@/lib/games/games';
import { getGameTypeCounts, getDifficultyCounts, getStatusCounts, GameFilterState } from '@/lib/games/filtering';

interface GameContentProps {
    game: Game;
}

export function GameContent({ game }: GameContentProps) {
    const router = useRouter();

    // Sidebar state
    const [selectedGameTypes, setSelectedGameTypes] = useState<GameType[]>([]);
    const [selectedDifficulties, setSelectedDifficulties] = useState<GameDifficulty[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<GameStatus[]>([]);
    const [costRange, setCostRange] = useState<{ min: number; max: number } | undefined>();
    const [searchQuery, setSearchQuery] = useState('');

    // Get counts for sidebar
    const gameTypeCounts = useMemo(() => {
        const filters: Omit<GameFilterState, 'gameType'> = {
            difficulty: selectedDifficulties,
            status: selectedStatuses,
            costRange,
        };
        return getGameTypeCounts(placeholderGames, filters, searchQuery);
    }, [selectedDifficulties, selectedStatuses, costRange, searchQuery]);

    const difficultyCounts = useMemo(() => {
        const filters: Omit<GameFilterState, 'difficulty'> = {
            gameType: selectedGameTypes,
            status: selectedStatuses,
            costRange,
        };
        return getDifficultyCounts(placeholderGames, filters, searchQuery);
    }, [selectedGameTypes, selectedStatuses, costRange, searchQuery]);

    const statusCounts = useMemo(() => {
        const filters: Omit<GameFilterState, 'status'> = {
            gameType: selectedGameTypes,
            difficulty: selectedDifficulties,
            costRange,
        };
        return getStatusCounts(placeholderGames, filters, searchQuery);
    }, [selectedGameTypes, selectedDifficulties, costRange, searchQuery]);

    // Handle filter changes - redirect to main games page with filters
    const handleFilterChange = () => {
        router.push('/games');
    };

    return (
        <main className="flex-1 flex flex-col lg:flex-row">
            {/* Sidebar */}
            <div className="hidden lg:block flex-shrink-0">
                <GamesSidebar
                    selectedGameTypes={selectedGameTypes}
                    onGameTypeChange={(types) => { setSelectedGameTypes(types); handleFilterChange(); }}
                    selectedDifficulties={selectedDifficulties}
                    onDifficultyChange={(diffs) => { setSelectedDifficulties(diffs); handleFilterChange(); }}
                    selectedStatuses={selectedStatuses}
                    onStatusChange={(stats) => { setSelectedStatuses(stats); handleFilterChange(); }}
                    costRange={costRange}
                    onCostRangeChange={(range) => { setCostRange(range); handleFilterChange(); }}
                    gameTypeCounts={gameTypeCounts}
                    difficultyCounts={difficultyCounts}
                    statusCounts={statusCounts}
                    searchQuery={searchQuery}
                    onSearchChange={(q) => { setSearchQuery(q); handleFilterChange(); }}
                    onResetFilters={() => { router.push('/games'); }}
                    backLink={{ href: '/games', label: 'Back to Games' }}
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0 p-4 sm:p-6 lg:px-16 lg:py-12">
                {/* Game Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                            {game.name}
                        </h1>
                        {game.status === 'beta' && (
                            <span className="px-2.5 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded">
                                Beta
                            </span>
                        )}
                    </div>
                    <p className="text-lg text-zinc-600 dark:text-zinc-400">
                        {game.description}
                    </p>
                </div>

                {/* Game Info Panel */}
                <div className="mb-6">
                    <GameInfoPanel game={game} />
                </div>

                {/* Payment and Play Section */}
                <div className="mb-6">
                    <GamePayment game={game} />
                </div>

                {/* Game Embed Area */}
                {game.gameUrl && (
                    <div className="mb-6 bg-zinc-100 dark:bg-zinc-900 rounded-lg p-4 min-h-[400px] flex items-center justify-center">
                        <p className="text-zinc-500 dark:text-zinc-400">
                            Game will be embedded here: {game.gameUrl}
                        </p>
                    </div>
                )}

                {/* Comments Section */}
                <div className="mt-8">
                    <CommentsSection articleId={`game:${game.slug || game.id}`} />
                </div>

                {/* Related Games */}
                <RelatedGames currentGame={game} />
            </div>
        </main>
    );
}
