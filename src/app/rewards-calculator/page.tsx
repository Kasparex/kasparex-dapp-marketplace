'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { RewardCalculator } from '@/components/rewards/RewardCalculator';

export default function RewardsCalculatorPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-white dark:bg-zinc-950">
        <RewardCalculator />
      </main>
      <Footer />
    </div>
  );
}

