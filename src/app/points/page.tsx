import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PointsHeader } from '@/components/rewards/PointsHeader';
import { PointsTables } from '@/components/rewards/PointsTables';
import { PointsSidebarSimple } from '@/components/rewards/PointsSidebarSimple';

export const metadata: Metadata = {
  title: 'Points · Kasparex',
  description: 'Points rules, module scoring tables, and score breakdowns for Kasparex Leaderboard.',
};

export default function PointsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex flex-col lg:flex-row">
        <div className="hidden lg:block flex-shrink-0">
          <PointsSidebarSimple />
        </div>
        <div className="lg:hidden">
          <PointsSidebarSimple />
        </div>

        <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 lg:pl-6 overflow-y-auto bg-white dark:bg-zinc-950">
          <div className="max-w-6xl mx-auto">
            <PointsHeader />
            <PointsTables />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

