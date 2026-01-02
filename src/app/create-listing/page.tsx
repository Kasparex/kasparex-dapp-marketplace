import dynamic from 'next/dynamic';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

// Dynamically import CreateListingContent with no SSR
const CreateListingContent = dynamic(
  () => import('./CreateListingContent').then(mod => ({ default: mod.CreateListingContent })),
  { ssr: false }
);

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function CreateListingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <CreateListingContent />
      </main>
      <Footer />
    </div>
  );
}

