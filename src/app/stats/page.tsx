import { Metadata } from 'next';
import { StatsPageShell } from '@/components/stats/StatsPageShell';
import { StatsHeader } from '@/components/stats/StatsHeader';
import { statsHeadlineAccent } from '@/lib/stats/statsUi';
import { StatsPageContent } from '@/components/stats/StatsPageContent';

export const metadata: Metadata = {
  title: 'Stats',
  description:
    'Kasparex Treasury, Total Value Locked (TVL), and ecosystem statistics. Real data will replace placeholders in a future update.',
};

export default function StatsPage() {
  return (
    <StatsPageShell>
      <StatsHeader
        headline={<>Kasparex {statsHeadlineAccent('Stats')}</>}
        description="Treasury, TVL, and ecosystem metrics for the Kasparex platform on Kaspa L1 and supported L2 networks."
      />
      <StatsPageContent />
    </StatsPageShell>
  );
}
