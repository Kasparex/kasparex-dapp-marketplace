import { TiersSidebar } from '@/components/rewards/TiersSidebar';
import { RewardsDashboardContent } from '@/components/rewards/RewardsDashboardContent';
import { TiersHeader } from '@/components/rewards/TiersHeader';
import { HubDocPageShell } from '@/components/hub/HubDocPageShell';
import { HubListingTitleRow } from '@/components/hub/HubListingTitleRow';
import { HubBenefitsPanel } from '@/components/hub/HubBenefitsPanel';

export default function TiersPage() {
  const filters = {
    types: ['krex-tier', 'nft', 'node', 'premium'] as ('krex-tier' | 'nft' | 'node' | 'premium')[],
    status: ['unlocked', 'locked'] as ('unlocked' | 'locked')[],
  };
  const searchQuery = '';

  return (
    <HubDocPageShell
      sidebar={
        <>
          <div className="hidden shrink-0 lg:block">
            <TiersSidebar />
          </div>
          <div className="lg:hidden">
            <TiersSidebar />
          </div>
        </>
      }
    >
      <TiersHeader />
      <div id="content" className="scroll-mt-4" />
      <HubListingTitleRow
        title="Hub pts and tier perks"
        count={4}
        countLabel="reward category"
        benefits={<HubBenefitsPanel variant="compact" className="w-full" />}
      />
      <RewardsDashboardContent filters={filters} searchQuery={searchQuery} />
    </HubDocPageShell>
  );
}
