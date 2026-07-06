import type { AiHubSection } from './types';

export type AiSidebarItem = {
  id: AiHubSection;
  label: string;
  badge?: string;
  externalHref?: string;
};

export type AiSidebarGroup = {
  title: string;
  items: AiSidebarItem[];
};

export const AI_SIDEBAR_GROUPS: AiSidebarGroup[] = [
  {
    title: 'Build',
    items: [
      { id: 'agents', label: 'AI Agents' },
      { id: 'workflow-templates', label: 'Workflow Templates' },
      { id: 'my-templates', label: 'My Templates' },
      { id: 'mpcs', label: 'MPCs' },
    ],
  },
  {
    title: 'Discover',
    items: [
      { id: 'new-trending', label: 'New & Trending', badge: 'New' },
      { id: 'marketplace', label: 'Marketplace' },
      { id: 'integrations', label: 'Integrations' },
    ],
  },
  {
    title: 'Network',
    items: [
      { id: 'community', label: 'Community' },
      { id: 'documentation', label: 'Documentation' },
      { id: 'developer-tools', label: 'Developer Tools' },
      { id: 'announcements', label: 'Announcements' },
    ],
  },
  {
    title: 'Roadmap',
    items: [
      { id: 'agent-sdk', label: 'Agent SDK' },
      { id: 'agent-registry', label: 'On-chain Registry' },
      { id: 'l1-hooks', label: 'L1 Covenant Hooks' },
    ],
  },
];

export const AI_SECTION_PLACEHOLDERS: Record<
  Exclude<AiHubSection, 'agents' | 'marketplace' | 'documentation'>,
  { title: string; description: string }
> = {
  'workflow-templates': {
    title: 'Workflow Templates',
    description:
      'Pre-built agent workflows for Kaspa L1. Compose multi-step automations with KAS and KREX settlement hooks. Templates will ship with the agent SDK.',
  },
  'my-templates': {
    title: 'My Templates',
    description: 'Save and reuse your custom agent workflows. Connect your Kasware wallet to publish templates to the network.',
  },
  mpcs: {
    title: 'MPCs',
    description:
      'Multi-party computation tools for secure agent coordination. Layout prepared for future Kaspa-native MPC integrations.',
  },
  'new-trending': {
    title: 'New & Trending',
    description: 'Fresh agents and rising workflows across the Kasparex AI hub. Rankings will reflect on-chain usage once wired.',
  },
  integrations: {
    title: 'Integrations',
    description:
      'Connect agents to Kasparex modules, indexers, MCP tools, and external APIs. Inspired by OpenServ MCP patterns, adapted for Kaspa L1.',
  },
  community: {
    title: 'Community',
    description: 'Builder discussions, agent showcases, and ecosystem updates for autonomous AI on Kaspa BlockDAG.',
  },
  'developer-tools': {
    title: 'Developer Tools',
    description:
      'Agent SDK, starter templates, and testnet tooling for building non-deterministic agents on Kaspa L1.',
  },
  announcements: {
    title: 'Announcements',
    description: 'Release notes, governance updates, and token utility changes for KAS, KREX, and future ARIA.',
  },
  'agent-sdk': {
    title: 'Agent SDK and wallet deployment',
    description:
      'Connect Kasware, pick a starter template, configure tools and token pricing, then publish an agent to the Kasparex AI catalog. SDK layout mirrors OpenServ agent-starter patterns, adapted for Kaspa L1.',
  },
  'agent-registry': {
    title: 'On-chain agent registry',
    description:
      'Browse and register agents with wallet-signed metadata, usage counters, and KAS / KREX payment rails. Registry entries will anchor to Kaspa indexers and Rewards ledger hooks where applicable.',
  },
  'l1-hooks': {
    title: 'L1 covenant and script hooks',
    description:
      'Reserve covenant and Silverscript binding points for agent settlement, escrow, and governance once native L1 programmability is live. Integrates with Kasparex Protocols and Lockbox covenant simulators.',
  },
};
