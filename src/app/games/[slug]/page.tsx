import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { GameInfoPanel } from '@/components/games/GameInfoPanel';
import { RelatedGames } from '@/components/games/RelatedGames';
import { CommentsSection } from '@/components/vblog/CommentsSection';
import { placeholderGames, getGameBySlug } from '@/lib/games/games';
import { GamePayment } from '@/components/games/GamePayment';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generate static params for all game slugs
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  return placeholderGames.map((game) => ({
    slug: game.slug,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const game = getGameBySlug(placeholderGames, slug);

  if (!game) {
    return {
      title: 'Game Not Found - Kasparex Games',
    };
  }

  return {
    title: `${game.name} - Kasparex Games`,
    description: game.description,
  };
}

export default async function GamePage({ params }: PageProps) {
  const { slug } = await params;
  const game = getGameBySlug(placeholderGames, slug);

  if (!game) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        {/* Main Content */}
        <div className="max-w-6xl mx-auto w-full p-4 sm:p-6 lg:px-16 lg:py-12">
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

          {/* Game Embed Area (placeholder for now) */}
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

      <Footer />
    </div>
  );
}
