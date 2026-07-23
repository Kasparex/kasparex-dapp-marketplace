import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { RewardsHubSection } from '@/components/rewards/RewardsHubSection';
import { RewardsSidebar } from '@/components/rewards/RewardsSidebar';
import { HubPageAccentLayout } from '@/components/hub/HubPageAccentLayout';
import { HUB_MAIN_COLUMN, HUB_MAIN_INNER, HUB_PAGE_BG } from '@/lib/hub/hubLayout';

export const metadata: Metadata = {
  title: 'Rewards',
  description: 'Browse rewards, perks, badges, and ecosystem benefits across Kasparex Hub.',
};

export default function RewardsPage() {
  return (
    <div className={`flex flex-col min-h-screen ${HUB_PAGE_BG}`}>
      <Header />
      <main className="flex-1 flex flex-col lg:flex-row">
        <HubPageAccentLayout projectId="kasparex-rewards">
        <div className="hidden lg:block flex-shrink-0">
          <RewardsSidebar />
        </div>
        <div className="lg:hidden">
          <RewardsSidebar />
        </div>

        <div className={HUB_MAIN_COLUMN}>
          <div className={HUB_MAIN_INNER}>
            <RewardsHubSection />
          </div>
        </div>
        </HubPageAccentLayout>
      </main>
      <Footer />
    </div>
  );
}

