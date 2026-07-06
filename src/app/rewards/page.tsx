import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { RewardsHubSection } from '@/components/rewards/RewardsHubSection';
import { RewardsSidebar } from '@/components/rewards/RewardsSidebar';
import { HubAccentScope } from '@/components/hub/HubAccentScope';
import { HUB_MAIN_COLUMN, HUB_MAIN_INNER, HUB_PAGE_BG } from '@/lib/hub/hubLayout';

export const metadata: Metadata = {
  title: 'Rewards · Kasparex',
  description: 'Browse rewards, perks, badges, and ecosystem benefits across Kasparex Hub.',
};

export default function RewardsPage() {
  return (
    <div className={`flex flex-col min-h-screen ${HUB_PAGE_BG}`}>
      <Header />
      <main className="flex-1 flex flex-col lg:flex-row">
        <div className="hidden lg:block flex-shrink-0">
          <RewardsSidebar />
        </div>
        <div className="lg:hidden">
          <RewardsSidebar />
        </div>

        <HubAccentScope projectId="kasparex-rewards" className={HUB_MAIN_COLUMN}>
          <div className={HUB_MAIN_INNER}>
            <RewardsHubSection />
          </div>
        </HubAccentScope>
      </main>
      <Footer />
    </div>
  );
}

