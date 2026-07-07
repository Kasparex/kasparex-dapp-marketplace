import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DAppSidebar } from '@/components/DAppSidebar';
import { DAppDetail } from '@/components/DAppDetail';
import { DAppDirectorySlugPage } from '@/components/dapps/DAppDirectorySlugPage';
import { DAppFooter } from '@/components/dapps/DAppFooter';
import { RelatedDApps } from '@/components/dapps/RelatedDApps';
import { ReferralTracker } from '@/components/revenue-tree/ReferralTracker';
import { placeholderDApps } from '@/lib/dapps';
import { getDAppBySlug, generateDAppSlug } from '@/lib/utils';
import { getContractAddress } from '@/lib/contracts/addresses';
import { buildHubOpenGraphMetadata } from '@/lib/metadata/hubSocialPreview';
import { getDirectoryListingBySlugServer, listingFeaturedImageUrl } from '@/lib/dapps/listingServer';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Force dynamic rendering to support useSearchParams in child components
export const dynamic = 'force-dynamic';

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
    // Try to get from environment (this is server-side, so we can't use hooks)
    // The client component will handle fetching the actual address
    contractAddress = '';
  }

  // Use slug from params (already extracted above)
  const dappSlug = slug;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      {/* Referral Tracker */}
      <ReferralTracker contentType="dapp" contentSlug={dappSlug} />
      
      <main className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Left Sidebar - Rewards & Info */}
          <DAppSidebar dapp={dapp} />

          {/* Main Content - Two Column Layout */}
          <div className="flex-1 min-w-0 p-4 sm:p-6 lg:px-16 lg:py-12">
            <DAppDetail dapp={dapp} contractAddress={contractAddress} />
            <DAppFooter contractAddress={contractAddress} />
          </div>
        </div>

        {/* Related dApps - Below layout */}
        <div className="px-4 sm:px-6 lg:px-8 lg:pl-6 pb-4 sm:pb-6 lg:pb-8">
          <RelatedDApps currentDApp={dapp} />
        </div>
      </main>

      <Footer />
    </div>
  );
}

