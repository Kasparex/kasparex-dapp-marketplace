import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PointsPageContent } from '@/components/rewards/PointsPageContent';

export default function PointsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <PointsPageContent />
      </main>
      <Footer />
    </div>
  );
}

