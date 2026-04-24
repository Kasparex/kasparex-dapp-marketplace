import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getGameBySlugFromRegistry, getSlugRoutedGames } from '@/lib/games/registry';
import { GameContent } from './GameContent';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generate static params for all game slugs
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  return getSlugRoutedGames().map((game) => ({ slug: game.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const game = getGameBySlugFromRegistry(slug);

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
  const game = getGameBySlugFromRegistry(slug);

  // Only slug-routed games belong here. Custom games use their own pages.
  if (!game || game.route.kind !== 'slug') {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <GameContent game={game} />
      <Footer />
    </div>
  );
}
