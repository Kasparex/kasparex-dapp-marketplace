/**
 * Individual Token Page
 * Landing page for a specific token (registry + dashboard-published listings).
 */

import { getTokenBySlug } from '@/lib/tokens/registry';
import { loadTokenWithMetadata } from '@/lib/tokens/metadata';
import { buildHubOpenGraphMetadata } from '@/lib/metadata/hubSocialPreview';
import { TokenPageContent } from './TokenPageContent';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = 'force-dynamic';

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  return [];
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const token = getTokenBySlug(slug);

  if (!token) {
    return buildHubOpenGraphMetadata({
      title: 'Token - Kasparex Tokens',
      description: 'Token landing page on Kasparex Tokens.',
      path: `/tokens/${slug}`,
    });
  }

  return buildHubOpenGraphMetadata({
    title: `${token.name} (${token.symbol}) - Kasparex Tokens`,
    description: token.shortDescription || token.description,
    image: token.logo || token.logoCid,
    path: `/tokens/${slug}`,
  });
}

export default async function TokenPage({ params }: PageProps) {
  const { slug } = await params;
  const registryToken = getTokenBySlug(slug);
  const serverToken = registryToken ? await loadTokenWithMetadata(registryToken) : null;

  return <TokenPageContent slug={slug} serverToken={serverToken} />;
}
