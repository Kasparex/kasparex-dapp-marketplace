/**
 * Data types for Kasparex Nodes dashboard.
 * Designed so the UI can be wired to a real node system later.
 */

export type NodeType = 'light' | 'mirror' | 'super';

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
  /** Uptime in hours (as reported by node registry). */
  uptimeHours: number;
  pinnedCids: number;
  /** Mirror nodes only */
  requestsServed?: number;
  lastPingAt?: string;
}

export interface Incentives {
  /** Wallet-bound server pts (redeem on Rewards catalog). */
  hubPoints: number | null;
  krexTier?: string;
}

export interface TechnicalRequirementItem {
  label: string;
  value: string;
}

export type TechnicalRequirements = TechnicalRequirementItem[];
