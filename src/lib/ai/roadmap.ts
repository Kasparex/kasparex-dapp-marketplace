import type { AiHubSection } from './types';

export type AiRoadmapStep = {
  id: Extract<AiHubSection, 'agent-sdk' | 'agent-registry' | 'l1-hooks'>;
  phase: string;
  title: string;
  description: string;
  status: 'layout' | 'planned';
  statusLabel: string;
};

export const AI_ROADMAP_STEPS: AiRoadmapStep[] = [
  {
    id: 'agent-sdk',
    phase: '01',
    title: 'Agent SDK and wallet deployment',
    description:
      'Starter templates, Kasware connect flows, and deploy-to-catalog actions for autonomous agents on Kaspa L1.',
    status: 'layout',
    statusLabel: 'Layout preview',
  },
  {
    id: 'agent-registry',
    phase: '02',
    title: 'On-chain agent registry',
    description:
      'Register agent metadata, pricing in KAS or KREX, and ownership proofs tied to Kaspa wallet addresses.',
    status: 'layout',
    statusLabel: 'Layout preview',
  },
  {
    id: 'l1-hooks',
    phase: '03',
    title: 'L1 covenant and script hooks',
    description:
      'Settlement, escrow, and governance bindings via src/lib/programmability and covenant runtimes (Toccata live on mainnet).',
    status: 'layout',
    statusLabel: 'In progress',
  },
];
