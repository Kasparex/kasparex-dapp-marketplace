import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { RevenueTreeFlowView } from '@/components/revenue-tree/RevenueTreeFlowView';

export const metadata = {
  title: 'Revenue Tree Flow - Kasparex',
  description: 'Matrix view of Revenue Tree: levels, referrers, revenue shares, and your position',
};

interface PageProps {
  params: Promise<{ walletAddress: string }>;
}

export default async function RevenueTreeFlowWalletPage({ params }: PageProps) {
  const { walletAddress } = await params;
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex flex-col">
        <RevenueTreeFlowView walletAddress={walletAddress} />
      </main>
      <Footer />
    </div>
  );
}
