/**
 * Mock data for Kasparex Nodes dashboard.
 * Values are realistic placeholders for when the node system is wired.
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
  registeredAt: '2025-02-01',
  nodeId: 'krex-mirror-a7f2',
};

export const mockNodeMetrics: NodeMetrics = {
  uptimePercent: 98.5,
  pinnedCids: 128,
  requestsServed: 3420,
  lastPingAt: '2025-02-22T14:30:00Z',
};

export const mockIncentives: Incentives = {
  gridEarned: 0,
  xpEarned: 0,
  currentMultiplier: 5,
  feeReductionPercent: 0.2,
  krexTier: '1.0x',
};

/** Realistic technical requirements for running a KREX node (Light or Mirror). */
export const mockTechnicalRequirements: TechnicalRequirements = [
  { label: 'Node.js', value: '20.x or 22.x LTS' },
  { label: 'RAM', value: '128 MB min; 256 MB recommended' },
  { label: 'CPU', value: 'Low (I/O-bound)' },
  { label: 'Disk', value: '≥ 1 GB; more if pinning many CIDs' },
  { label: 'Network', value: 'Stable outbound; inbound for Mirror' },
  { label: 'OS', value: 'Linux, macOS, Windows, Raspberry Pi' },
];
