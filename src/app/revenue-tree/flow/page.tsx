import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { RevenueTreeFlowView } from '@/components/revenue-tree/RevenueTreeFlowView';

export const metadata = {
  title: 'Revenue Tree Flow - Kasparex',
  description: 'Matrix view of your Revenue Tree: referrers, levels, revenue shares, and your position',
};

export default function RevenueTreeFlowPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex flex-col">
        <RevenueTreeFlowView />
      </main>
      <Footer />
    </div>
  );
}
