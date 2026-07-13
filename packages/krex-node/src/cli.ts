#!/usr/bin/env node
import { loadConfig } from './config.js';
import { fetchNodeStatus, fetchRuntimeConfig, sendPing } from './ping.js';
import { startEdgeServer } from './serve.js';
import { getActivePinnedCids, pinCacheDir, startPinSyncLoop, syncPinCatalog } from './pin-sync.js';
import { getPinStore } from './ipfs-pin.js';

const cmd = process.argv[2] || 'help';
const configPath = process.env.KREX_NODE_CONFIG || 'config.json';

async function runHeartbeatLoop(cfg: ReturnType<typeof loadConfig>, withPinSync = true): Promise<void> {
  if (withPinSync) startPinSyncLoop(cfg);
  const tick = async () => {
    try {
      const out = await sendPing(cfg);
      console.log(new Date().toISOString(), 'ping ok', JSON.stringify(out));
    } catch (e) {
      console.error(new Date().toISOString(), 'ping error', e);
    }
  };
  await tick();
  setInterval(tick, cfg.heartbeatIntervalSec * 1000);
}

async function main() {
  if (cmd === 'help' || cmd === '-h') {
    console.log(`Usage: krex-node <command>

Commands:
  once        Send a single signed ping
  heartbeat   Loop: ping every heartbeatIntervalSec (from config)
  light       Heartbeat + IPFS pin sync (no edge HTTP)
  pin-sync    One-shot warm of pin catalog to local cache
  pin-status  List locally warmed CIDs
  status      GET runtime-config + node status JSON
  serve       Read-only edge HTTP only (no heartbeat)
  edge        Edge HTTP + heartbeat + pin sync (recommended for edge role)
`);
    process.exit(0);
  }

  const cfg = loadConfig(configPath);

  if (cmd === 'status') {
    const rt = await fetchRuntimeConfig(cfg);
    const st = await fetchNodeStatus(cfg);
    console.log(JSON.stringify({ runtimeConfig: rt, status: st }, null, 2));
    return;
  }

  if (cmd === 'once') {
    const out = await sendPing(cfg);
    console.log(JSON.stringify(out, null, 2));
    return;
  }

  if (cmd === 'heartbeat') {
    await runHeartbeatLoop(cfg);
    return;
  }

  if (cmd === 'light') {
    await runHeartbeatLoop(cfg);
    return;
  }

  if (cmd === 'pin-sync') {
    const out = await syncPinCatalog(cfg);
    console.log(JSON.stringify({ ...out, pinnedCids: await getActivePinnedCids(cfg) }, null, 2));
    return;
  }

  if (cmd === 'pin-status') {
    const store = getPinStore(pinCacheDir(cfg));
    await store.init();
    console.log(
      JSON.stringify(
        { stats: store.stats(), pinnedCids: store.listCids(), activeForPing: await getActivePinnedCids(cfg) },
        null,
        2,
      ),
    );
    return;
  }

  if (cmd === 'serve') {
    await startEdgeServer(cfg);
    return;
  }

  if (cmd === 'edge' || cmd === 'mirror') {
    if (cmd === 'mirror') {
      console.warn('[krex-node] command "mirror" is deprecated; use "edge"');
    }
    await startEdgeServer(cfg);
    await runHeartbeatLoop(cfg);
    return;
  }

  console.error('Unknown command:', cmd);
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
