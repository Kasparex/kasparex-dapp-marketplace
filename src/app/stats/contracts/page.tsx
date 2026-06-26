import { Metadata } from 'next';
import Link from 'next/link';
import { StatsPageShell } from '@/components/stats/StatsPageShell';
import { StatsHeader, statsHeadlineAccent } from '@/components/stats/StatsHeader';
import { SmartContractsPage } from '@/components/stats/SmartContractsPage';

export const metadata: Metadata = {
  title: 'Smart Contracts · Kasparex Stats',
  description: 'Tree, table, and flow view of Kasparex smart contracts: addresses, descriptions, and relationships.',
};

export default function StatsContractsPage() {
  return (
    <StatsPageShell>
      <StatsHeader
        badge="On-chain Registry"
        headline={
          <>
            Smart {statsHeadlineAccent('Contracts')}
          </>
        }
        description="Explore contracts by flow, tree, or table. Addresses link to the block explorer for the connected network."
        actions={
          <Link href="/stats" className="k-control-btn">
            Back to Stats overview
          </Link>
        }
      />
      <SmartContractsPage />
    </StatsPageShell>
  );
}
