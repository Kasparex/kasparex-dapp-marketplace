'use client';

import type { DirectoryListing } from '@/lib/dapps/listingSubmissions';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';

type DirectoryDAppDescriptionsPanelProps = {
  listing: DirectoryListing;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <section>
      <DAppSectionHeader title={title} />
      <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">{children}</p>
    </section>
  );
}

export function DirectoryDAppDescriptionsPanel({ listing }: DirectoryDAppDescriptionsPanelProps) {
  const hasContent =
    listing.fullDescription ||
    listing.utility ||
    listing.process ||
    listing.benefits;

  if (!hasContent) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400 py-4">
        No description has been provided for this listing yet.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <Section title="Description">{listing.fullDescription || listing.shortDescription}</Section>
      <Section title="Utility">{listing.utility}</Section>
      <Section title="How to use">{listing.process}</Section>
      <Section title="Benefits">{listing.benefits}</Section>
    </div>
  );
}
