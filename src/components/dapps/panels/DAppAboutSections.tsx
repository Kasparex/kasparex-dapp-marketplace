'use client';

import type { ReactNode } from 'react';
import { KX_FORM_PANEL } from '@/lib/hub/shellTokens';
import { getHowItWorksExtras } from '@/lib/dapps/howItWorksExtras';
import { DAPP_ABOUT_BODY_CLASS, DAPP_ABOUT_PROSE_CLASS } from './dappAboutStyles';

export type DAppAboutFields = {
  slug?: string;
  description?: string;
  utility?: string;
  process?: string;
  benefits?: string;
  security?: string;
  roadmap?: string;
};

function Prose({ children }: { children: ReactNode }) {
  if (!children) return null;
  if (typeof children === 'string') {
    return <p className={DAPP_ABOUT_BODY_CLASS}>{children}</p>;
  }
  return <div className={DAPP_ABOUT_PROSE_CLASS}>{children}</div>;
}

/**
 * How it works tab: plain Migrate-style body text.
 * No tilt bars / section titles; stacked paragraphs only.
 */
export function DAppAboutSections({ fields }: { fields: DAppAboutFields }) {
  const extras = getHowItWorksExtras(fields.slug);
  const blocks: ReactNode[] = [];

  if (fields.description) blocks.push(<Prose key="description">{fields.description}</Prose>);
  if (fields.utility) blocks.push(<Prose key="utility">{fields.utility}</Prose>);
  if (fields.process) blocks.push(<Prose key="process">{fields.process}</Prose>);
  if (fields.benefits) blocks.push(<Prose key="benefits">{fields.benefits}</Prose>);
  if (extras) blocks.push(<Prose key="extras">{extras}</Prose>);
  if (fields.security) blocks.push(<Prose key="security">{fields.security}</Prose>);
  if (fields.roadmap) blocks.push(<Prose key="roadmap">{fields.roadmap}</Prose>);

  if (blocks.length === 0) {
    return (
      <div className={`${KX_FORM_PANEL} space-y-4`}>
        <p className="kx-body py-2">No description available for this dApp.</p>
      </div>
    );
  }

  return <div className={`${KX_FORM_PANEL} space-y-4`}>{blocks}</div>;
}
