import dynamicImport from 'next/dynamic';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

// Dynamically import ListingDetailContent with no SSR
const ListingDetailContent = dynamicImport(
  () => import('./ListingDetailContent').then(mod => ({ default: mod.ListingDetailContent })),
  { ssr: false }
);

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface ListingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { id } = await params;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <ListingDetailContent id={id} />
      </main>
      <Footer />
    </div>
  );
}

