import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

export function nextSeq(nodeId: string): number {
  const file = resolve(process.cwd(), `.krex-node-seq-${nodeId.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`);
  let n = 1;
  if (existsSync(file)) {
    const prev = parseInt(readFileSync(file, 'utf8').trim(), 10);
    if (Number.isFinite(prev)) n = prev + 1;
  }
  writeFileSync(file, String(n), 'utf8');
  return n;
}
