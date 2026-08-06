import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import type { MigrateAttestation } from '@/lib/krex/wrap/migrateV2';

const STORE_REL = path.join('data', 'krex-wrap', 'attestations-tn10.json');

export type AttestationStoreFile = {
  network: 'testnet-10';
  updatedAt: string;
  attestations: MigrateAttestation[];
};

function storePath(): string {
  return path.join(process.cwd(), STORE_REL);
}

export async function readAttestationStore(): Promise<AttestationStoreFile> {
  try {
    const raw = await readFile(storePath(), 'utf8');
    const parsed = JSON.parse(raw) as AttestationStoreFile;
    if (!parsed || !Array.isArray(parsed.attestations)) {
      return { network: 'testnet-10', updatedAt: new Date().toISOString(), attestations: [] };
    }
    return parsed;
  } catch {
    return { network: 'testnet-10', updatedAt: new Date().toISOString(), attestations: [] };
  }
}

export async function writeAttestationStore(file: AttestationStoreFile): Promise<void> {
  const dir = path.dirname(storePath());
  await mkdir(dir, { recursive: true });
  const next: AttestationStoreFile = {
    ...file,
    network: 'testnet-10',
    updatedAt: new Date().toISOString(),
  };
  await writeFile(storePath(), `${JSON.stringify(next, null, 2)}\n`, 'utf8');
}

export async function upsertAttestation(row: MigrateAttestation): Promise<MigrateAttestation> {
  const store = await readAttestationStore();
  const burn = row.burnTxHash.trim().toLowerCase();
  const idx = store.attestations.findIndex((a) => a.burnTxHash?.toLowerCase() === burn);
  const normalized: MigrateAttestation = { ...row, burnTxHash: burn };
  if (idx >= 0) store.attestations[idx] = { ...store.attestations[idx], ...normalized };
  else store.attestations.unshift(normalized);
  await writeAttestationStore(store);
  return normalized;
}

export async function findAttestation(burnTxHash: string): Promise<MigrateAttestation | null> {
  const store = await readAttestationStore();
  const burn = burnTxHash.trim().toLowerCase();
  return store.attestations.find((a) => a.burnTxHash?.toLowerCase() === burn) ?? null;
}
