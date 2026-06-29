import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getGameBySlugFromRegistry, getSlugRoutedGames } from '@/lib/games/registry';
import { GameContent } from './GameContent';
import { buildHubOpenGraphMetadata } from '@/lib/metadata/hubSocialPreview';

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
    return buildHubOpenGraphMetadata({
      title: 'Game Not Found - Kasparex Games',
      path: `/games/${slug}`,
    });
  }

  return buildHubOpenGraphMetadata({
    title: `${game.name} - Kasparex Games`,
    description: game.description,
    image: game.image,
    path: `/games/${slug}`,
  });
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
