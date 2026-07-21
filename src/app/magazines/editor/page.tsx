'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MagazineEditor } from '@/components/magazines/editor/MagazineEditor';
import { MagazinesSidebar } from '@/components/magazines/MagazinesSidebar';
import { VBlogFeeCard } from '@/components/vblog/VBlogPricingCards';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { applyKrexFeeDiscount } from '@/lib/hub/applyKrexFeeDiscount';
import { HubAccentScope } from '@/components/hub/HubAccentScope';
import { HubDashboardPageHeader } from '@/components/hub/HubDashboardPageHeader';
import { HUB_DELETE_FEE_KAS } from '@/lib/hub/paidDelete';

const MAGAZINE_LISTING_FEE_KAS = 50;
const MAGAZINE_EDIT_FEE_KAS = 1;

export default function MagazineEditorPage() {
  const { tier: krexTier } = useKREXBalance();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <HubAccentScope projectId="kasparex-magazines" className="flex flex-1">
        <MagazinesSidebar mode="utility" />

        <main className="w-full flex-1 overflow-y-auto border-l border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:p-6 lg:p-12">
          <HubDashboardPageHeader
            kicker="Magazines dashboard"
            title="Create"
            titleAccent="Issue"
            excerpt="Build a modular magazine issue with form panels, premium modules, Benefits, and calculation breakdown."
            adSlotId="HALO_MAGAZINES_RIGHT"
          />

          <div id="magazines-dashboard-pricing" className="mb-8 grid scroll-mt-24 grid-cols-1 gap-4 md:grid-cols-3">
            <VBlogFeeCard
              title="Listing Fee"
              feeKas={applyKrexFeeDiscount(MAGAZINE_LISTING_FEE_KAS, krexTier)}
              basePoints={HUB_EARN_POINTS.magazineIssuePublish}
              tier={krexTier}
            />
            <VBlogFeeCard
              title="Edit / Update"
              feeKas={applyKrexFeeDiscount(MAGAZINE_EDIT_FEE_KAS, krexTier)}
              tier={krexTier}
            />
            <VBlogFeeCard
              title="Delete Fee"
              feeKas={applyKrexFeeDiscount(HUB_DELETE_FEE_KAS.magazineIssues, krexTier)}
              tier={krexTier}
            />
          </div>

          <div id="magazines-dashboard-create" className="scroll-mt-24">
            <MagazineEditor />
          </div>
        </main>
      </HubAccentScope>

      <Footer />
    </div>
  );
}
