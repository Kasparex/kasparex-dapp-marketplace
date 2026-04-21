/**
 * Krex Node operator APIs (wallet-bound nodes, rewards, status).
 */

import { api } from '@/lib/api/client';

export type OperatorNodeRow = {
  node_id: string;
  node_name: string;
  role: string;
  region: string;
  url: string;
  version: string;
  last_ping: number;
  uptime_hours: number;
  status: string;
  requests_served_total: number;
  created_at: number;
  verified_txid?: string | null;
  verified_at?: number | null;
};

export type WalletNodesResponse = {
  ok: boolean;
  address?: string;
  nodes?: OperatorNodeRow[];
  error?: string;
};

export async function fetchWalletNodes(kaspaAddress: string): Promise<WalletNodesResponse> {
  const q = new URLSearchParams({ address: kaspaAddress.trim() });
  return api.get<WalletNodesResponse>(`/kasparex/wallet/nodes?${q.toString()}`);
}

export type NodeRewardEpochResponse = {
  node_id: string;
  epoch_date: string;
  final_grid?: number;
  base_grid?: number;
  error?: string;
};

export async function fetchNodeEpochReward(nodeId: string, epochDate: string): Promise<NodeRewardEpochResponse> {
  return api.get<NodeRewardEpochResponse>(`/kasparex/rewards/${encodeURIComponent(nodeId)}?epoch=${encodeURIComponent(epochDate)}`);
}
