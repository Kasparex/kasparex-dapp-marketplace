'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { RewardCalculator } from '@/components/rewards/RewardCalculator';
import { RewardsCalculatorSidebar } from '@/components/rewards/RewardsCalculatorSidebar';
import { RewardsCalculatorHeader } from '@/components/rewards/RewardsCalculatorHeader';

export default function RewardsCalculatorPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex flex-col lg:flex-row">
        <div className="hidden lg:block flex-shrink-0">
          <RewardsCalculatorSidebar />
        </div>
        <div className="lg:hidden">
          <RewardsCalculatorSidebar />
        </div>
        <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 lg:pl-6 overflow-y-auto bg-white dark:bg-zinc-950">
          <div className="max-w-6xl mx-auto">
            <RewardsCalculatorHeader />
            <RewardCalculator />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

