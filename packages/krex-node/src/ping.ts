import type { KrexNodeConfig } from './config.js';
import { getRequestsServedTotal } from './metrics.js';
import { nodeRequestSignHeaders } from './signing.js';
import { nextSeq } from './seq.js';

export async function sendPing(cfg: KrexNodeConfig): Promise<unknown> {
  const base = cfg.apiBaseUrl.replace(/\/+$/, '');
  const bodyObj: Record<string, unknown> = {
    node_id: cfg.nodeId,
    status: 'online',
    seq: nextSeq(cfg.nodeId),
    nonce: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  };
  if (cfg.nodeName) bodyObj.node_name = cfg.nodeName;
  if (cfg.role) bodyObj.role = cfg.role;
  if (cfg.region) bodyObj.region = cfg.region;
  if (cfg.url) bodyObj.url = cfg.url;
  if (cfg.version) bodyObj.version = cfg.version;
  if (cfg.pinnedCids?.length) bodyObj.pinned_cids = cfg.pinnedCids;
  const dynamic = getRequestsServedTotal();
  const fallback = Math.max(0, Math.floor(Number(cfg.requestsServedTotal) || 0));
  const served = Math.max(dynamic, fallback);
  if (served > 0) {
    bodyObj.requests_served_total = served;
  }
  const body = JSON.stringify(bodyObj);
  const headers = nodeRequestSignHeaders(cfg.hmacSecret, body);
  const res = await fetch(`${base}/kasparex/node/ping`, { method: 'POST', headers, body });
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text) as unknown;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`ping failed ${res.status}: ${text}`);
  }
  return json;
}

export async function fetchRuntimeConfig(cfg: KrexNodeConfig): Promise<unknown> {
  const base = cfg.apiBaseUrl.replace(/\/+$/, '');
  const res = await fetch(`${base}/kasparex/node/runtime-config`);
  return res.json() as Promise<unknown>;
}

export async function fetchNodeStatus(cfg: KrexNodeConfig): Promise<unknown> {
  const base = cfg.apiBaseUrl.replace(/\/+$/, '');
  const res = await fetch(`${base}/kasparex/node/${encodeURIComponent(cfg.nodeId)}/status`);
  return res.json() as Promise<unknown>;
}
