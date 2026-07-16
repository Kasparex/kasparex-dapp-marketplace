/**
 * Ensure rusty-kaspa web WASM (kaspa-core) is present under public/kaspa-sdk.
 * Used by Hub covenant unsigned-tx builder (signPskt path).
 *
 * Source: https://github.com/kaspanet/rusty-kaspa/releases (kaspa-wasm32-sdk)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { execFileSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const version = process.env.KASPA_WASM_SDK_VERSION || 'v2.0.1';
const destDir = path.join(root, 'public', 'kaspa-sdk');
const marker = path.join(destDir, 'kaspa_bg.wasm');
const zipUrl = `https://github.com/kaspanet/rusty-kaspa/releases/download/${version}/kaspa-wasm32-sdk-${version}.zip`;
const toolsDir = path.join(root, '.tools');
const zipPath = path.join(toolsDir, `kaspa-wasm32-sdk-${version}.zip`);
const extractDir = path.join(toolsDir, `kaspa-wasm32-sdk-${version}-extract`);

const REQUIRED = ['kaspa.js', 'kaspa_bg.wasm', 'kaspa.d.ts', 'package.json'];

function hasSdk() {
  return REQUIRED.every((f) => fs.existsSync(path.join(destDir, f)));
}

async function download(url, outFile) {
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`);
  }
  await pipeline(Readable.fromWeb(res.body), createWriteStream(outFile));
}

function copyCoreFromExtract() {
  const candidates = [
    path.join(extractDir, 'kaspa-wasm32-sdk', 'web', 'kaspa-core'),
    path.join(extractDir, 'web', 'kaspa-core'),
  ];
  const src = candidates.find((p) => fs.existsSync(path.join(p, 'kaspa_bg.wasm')));
  if (!src) {
    throw new Error('kaspa-core not found inside WASM SDK zip');
  }
  fs.mkdirSync(destDir, { recursive: true });
  for (const f of REQUIRED) {
    fs.copyFileSync(path.join(src, f), path.join(destDir, f));
  }
  for (const optional of ['kaspa_bg.wasm.d.ts', 'LICENSE', 'README.md']) {
    const p = path.join(src, optional);
    if (fs.existsSync(p)) fs.copyFileSync(p, path.join(destDir, optional));
  }
  fs.writeFileSync(
    path.join(destDir, 'VERSION.txt'),
    `${version} (web/kaspa-core)\n`,
    'utf8',
  );
}

async function main() {
  if (hasSdk() && !process.argv.includes('--force')) {
    console.log(`[kaspa-wasm] OK ${marker}`);
    return;
  }

  console.log(`[kaspa-wasm] Ensuring ${version} → public/kaspa-sdk`);
  if (!fs.existsSync(zipPath) || process.argv.includes('--force')) {
    console.log(`[kaspa-wasm] Downloading ${zipUrl}`);
    await download(zipUrl, zipPath);
  }

  fs.rmSync(extractDir, { recursive: true, force: true });
  fs.mkdirSync(extractDir, { recursive: true });
  execFileSync('tar', ['-xf', zipPath, '-C', extractDir], { stdio: 'inherit' });
  copyCoreFromExtract();
  console.log(`[kaspa-wasm] Installed to ${destDir}`);
}

main().catch((err) => {
  console.error('[kaspa-wasm]', err);
  process.exit(1);
});
