import { resolve } from 'node:path';
import type { KrexNodeConfig } from './config.js';
import { fetchRuntimeConfig } from './ping.js';
import { getPinStore, normalizeCid, type PinStore } from './ipfs-pin.js';

const DEFAULT_GATEWAYS = [
  'https://storacha.network/ipfs/{cid}',
  'https://ipfs.io/ipfs/{cid}',
  'https://{cid}.ipfs.dweb.link',
];

let activePinnedCids: string[] = [];
let syncRunning = false;
let syncTimer: ReturnType<typeof setInterval> | null = null;

export function pinCacheDir(cfg: KrexNodeConfig): string {
  return resolve(process.cwd(), cfg.pinCacheDir?.trim() || '.krex-pin-cache');
}

export async function getActivePinnedCids(cfg: KrexNodeConfig): Promise<string[]> {
  const manual = (cfg.pinnedCids ?? []).map(normalizeCid).filter(Boolean) as string[];
  const merged = new Set<string>([...manual, ...activePinnedCids]);
  try {
    const store = getPinStore(pinCacheDir(cfg));
    await store.init();
    for (const cid of store.listCids()) merged.add(cid);
  } catch {
    // ignore
  }
  return Array.from(merged);
}

type RuntimePinCatalog = {
  gateways?: string[];
  recommendedCids?: string[];
};

async function fetchCatalogFromRuntime(cfg: KrexNodeConfig): Promise<{ gateways: string[]; cids: string[] }> {
  if (cfg.autoPinFromRuntime === false) {
    return { gateways: DEFAULT_GATEWAYS, cids: [] };
  }
  try {
    const rt = (await fetchRuntimeConfig(cfg)) as { pinCatalog?: RuntimePinCatalog };
    const catalog = rt?.pinCatalog;
    const gateways =
      Array.isArray(catalog?.gateways) && catalog!.gateways!.length
        ? catalog!.gateways!
        : DEFAULT_GATEWAYS;
    const cids = (catalog?.recommendedCids ?? []).map(normalizeCid).filter(Boolean) as string[];
    return { gateways, cids };
  } catch {
    return { gateways: DEFAULT_GATEWAYS, cids: [] };
  }
}

export async function syncPinCatalog(cfg: KrexNodeConfig): Promise<{ warmed: number; total: number }> {
  if (syncRunning) return { warmed: 0, total: activePinnedCids.length };
  syncRunning = true;
  try {
    const store = getPinStore(pinCacheDir(cfg));
    await store.init();
    const { gateways, cids: runtimeCids } = await fetchCatalogFromRuntime(cfg);
    const manual = (cfg.pinnedCids ?? []).map(normalizeCid).filter(Boolean) as string[];
    const maxPins = Math.max(1, Math.min(128, Number(cfg.maxPins) || 32));

    const target = Array.from(new Set([...manual, ...runtimeCids])).slice(0, maxPins);
    let warmed = 0;
    for (const cid of target) {
      const ok = await store.warm(cid, gateways);
      if (ok) warmed += 1;
    }
    activePinnedCids = store.listCids();
    console.log(
      `[krex-node] pin sync: warmed ${warmed}/${target.length}, local pins=${activePinnedCids.length}`,
    );
    return { warmed, total: activePinnedCids.length };
  } finally {
    syncRunning = false;
  }
}

export function startPinSyncLoop(cfg: KrexNodeConfig): void {
  const intervalSec = Math.max(300, Math.min(86_400, Number(cfg.pinSyncIntervalSec) || 21_600));
  if (syncTimer) return;
  void syncPinCatalog(cfg);
  syncTimer = setInterval(() => {
    void syncPinCatalog(cfg);
  }, intervalSec * 1000);
  console.log(`[krex-node] pin sync loop every ${intervalSec}s`);
}

export function getPinStoreForConfig(cfg: KrexNodeConfig): PinStore {
  return getPinStore(pinCacheDir(cfg));
}
