import { notFound } from 'next/navigation';
import { getGameBySlugFromRegistry, getSlugRoutedGames } from '@/lib/games/registry';
import { GameSlugResolver } from './GameSlugResolver';
import { buildHubOpenGraphMetadata } from '@/lib/metadata/hubSocialPreview';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  return getSlugRoutedGames().map((game) => ({ slug: game.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const game = getGameBySlugFromRegistry(slug);

  if (!game) {
    return buildHubOpenGraphMetadata({
      title: 'Game - Kasparex Games',
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
  const registryGame = getGameBySlugFromRegistry(slug);

  // Custom-route registry titles have their own pages under /games/<name>.
  if (registryGame && registryGame.route.kind !== 'slug') {
    notFound();
  }

  return (
    <GameSlugResolver
      slug={slug}
      registryGame={registryGame && registryGame.route.kind === 'slug' ? registryGame : null}
    />
  );
}
