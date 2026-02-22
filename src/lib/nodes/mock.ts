/**
 * Mock data for Kasparex Nodes dashboard.
 * Replace with API or context when the real node system is available.
 */

import type {
  NodeInfo,
  NodeMetrics,
  Incentives,
  TechnicalRequirements,
} from './types';

export const mockNodeInfo: NodeInfo = {
  type: 'mirror',
  status: 'connected',
  registeredAt: '2025-01-15',
  nodeId: 'krex-node-xxxx',
};

export const mockNodeMetrics: NodeMetrics = {
  uptimePercent: 99.2,
  pinnedCids: 42,
  requestsServed: 1250,
  lastPingAt: '2025-02-22T12:00:00Z',
};

export const mockIncentives: Incentives = {
  gridEarned: 0,
  xpEarned: 0,
  currentMultiplier: 5,
  feeReductionPercent: 0.2,
  krexTier: '1.0x',
};

export const mockTechnicalRequirements: TechnicalRequirements = [
  { label: 'Node.js', value: 'LTS (18.x or 20.x)' },
  { label: 'RAM', value: '30–60 MB' },
  { label: 'CPU', value: 'Minimal (~0.2%)' },
  { label: 'Disk', value: 'Depends on pinned CIDs' },
  { label: 'Network', value: 'Stable internet' },
];
