import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { RewardsHeader } from '@/components/rewards/RewardsHeader';
import { RewardsPageContent } from '@/components/rewards/RewardsPageContent';
import { RewardsSidebar } from '@/components/rewards/RewardsSidebar';

export const metadata: Metadata = {
  title: 'Rewards · Kasparex',
  description: 'Browse rewards, perks, badges, and ecosystem benefits across Kasparex Hub.',
};

export default function RewardsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex flex-col lg:flex-row">
        <div className="hidden lg:block flex-shrink-0">
          <RewardsSidebar />
        </div>
        <div className="lg:hidden">
          <RewardsSidebar />
        </div>

        <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 lg:pl-6 overflow-y-auto bg-white dark:bg-zinc-950">
          <div className="max-w-6xl mx-auto">
            <RewardsHeader />
            <RewardsPageContent />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

