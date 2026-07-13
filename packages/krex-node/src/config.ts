import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export type KrexNodeConfig = {
  apiBaseUrl: string;
  nodeId: string;
  hmacSecret: string;
  heartbeatIntervalSec: number;
  nodeName?: string;
  role?: 'light' | 'mirror' | 'super';
  region?: string;
  url?: string;
  version: string;
  requestsServedTotal?: number;
  pinnedCids?: string[];
  /** Local directory for warmed IPFS objects (default .krex-pin-cache). */
  pinCacheDir?: string;
  /** Seconds between automatic pin catalog syncs (default 21600 = 6h). */
  pinSyncIntervalSec?: number;
  /** Pull recommended CIDs from Worker runtime-config (default true). */
  autoPinFromRuntime?: boolean;
  /** Max CIDs to keep warmed locally (default 32). */
  maxPins?: number;
  /** Mirror HTTP listen host (default 0.0.0.0). */
  serveHost?: string;
  /** Mirror HTTP listen port (default 8788). */
  servePort?: number;
};

export function loadConfig(path = 'config.json'): KrexNodeConfig {
  const full = resolve(process.cwd(), path);
  const raw = readFileSync(full, 'utf8');
  const c = JSON.parse(raw) as KrexNodeConfig;
  if (!c.apiBaseUrl?.trim()) throw new Error('apiBaseUrl required');
  if (!c.nodeId?.trim()) throw new Error('nodeId required');
  if (!c.hmacSecret?.trim()) throw new Error('hmacSecret required');
  c.heartbeatIntervalSec = Math.max(45, Math.min(180, Number(c.heartbeatIntervalSec) || 60));
  if (c.role && !['light', 'mirror', 'super'].includes(c.role)) throw new Error('role must be light|mirror|super');
  c.version = c.version || '1.0.0';
  return c;
}
