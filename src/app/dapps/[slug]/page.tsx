import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DAppSlugPageShell } from '@/components/dapps/DAppSlugPageShell';
import { DAppDirectorySlugPage } from '@/components/dapps/DAppDirectorySlugPage';
import { placeholderDApps } from '@/lib/dapps';
import { getDAppBySlug, generateDAppSlug } from '@/lib/utils';
import { buildHubOpenGraphMetadata } from '@/lib/metadata/hubSocialPreview';
import { getDirectoryListingBySlugServer, listingFeaturedImageUrl } from '@/lib/dapps/listingServer';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

// ISR: public dApp shell; wallet-specific UI loads client-side.
export const revalidate = 3600;

// Generate static params for all dApp slugs
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  return placeholderDApps.map((dapp) => ({
    slug: dapp.slug || generateDAppSlug(dapp.name),
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const dapp = getDAppBySlug(placeholderDApps, slug);

  if (dapp) {
    return buildHubOpenGraphMetadata({
      title: `${dapp.name} - Kasparex dApps`,
      description: dapp.description || dapp.utility,
      image: dapp.featuredImage || dapp.image || dapp.logoImage,
      path: `/dapps/${slug}`,
    });
  }

  const listing = await getDirectoryListingBySlugServer(slug);
  if (listing) {
    return buildHubOpenGraphMetadata({
      title: `${listing.name} - Kasparex dApps`,
      description: listing.shortDescription || listing.fullDescription,
      image: listingFeaturedImageUrl(listing),
      path: `/dapps/${slug}`,
    });
  }

  return buildHubOpenGraphMetadata({
    title: 'dApp Not Found - Kasparex dApps',
    path: `/dapps/${slug}`,
  });
}

export default async function DAppPage({ params }: PageProps) {
  const { slug } = await params;
  const dapp = getDAppBySlug(placeholderDApps, slug);

  if (!dapp) {
    return <DAppDirectorySlugPage slug={slug} />;
  }

  // Get contract address for Simple Payment dApp
  let contractAddress = dapp.contractAddress;
  if (!contractAddress && dapp.slug === 'simple-payment') {
    // Client component will handle fetching the actual address
    contractAddress = '';
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 flex flex-col">
        <DAppSlugPageShell dapp={dapp} contractAddress={contractAddress} />
      </main>

      <Footer />
    </div>
  );
}

