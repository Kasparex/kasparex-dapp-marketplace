import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { RevenueTreeDashboard } from '@/components/revenue-tree/RevenueTreeDashboard';

export const metadata = {
  title: 'Revenue Tree - Kasparex',
  description: 'Manage your revenue tree, track earnings, and view your referral network',
};

interface PageProps {
  params: Promise<{ walletAddress: string }>;
}

export default async function RevenueTreeUserPage({ params }: PageProps) {
  const { walletAddress } = await params;
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex flex-col">
        {/* We can reuse Dashboard as the base template for user pages, 
            but in a real implementation we would pass the walletAddress to the dashboard 
            to view as a 'public' profile vs 'own' dashboard. */}
        <RevenueTreeDashboard viewAddress={walletAddress} />
      </main>
      <Footer />
    </div>
  );
}
