import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { RevenueTreeDashboard } from '@/components/revenue-tree/RevenueTreeDashboard';

export const metadata = {
  title: 'Revenue Tree Dashboard - Kasparex',
  description: 'Manage your revenue trees, track earnings, and view your referral network',
};

export default function RevenueTreeDashboardPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex flex-col">
        <RevenueTreeDashboard />
      </main>
      <Footer />
    </div>
  );
}
