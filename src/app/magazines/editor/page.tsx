'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MagazineEditor } from '@/components/magazines/editor/MagazineEditor';
import { MagazinesSidebar } from '@/components/magazines/MagazinesSidebar';
import { VBlogFeeCard } from '@/components/vblog/VBlogPricingCards';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { useKREXBalance } from '@/hooks/useKREXBalance';

const MAGAZINE_LISTING_FEE_KAS = 50;
const MAGAZINE_PREMIUM_MODULE_FEE_KAS = 12;

export default function MagazineEditorPage() {
  const { tier: krexTier } = useKREXBalance();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <div className="flex flex-1">
        <MagazinesSidebar mode="utility" />

        <main className="w-full flex-1 overflow-y-auto bg-white p-4 dark:bg-zinc-950 sm:p-6 lg:p-12">
          <div className="mb-10">
            <p className="mb-2 text-sm font-black uppercase tracking-widest text-[#02abb8]">Magazines dashboard</p>
            <h1 className="mb-3 text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl lg:text-5xl">
              Create{' '}
              <span className="bg-gradient-to-r from-cyan-600 to-emerald-500 bg-clip-text text-transparent">Issue</span>
            </h1>
            <p className="kx-body max-w-2xl">
              Build a modular magazine issue with the same creator layout as vBlog: form panels, premium modules, Benefits, and calculation breakdown.
            </p>
          </div>

          <div id="magazines-dashboard-pricing" className="mb-8 grid scroll-mt-24 grid-cols-1 gap-4 md:grid-cols-3">
            <VBlogFeeCard
              title="Issue publish fee"
              feeKas={MAGAZINE_LISTING_FEE_KAS}
              basePoints={HUB_EARN_POINTS.magazineIssuePublish}
              tier={krexTier}
            />
            <VBlogFeeCard title="Premium module" feeKas={MAGAZINE_PREMIUM_MODULE_FEE_KAS} tier={krexTier} />
            <VBlogFeeCard title="Hub points" feeKas={0} note={`Earn +${HUB_EARN_POINTS.magazineIssuePublish} pts on publish`} />
          </div>

          <div id="magazines-dashboard-create" className="scroll-mt-24">
            <MagazineEditor />
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
