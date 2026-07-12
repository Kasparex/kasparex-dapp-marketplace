#!/usr/bin/env node
import { loadConfig } from './config.js';
import { fetchNodeStatus, fetchRuntimeConfig, sendPing } from './ping.js';
import { startMirrorServer } from './serve.js';

const cmd = process.argv[2] || 'help';
const configPath = process.env.KREX_NODE_CONFIG || 'config.json';

async function runHeartbeatLoop(cfg: ReturnType<typeof loadConfig>): Promise<void> {
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
  status      GET runtime-config + node status JSON
  serve       Read-only mirror HTTP (no heartbeat)
  mirror      Mirror HTTP + heartbeat loop (recommended for mirror role)
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

  if (cmd === 'serve') {
    await startMirrorServer(cfg);
    return;
  }

  if (cmd === 'mirror') {
    await startMirrorServer(cfg);
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
