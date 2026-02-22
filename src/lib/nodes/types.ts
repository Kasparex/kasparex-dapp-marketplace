/**
 * Data types for Kasparex Nodes dashboard.
 * Designed so the UI can be wired to a real node system later.
 */

export type NodeType = 'light' | 'mirror';

export type NodeStatus =
  | 'connected'
  | 'disconnected'
  | 'syncing'
  | 'not_registered';

export interface NodeInfo {
  type: NodeType;
  status: NodeStatus;
  registeredAt?: string;
  nodeId?: string;
}

export interface NodeMetrics {
  uptimePercent: number;
  pinnedCids: number;
  /** Mirror nodes only */
  requestsServed?: number;
  lastPingAt?: string;
}

export interface Incentives {
  gridEarned: number;
  xpEarned: number;
  currentMultiplier: number;
  feeReductionPercent: number;
  krexTier?: string;
}

export interface TechnicalRequirementItem {
  label: string;
  value: string;
}

export type TechnicalRequirements = TechnicalRequirementItem[];
