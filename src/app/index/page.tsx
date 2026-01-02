import dynamic from 'next/dynamic';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

// Dynamically import IndexPageContent with no SSR to prevent build-time evaluation
const IndexPageContent = dynamic(
  () => import('./IndexPageContent').then(mod => ({ default: mod.IndexPageContent })),
  { ssr: false }
);

// Force dynamic rendering to avoid SSR issues
export const dynamic = 'force-dynamic';

export default function IndexPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <IndexPageContent />
      </main>
      <Footer />
    </div>
  );
}

