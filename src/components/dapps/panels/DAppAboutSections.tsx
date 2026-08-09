'use client';

import type { ReactNode } from 'react';
import { KX_FORM_PANEL } from '@/lib/hub/shellTokens';
import { getHowItWorksExtras } from '@/lib/dapps/howItWorksExtras';
import { GameOverviewTitleBlock } from '@/components/games/panels/GameOverviewSections';
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
 * How it works: one Overview title (Migrate-style), then body sections without
 * extra tilt headers unless Security / Roadmap need a separate block.
 */
export function DAppAboutSections({ fields }: { fields: DAppAboutFields }) {
  const extras = getHowItWorksExtras(fields.slug);
  const overviewParts: ReactNode[] = [];

  if (fields.description) overviewParts.push(<Prose key="description">{fields.description}</Prose>);
  if (fields.utility) overviewParts.push(<Prose key="utility">{fields.utility}</Prose>);
  if (fields.process) overviewParts.push(<Prose key="process">{fields.process}</Prose>);
  if (fields.benefits) overviewParts.push(<Prose key="benefits">{fields.benefits}</Prose>);
  if (extras) overviewParts.push(<Prose key="extras">{extras}</Prose>);

  const hasOverview = overviewParts.length > 0;
  const hasSecurity = Boolean(fields.security);
  const hasRoadmap = Boolean(fields.roadmap);

  if (!hasOverview && !hasSecurity && !hasRoadmap) {
    return (
      <div className={`${KX_FORM_PANEL} space-y-4`}>
        <p className="kx-body py-2">No description available for this dApp.</p>
      </div>
    );
  }

  return (
    <div className={`${KX_FORM_PANEL} space-y-8`}>
      {hasOverview ? (
        <section>
          <GameOverviewTitleBlock as="h3" kicker="Overview" title="How it works" compact />
          <div className="space-y-4">{overviewParts}</div>
        </section>
      ) : null}
      {hasSecurity ? (
        <section>
          <GameOverviewTitleBlock as="h3" kicker="Security" title="Keep in mind" compact={!hasOverview} />
          <Prose>{fields.security}</Prose>
        </section>
      ) : null}
      {hasRoadmap ? (
        <section>
          <GameOverviewTitleBlock
            as="h3"
            kicker="Roadmap"
            title="What is next"
            compact={!hasOverview && !hasSecurity}
          />
          <Prose>{fields.roadmap}</Prose>
        </section>
      ) : null}
    </div>
  );
}
