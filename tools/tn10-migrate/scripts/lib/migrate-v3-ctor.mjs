/**
 * Shared KCC20Migrate v3 + MigrateTicket constructor helpers for TN10 scripts.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { encodeConstructorArgsForSilverc } from '../../sdk/dist/index.js';

export const TOTAL_CAP = 1_000_000 * 100_000_000;
export const ATTESTOR_THRESHOLD = 2;

export function hex(buf) {
  return Buffer.from(buf).toString('hex');
}

export function hexToByteArrayExpr(hexStr) {
  const body = hexStr.replace(/^0x/i, '');
  const data = [];
  for (let i = 0; i < body.length; i += 2) {
    data.push({ kind: 'byte', data: parseInt(body.slice(i, i + 2), 16) });
  }
  return { kind: 'array', data };
}

export function scriptBytesFromArtifact(artifact) {
  const raw = artifact.script ?? artifact.bytecode ?? artifact.script_hex;
  if (Array.isArray(raw)) return Buffer.from(raw);
  if (typeof raw === 'string') return Buffer.from(raw.replace(/^0x/i, ''), 'hex');
  throw new Error(`Compiled artifact missing script. Keys: ${Object.keys(artifact).join(',')}`);
}

export function resolveSilvercBin(openSilverRoot) {
  const candidates = [
    join(openSilverRoot, 'upstream/silverscript/target/debug/silverc.exe'),
    join(openSilverRoot, 'upstream/silverscript/target/debug/silverc'),
    join(openSilverRoot, 'upstream/silverscript/target/release/silverc.exe'),
    join(openSilverRoot, 'upstream/silverscript/target/release/silverc'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return candidates[0];
}

export function blake2b256(openSilverRoot, outDir, prefix, suffix) {
  const helper = join(openSilverRoot, 'upstream/silverscript/target/debug/blake2b256_concat.exe');
  const prefixPath = join(outDir, '.tmpl-prefix.bin');
  const suffixPath = join(outDir, '.tmpl-suffix.bin');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(prefixPath, prefix);
  writeFileSync(suffixPath, suffix);
  if (!existsSync(helper)) {
    execFileSync(
      'cargo',
      [
        'build',
        '--manifest-path',
        join(openSilverRoot, 'upstream/silverscript/silverscript-lang/Cargo.toml'),
        '--bin',
        'blake2b256_concat',
      ],
      { stdio: 'pipe' },
    );
  }
  const out = execFileSync(helper, [prefixPath, suffixPath], { encoding: 'utf8' }).trim();
  return Buffer.from(out, 'hex');
}

export function templateFromCompiledArtifact(openSilverRoot, outDir, artifact) {
  const layout = artifact.state_layout || artifact.stateLayout;
  if (!layout) {
    throw new Error(`Compiled artifact missing state_layout. Keys: ${Object.keys(artifact).join(',')}`);
  }
  const script = scriptBytesFromArtifact(artifact);
  const start = layout.start ?? layout.Start;
  const len = layout.len ?? layout.length ?? layout.Len;
  if (typeof start !== 'number' || typeof len !== 'number') {
    throw new Error(`Bad state_layout: ${JSON.stringify(layout)}`);
  }
  const prefix = script.subarray(0, start);
  const suffix = script.subarray(start + len);
  const hash32 = blake2b256(openSilverRoot, outDir, prefix, suffix);
  return {
    prefixLength: prefix.length,
    suffixLength: suffix.length,
    expectedTemplateHash: hex(hash32),
    templatePrefix: hex(prefix),
    templateSuffix: hex(suffix),
  };
}

export function compileWithExprs(openSilverRoot, silvercBin, contractRelPath, exprs, label) {
  const tempDir = mkdtempSync(join(tmpdir(), `tkrex-migrate-${label}-`));
  const ctorPath = join(tempDir, 'ctor.json');
  const outPath = join(tempDir, 'artifact.json');
  writeFileSync(ctorPath, JSON.stringify(exprs), 'utf8');
  try {
    execFileSync(silvercBin, ['--constructor-args', ctorPath, join(openSilverRoot, contractRelPath), '--output', outPath], {
      stdio: 'pipe',
    });
    return JSON.parse(readFileSync(outPath, 'utf8'));
  } catch (err) {
    const stderr = err?.stderr?.toString?.() || err?.message || String(err);
    throw new Error(`silverc failed (${label}): ${stderr}`);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

/** Load or create a 3-key TN10 roster (distinct x-only pubkeys). Prefer ATTESTOR_ROSTER.json from generate-tn10-attestor-roster.mjs. */
export function loadAttestorRoster(openSilverRoot, outDir) {
  const rosterPath = join(outDir, 'ATTESTOR_ROSTER.json');
  if (existsSync(rosterPath)) {
    const roster = JSON.parse(readFileSync(rosterPath, 'utf8'));
    if (roster?.attestors?.length === 3) {
      const keys = roster.attestors.map((a) => a.xOnlyPubkey);
      if (new Set(keys).size === 3) return roster;
    }
  }
  throw new Error(
    `Missing valid ${rosterPath}. Run: node scripts/generate-tn10-attestor-roster.mjs`,
  );
}

export function migrateControllerCtorArgs({
  adminPubkey,
  attestors,
  threshold = ATTESTOR_THRESHOLD,
  totalCap = TOTAL_CAP,
  remainingAllowance,
  assetCovid,
  initialized,
  adminRenounced,
  assetTemplate,
  ticketTemplate,
}) {
  return [
    adminPubkey,
    attestors[0],
    attestors[1],
    attestors[2],
    threshold,
    totalCap,
    remainingAllowance,
    assetCovid,
    initialized,
    adminRenounced,
    assetTemplate.prefixLength,
    assetTemplate.suffixLength,
    assetTemplate.expectedTemplateHash,
    assetTemplate.templatePrefix,
    assetTemplate.templateSuffix,
    ticketTemplate.prefixLength,
    ticketTemplate.suffixLength,
    ticketTemplate.expectedTemplateHash,
    ticketTemplate.templatePrefix,
    ticketTemplate.templateSuffix,
  ];
}

export function migrateControllerExprs(args) {
  return encodeConstructorArgsForSilverc(migrateControllerCtorArgs(args));
}

export function ticketCtorExprs(attestors, threshold = ATTESTOR_THRESHOLD) {
  return encodeConstructorArgsForSilverc([attestors[0], attestors[1], attestors[2], threshold]);
}
