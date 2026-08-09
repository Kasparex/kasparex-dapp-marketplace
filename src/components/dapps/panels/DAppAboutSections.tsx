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

type AboutBlock = {
  key: string;
  kicker: string;
  title: string;
  body: ReactNode;
};

/**
 * How it works tab: same title stack as Migrate (tilt kicker + bold heading + body).
 */
export function DAppAboutSections({ fields }: { fields: DAppAboutFields }) {
  const extras = getHowItWorksExtras(fields.slug);
  const blocks: AboutBlock[] = [];

  if (fields.description) {
    blocks.push({
      key: 'overview',
      kicker: 'Overview',
      title: 'What this is',
      body: <Prose>{fields.description}</Prose>,
    });
  }
  if (fields.utility) {
    blocks.push({
      key: 'utility',
      kicker: 'Utility',
      title: 'What you can do',
      body: <Prose>{fields.utility}</Prose>,
    });
  }
  if (fields.process) {
    blocks.push({
      key: 'process',
      kicker: 'Process',
      title: 'How it works',
      body: <Prose>{fields.process}</Prose>,
    });
  }
  if (fields.benefits) {
    blocks.push({
      key: 'benefits',
      kicker: 'Benefits',
      title: 'Why use it',
      body: <Prose>{fields.benefits}</Prose>,
    });
  }
  if (extras) {
    blocks.push({
      key: 'details',
      kicker: 'Details',
      title: 'Good to know',
      body: <Prose>{extras}</Prose>,
    });
  }
  if (fields.security) {
    blocks.push({
      key: 'security',
      kicker: 'Security',
      title: 'Keep in mind',
      body: <Prose>{fields.security}</Prose>,
    });
  }
  if (fields.roadmap) {
    blocks.push({
      key: 'roadmap',
      kicker: 'Roadmap',
      title: 'What is next',
      body: <Prose>{fields.roadmap}</Prose>,
    });
  }

  if (blocks.length === 0) {
    return (
      <div className={`${KX_FORM_PANEL} space-y-4`}>
        <p className="kx-body py-2">No description available for this dApp.</p>
      </div>
    );
  }

  return (
    <div className={`${KX_FORM_PANEL} space-y-8`}>
      {blocks.map((block, i) => (
        <section key={block.key}>
          <GameOverviewTitleBlock
            as="h3"
            kicker={block.kicker}
            title={block.title}
            compact={i === 0}
          />
          {block.body}
        </section>
      ))}
    </div>
  );
}
