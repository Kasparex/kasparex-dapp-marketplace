'use client';

import type { DirectoryListing } from '@/lib/dapps/listingSubmissions';

type DirectoryDAppDescriptionsPanelProps = {
  listing: DirectoryListing;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <div>
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">{title}</h3>
      <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">{children}</p>
    </div>
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
