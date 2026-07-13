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
  type: 'edge',
  status: 'connected',
  registeredAt: '2025-02-01',
  nodeId: 'krex-edge-a7f2',
};

export const mockNodeMetrics: NodeMetrics = {
  uptimeHours: 98.5,
  pinnedCids: 128,
  requestsServed: 3420,
  lastPingAt: '2025-02-22T14:30:00Z',
};

export const mockIncentives: Incentives = {
  hubPoints: 0,
  krexTier: 'Tier 1',
};

/** Realistic technical requirements for running a KREX node (Light or Edge). */
export const mockTechnicalRequirements: TechnicalRequirements = [
  { label: 'Node.js', value: '20.x or 22.x LTS' },
  { label: 'RAM', value: '128 MB min; 256 MB recommended' },
  { label: 'CPU', value: 'Low (I/O-bound)' },
  { label: 'Disk', value: '≥ 1 GB; more if pinning many CIDs' },
  { label: 'Network', value: 'Stable outbound; public HTTPS for Edge' },
  { label: 'OS', value: 'Linux, macOS, Windows, Raspberry Pi' },
];
