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
      <main className="flex-1 p-4 sm:p-6 lg:px-16 lg:py-12">
        <RevenueTreeDashboard />
      </main>
      <Footer />
    </div>
  );
}
