import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { RevenueTreeFlowLayout } from '@/components/revenue-tree/RevenueTreeFlowLayout';

export const metadata = {
  title: 'Revenue Tree - Kasparex',
  description: 'View the structural flow and referral network of this wallet',
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
        <RevenueTreeFlowLayout walletAddress={walletAddress} />
      </main>
      <Footer />
    </div>
  );
}
