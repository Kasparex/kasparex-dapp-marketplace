import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DAppSidebar } from '@/components/DAppSidebar';
import { DAppDetail } from '@/components/DAppDetail';
import { DAppFooter } from '@/components/dapps/DAppFooter';
import { RelatedDApps } from '@/components/dapps/RelatedDApps';
import { CommentsSection } from '@/components/vblog/CommentsSection';
import { ReferralTracker } from '@/components/revenue-tree/ReferralTracker';
import { placeholderDApps } from '@/lib/dapps';
import { getDAppBySlug, generateDAppSlug } from '@/lib/utils';
import { getContractAddress } from '@/lib/contracts/addresses';

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

  if (!dapp) {
    return {
      title: 'dApp Not Found - Kasparex dApps',
    };
  }

  return {
    title: `${dapp.name} - Kasparex dApps`,
    description: dapp.description || dapp.utility,
  };
}

export default async function DAppPage({ params }: PageProps) {
  const { slug } = await params;
  const dapp = getDAppBySlug(placeholderDApps, slug);

  if (!dapp) {
    notFound();
  }

  // Get contract address for Simple Payment dApp
  let contractAddress = dapp.contractAddress;
  if (!contractAddress && dapp.slug === 'simple-payment') {
    // Try to get from environment (this is server-side, so we can't use hooks)
    // The client component will handle fetching the actual address
    contractAddress = '';
  }

  const slug = dapp.slug || generateDAppSlug(dapp.name);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      {/* Referral Tracker */}
      <ReferralTracker contentType="dapp" contentSlug={slug} />
      
      <main className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Left Sidebar - Rewards & Info */}
          <DAppSidebar dapp={dapp} />

          {/* Main Content - Two Column Layout */}
          <div className="flex-1 min-w-0 p-4 sm:p-6 lg:px-16 lg:py-12">
            <DAppDetail dapp={dapp} contractAddress={contractAddress} />
            <DAppFooter contractAddress={contractAddress} />
            
            {/* Comments Section */}
            <div className="mt-8">
              <CommentsSection articleId={`dapp:${slug}`} />
            </div>
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

