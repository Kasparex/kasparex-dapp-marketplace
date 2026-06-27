import { Metadata } from 'next';
import Link from 'next/link';
import { StatsPageShell } from '@/components/stats/StatsPageShell';
import { StatsHeader } from '@/components/stats/StatsHeader';
import { statsHeadlineAccent } from '@/lib/stats/statsUi';
import { StatsPageContent } from '@/components/stats/StatsPageContent';

export const metadata: Metadata = {
  title: 'Kasparex Stats · Treasury & Ecosystem',
  description: 'Kasparex Treasury, Total Value Locked (TVL), and ecosystem statistics. Real data will replace placeholders in a future update.',
};

export default function StatsPage() {
  return (
    <StatsPageShell>
      <StatsHeader
        headline={
          <>
            Kasparex {statsHeadlineAccent('Stats')}
          </>
        }
        description="Treasury, TVL, and ecosystem metrics for the Kasparex platform on Kaspa L1 and supported L2 networks."
        actions={
          <>
            <Link href="/stats/contracts" className="k-cta-primary text-xs py-2.5 px-5">
              Smart Contracts
            </Link>
            <Link href="/nodes" className="k-control-btn !border-cyan-500/30 !bg-cyan-500/10 !text-cyan-800 dark:!text-cyan-300">
              KREX Nodes
            </Link>
          </>
        }
      />
      <StatsPageContent />
    </StatsPageShell>
  );
}
