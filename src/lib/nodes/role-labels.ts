import type { NodeType } from '@/lib/nodes/types';

export const KREX_NODE_ROLE_UI: Record<
  NodeType,
  { title: string; short: string; tagline: string }
> = {
  light: {
    title: 'Light node',
    short: 'Light',
    tagline: 'Heartbeats and local pin cache only. No public HTTP endpoint.',
  },
  edge: {
    title: 'Edge node',
    short: 'Edge',
    tagline: 'Light + a public HTTPS read API that helps other Hub users.',
  },
  super: {
    title: 'Super node',
    short: 'Super',
    tagline: 'Higher capacity edge node when enabled for your operator account.',
  },
};
