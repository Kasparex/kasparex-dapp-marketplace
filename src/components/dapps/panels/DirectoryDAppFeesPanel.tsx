'use client';

import type { DirectoryListing } from '@/lib/dapps/listingSubmissions';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';

type DirectoryDAppFeesPanelProps = {
  listing: DirectoryListing;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <section>
      <DAppSectionHeader title={title} />
      <p className="kx-body whitespace-pre-line">{children}</p>
    </section>
  );
}

export function DirectoryDAppFeesPanel({ listing }: DirectoryDAppFeesPanelProps) {
  const hasContent = listing.feesOverview || listing.feesPricing || listing.feesCosts;

  if (!hasContent) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400 py-4">
        The project owner has not published fee or pricing details yet.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <Section title="Fees overview">{listing.feesOverview}</Section>
      <Section title="Pricing">{listing.feesPricing}</Section>
      <Section title="Costs">{listing.feesCosts}</Section>
    </div>
  );
}
