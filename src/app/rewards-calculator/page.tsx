'use client';

import { RewardCalculator } from '@/components/rewards/RewardCalculator';
import { RewardsCalculatorSidebar } from '@/components/rewards/RewardsCalculatorSidebar';
import { RewardsCalculatorHeader } from '@/components/rewards/RewardsCalculatorHeader';
import { HubDocPageShell } from '@/components/hub/HubDocPageShell';
import { HubListingTitleRow } from '@/components/hub/HubListingTitleRow';
import { HubBenefitsPanel } from '@/components/hub/HubBenefitsPanel';

export default function RewardsCalculatorPage() {
  return (
    <HubDocPageShell
      projectId="kasparex-rewards"
      sidebar={
        <>
          <div className="hidden shrink-0 lg:block">
            <RewardsCalculatorSidebar />
          </div>
          <div className="lg:hidden">
            <RewardsCalculatorSidebar />
          </div>
        </>
      }
    >
      <RewardsCalculatorHeader />
      <div id="content" className="scroll-mt-4" />
      <HubListingTitleRow
        projectId="kasparex-rewards"
        title="Reward simulator"
        count={1}
        countLabel="calculator"
        benefits={<HubBenefitsPanel variant="compact" scope="rewards" className="w-full" />}
      />
      <div id="reward-calculator" className="scroll-mt-24">
        <RewardCalculator />
      </div>
    </HubDocPageShell>
  );
}
