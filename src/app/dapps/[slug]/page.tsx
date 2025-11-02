import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DAppSidebar } from '@/components/DAppSidebar';
import { DAppDetail } from '@/components/DAppDetail';
import { placeholderDApps } from '@/lib/dapps';
import { getDAppBySlug } from '@/lib/utils';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
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

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 flex flex-col lg:flex-row">
        {/* dApp-Specific Sidebar */}
        <DAppSidebar dapp={dapp} />

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 lg:pl-6">
          <DAppDetail dapp={dapp} />
        </div>
      </main>

      <Footer />
    </div>
  );
}

