/**
 * Individual Token Page
 * Landing page for a specific token
 */

import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { TokenLandingPage } from '@/components/tokens/TokenLandingPage';
import { getTokenBySlug, getAllTokens } from '@/lib/tokens/registry';
import { loadTokenWithMetadata } from '@/lib/tokens/metadata';
import { generateDAppSlug } from '@/lib/utils';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = 'force-dynamic';

// Generate static params for all token slugs
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const tokens = getAllTokens();
  return tokens.map((token) => ({
    slug: token.slug,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const token = getTokenBySlug(slug);

  if (!token) {
    return {
      title: 'Token Not Found - Kasparex Tokens',
    };
  }

  return {
    title: `${token.name} (${token.symbol}) - Kasparex Tokens`,
    description: token.shortDescription || token.description,
  };
}

export default async function TokenPage({ params }: PageProps) {
  const { slug } = await params;
  const token = getTokenBySlug(slug);

  if (!token) {
    notFound();
  }

  // Load IPFS metadata if available
  const tokenWithMetadata = await loadTokenWithMetadata(token);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        <TokenLandingPage token={tokenWithMetadata} />
      </main>

      <Footer />
    </div>
  );
}
