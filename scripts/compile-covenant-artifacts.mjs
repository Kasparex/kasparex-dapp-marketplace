#!/usr/bin/env node
/**
 * Build covenant artifact metadata for Hub static assets.
 * Uses silverc from PATH, SILVERC_PATH, or .tools/silverscript/target/release/silverc(.exe).
 */
import { execFileSync, execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const silDir = path.join(root, 'covenant-lockbox');
const outDir = path.join(root, 'public', 'covenant');

const TEMPLATES = [
  { template: 'lockbox', sourceFile: 'lockbox.sil', contract: 'KasparexLockbox' },
  { template: 'split', sourceFile: 'split-payment.sil', contract: 'KasparexSplitPayment' },
  { template: 'milestone', sourceFile: 'milestone.sil', contract: 'KasparexMilestone' },
  { template: 'crowdfund', sourceFile: 'crowdfund.sil', contract: 'KasparexCrowdfund' },
  { template: 'voucher', sourceFile: 'voucher.sil', contract: 'KasparexVoucher' },
];

function resolveSilvercPath() {
  if (process.env.SILVERC_PATH && fs.existsSync(process.env.SILVERC_PATH)) {
    return process.env.SILVERC_PATH;
  }
  const local = path.join(
    root,
    '.tools',
    'silverscript',
    'target',
    'release',
    process.platform === 'win32' ? 'silverc.exe' : 'silverc'
  );
  if (fs.existsSync(local)) return local;
  try {
    execSync(process.platform === 'win32' ? 'where silverc' : 'which silverc', {
      stdio: 'ignore',
      timeout: 3000,
    });
    return 'silverc';
  } catch {
    return null;
  }
}

function bytesToHex(script) {
  if (typeof script === 'string') return script.replace(/^0x/i, '');
  if (Array.isArray(script)) {
    return script.map((b) => Number(b).toString(16).padStart(2, '0')).join('');
  }
  return null;
}

function compileSil(silvercPath, sourcePath) {
  const tmpOut = path.join(os.tmpdir(), `kpx-silverc-${path.basename(sourcePath, '.sil')}-${Date.now()}.json`);
  try {
    execFileSync(
      silvercPath,
      [sourcePath, '-o', tmpOut],
      { stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000, windowsHide: true }
    );
    const raw = fs.readFileSync(tmpOut, 'utf8');
    const compiled = JSON.parse(raw);
    const scriptHex = bytesToHex(compiled.script);
    return {
      scriptHex,
      contractName: compiled.contract_name ?? compiled.contractName ?? null,
      compilerVersion: compiled.compiler_version ?? compiled.compilerVersion ?? null,
      abi: compiled.abi ?? null,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const stderr = e && typeof e === 'object' && 'stderr' in e ? String(e.stderr ?? '') : '';
    console.warn(`silverc failed for ${sourcePath}:`, stderr || msg);
    return null;
  } finally {
    try {
      fs.unlinkSync(tmpOut);
    } catch {
      // ignore
    }
  }
}

fs.mkdirSync(outDir, { recursive: true });
const silvercPath = resolveSilvercPath();
console.log(`silverc: ${silvercPath ?? 'not found'}`);

for (const t of TEMPLATES) {
  const sourcePath = path.join(silDir, t.sourceFile);
  let scriptHex = null;
  let contractName = t.contract;
  let compilerVersion = null;
  let abi = null;
  let compileNote = 'Metadata stub. Build silverc and run npm run covenant:compile.';

  if (silvercPath && fs.existsSync(sourcePath)) {
    const result = compileSil(silvercPath, sourcePath);
    if (result?.scriptHex) {
      scriptHex = result.scriptHex;
      contractName = result.contractName ?? contractName;
      compilerVersion = result.compilerVersion;
      abi = result.abi;
      compileNote = `Compiled with silverc (${silvercPath})`;
    } else if (result) {
      compileNote = 'silverc ran but produced no script bytes (check constructor args or contract syntax)';
    }
  }

  const meta = {
    template: t.template,
    contract: contractName,
    silverscriptVersion: '^0.1.0',
    sourceFile: t.sourceFile,
    compiledAt: new Date().toISOString(),
    scriptHex,
    compilerVersion,
    abi,
    note: compileNote,
  };

  const outPath = path.join(outDir, `${t.template}.json`);
  fs.writeFileSync(outPath, JSON.stringify(meta, null, 2));
  console.log(`Wrote ${path.relative(root, outPath)}${scriptHex ? ` (${scriptHex.length / 2} bytes)` : ''}`);
}
