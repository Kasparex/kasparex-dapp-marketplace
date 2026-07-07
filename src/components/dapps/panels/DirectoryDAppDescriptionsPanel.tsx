'use client';

import type { DirectoryListing } from '@/lib/dapps/listingSubmissions';
import type { DApp } from '@/lib/dapps';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { DAppMetadataTable } from '@/components/dapps/DAppMetadataTable';
import { KxPanel } from '@/components/kx/KxPanel';

const BODY_CLASS = 'text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 whitespace-pre-line';

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <section>
      <DAppSectionHeader title={title} hint={hint} />
      <p className={BODY_CLASS}>{children}</p>
    </section>
  );
}

type DirectoryDAppDescriptionsPanelProps = {
  dapp: DApp;
  listing: DirectoryListing;
};

export function DirectoryDAppDescriptionsPanel({ dapp, listing }: DirectoryDAppDescriptionsPanelProps) {
  const hasContent =
    listing.fullDescription ||
    listing.shortDescription ||
    listing.utility ||
    listing.process ||
    listing.benefits;

  if (!hasContent) {
    return (
      <div className="space-y-6">
        <KxPanel>
          <p className={`${BODY_CLASS} py-2`}>No description has been provided for this listing yet.</p>
        </KxPanel>
        <DAppMetadataTable dapp={dapp} listing={listing} />
      </div>
    );
  }

  const descriptionText = listing.fullDescription || listing.shortDescription;

  return (
    <div className="space-y-6">
      <KxPanel className="space-y-6">
        {descriptionText ? (
          <Section title="Description" hint="Project overview from the listing submission.">
            {descriptionText}
          </Section>
        ) : null}
        {listing.utility ? (
          <Section title="Utility" hint="Practical value and use cases.">
            {listing.utility}
          </Section>
        ) : null}
        {listing.process ? (
          <Section title="How to use" hint="Steps to complete the main action.">
            {listing.process}
          </Section>
        ) : null}
        {listing.benefits ? (
          <Section title="Benefits" hint="Rewards, perks, or outcomes for users.">
            {listing.benefits}
          </Section>
        ) : null}
      </KxPanel>
      <DAppMetadataTable dapp={dapp} listing={listing} />
    </div>
  );
}
