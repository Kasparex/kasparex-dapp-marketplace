'use client';

import type { ReactNode } from 'react';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { KX_FORM_PANEL } from '@/lib/hub/shellTokens';
import { getHowItWorksExtras } from '@/lib/dapps/howItWorksExtras';
import { DAPP_ABOUT_BODY_CLASS } from './dappAboutStyles';

export type DAppAboutFields = {
  slug?: string;
  description?: string;
  utility?: string;
  process?: string;
  benefits?: string;
  security?: string;
  roadmap?: string;
};

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  if (!children) return null;
  return (
    <section>
      <DAppSectionHeader title={title} hint={hint} />
      {typeof children === 'string' ? <p className={DAPP_ABOUT_BODY_CLASS}>{children}</p> : children}
    </section>
  );
}

export function DAppAboutSections({ fields }: { fields: DAppAboutFields }) {
  const extras = getHowItWorksExtras(fields.slug);
  const hasContent =
    fields.description ||
    fields.utility ||
    fields.process ||
    fields.benefits ||
    fields.security ||
    fields.roadmap ||
    extras;

  if (!hasContent) {
    return (
      <div className={`${KX_FORM_PANEL} space-y-6`}>
        <p className="kx-body py-2">No description available for this dApp.</p>
      </div>
    );
  }

  return (
    <div className={`${KX_FORM_PANEL} space-y-6`}>
      {fields.description ? (
        <Section title="Description" hint="What this dApp does and who it is for.">
          {fields.description}
        </Section>
      ) : null}
      {fields.utility ? (
        <Section title="Utility" hint="Practical value and use cases.">
          {fields.utility}
        </Section>
      ) : null}
      {fields.process ? (
        <Section title="How to use" hint="Steps to complete the main action.">
          {fields.process}
        </Section>
      ) : null}
      {fields.benefits ? (
        <Section title="Benefits" hint="Rewards, perks, or outcomes for users.">
          {fields.benefits}
        </Section>
      ) : null}
      {extras ? (
        <Section title="How it works" hint="Rules, flow, and what to expect when using this dApp.">
          {extras}
        </Section>
      ) : null}
      {fields.security ? (
        <Section title="Security" hint="Audits, risks, and trust assumptions.">
          {fields.security}
        </Section>
      ) : null}
      {fields.roadmap ? (
        <Section title="Roadmap" hint="Planned and completed milestones.">
          {fields.roadmap}
        </Section>
      ) : null}
    </div>
  );
}
