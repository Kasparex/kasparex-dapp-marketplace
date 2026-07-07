'use client';

import { DApp } from '@/lib/dapps';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { DAppMetadataTable } from '@/components/dapps/DAppMetadataTable';
import { KX_FORM_PANEL } from '@/lib/hub/shellTokens';
import type { DirectoryListing } from '@/lib/dapps/listingSubmissions';

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

export function DAppDescriptionsPanel({
  dapp,
  contractAddress,
  listing,
}: {
  dapp: DApp;
  contractAddress?: string;
  listing?: DirectoryListing;
}) {
  const hasContent = dapp.description || dapp.utility || dapp.process || dapp.benefits || dapp.security;

  if (!hasContent) {
    return (
      <div className="space-y-6">
        <div className={`${KX_FORM_PANEL} space-y-6`}>
          <p className={`${BODY_CLASS} py-2`}>No description available for this dApp.</p>
        </div>
        <DAppMetadataTable dapp={dapp} contractAddress={contractAddress} listing={listing} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`${KX_FORM_PANEL} space-y-6`}>
        {dapp.description ? (
          <Section title="Description" hint="What this dApp does and who it is for.">
            {dapp.description}
          </Section>
        ) : null}
        {dapp.utility ? (
          <Section title="Utility" hint="Practical value and use cases.">
            {dapp.utility}
          </Section>
        ) : null}
        {dapp.process ? (
          <Section title="How to use" hint="Steps to complete the main action.">
            {dapp.process}
          </Section>
        ) : null}
        {dapp.benefits ? (
          <Section title="Benefits" hint="Rewards, perks, or outcomes for users.">
            {dapp.benefits}
          </Section>
        ) : null}
        {dapp.security ? (
          <Section title="Security" hint="Audits, risks, and trust assumptions.">
            {dapp.security}
          </Section>
        ) : null}
      </div>
      <DAppMetadataTable dapp={dapp} contractAddress={contractAddress} listing={listing} />
    </div>
  );
}
