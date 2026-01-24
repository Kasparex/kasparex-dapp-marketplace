import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { placeholderGames, getGameBySlug } from '@/lib/games/games';
import { GameContent } from './GameContent';

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
      <GameContent game={game} />
      <Footer />
    </div>
  );
}
