'use client';

import type { DirectoryListing } from '@/lib/dapps/listingSubmissions';

type DirectoryDAppFeesPanelProps = {
  listing: DirectoryListing;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 sm:p-8">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">{title}</h3>
      <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">{children}</p>
    </div>
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
    <div className="space-y-6">
      <Section title="Fees overview">{listing.feesOverview}</Section>
      <Section title="Pricing">{listing.feesPricing}</Section>
      <Section title="Costs">{listing.feesCosts}</Section>
    </div>
  );
}
