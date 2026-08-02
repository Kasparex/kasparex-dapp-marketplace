import type { CipherVaultTierId } from '@/lib/game/cipher-vaults-config';
import { getCipherVaultTier } from '@/lib/game/cipher-vaults-config';

export type CipherMove =
  | { type: 'swap'; a: number; b: number }
  | { type: 'rotateRow'; row: number; dir: 'l' | 'r' }
  | { type: 'rotateCol'; col: number; dir: 'u' | 'd' };

export interface CipherGridRunSpec {
  tierId: CipherVaultTierId;
  size: number;
  seed: string;
  initial: number[];
  target: number[];
}

function xorshift32(seed: number) {
  let x = seed | 0;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 0xffffffff;
  };
}

function hashSeedToU32(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function fisherYates(arr: number[], rand: () => number) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = arr[i];
    arr[i] = arr[j]!;
    arr[j] = t!;
  }
}

export function makeCipherRunSpec(seed: string, tierId: CipherVaultTierId): CipherGridRunSpec {
  const size = 4;
  const tier = getCipherVaultTier(tierId);
  const depth = tier?.scrambleDepth ?? 0;
  const rand = xorshift32(hashSeedToU32(`${seed}:${tierId}`));
  const target = Array.from({ length: size * size }, (_, i) => i);
  const initial = [...target];

  // Base shuffle + optional deeper reshuffles for harder covenants.
  fisherYates(initial, rand);
  for (let d = 0; d < depth; d++) {
    fisherYates(initial, rand);
  }

  // Ensure not already solved (extremely rare but cheap to fix).
  if (initial.every((v, i) => v === target[i])) {
    const a = 0;
    const b = 1;
    const t = initial[a];
    initial[a] = initial[b]!;
    initial[b] = t!;
  }

  return { tierId, size, seed, initial, target };
}

export function applyCipherMove(grid: number[], size: number, move: CipherMove): number[] {
  const g = [...grid];
  if (move.type === 'swap') {
    const a = Math.max(0, Math.min(g.length - 1, move.a));
    const b = Math.max(0, Math.min(g.length - 1, move.b));
    const t = g[a];
    g[a] = g[b]!;
    g[b] = t!;
    return g;
  }
  if (move.type === 'rotateRow') {
    const row = Math.max(0, Math.min(size - 1, move.row));
    const start = row * size;
    const rowVals = g.slice(start, start + size);
    if (move.dir === 'l') {
      rowVals.push(rowVals.shift()!);
    } else {
      rowVals.unshift(rowVals.pop()!);
    }
    for (let i = 0; i < size; i++) g[start + i] = rowVals[i]!;
    return g;
  }
  if (move.type === 'rotateCol') {
    const col = Math.max(0, Math.min(size - 1, move.col));
    const colVals = Array.from({ length: size }, (_, r) => g[r * size + col]);
    if (move.dir === 'u') {
      colVals.push(colVals.shift()!);
    } else {
      colVals.unshift(colVals.pop()!);
    }
    for (let r = 0; r < size; r++) g[r * size + col] = colVals[r]!;
    return g;
  }
  return g;
}

export function applyCipherMoves(grid: number[], size: number, moves: CipherMove[]): number[] {
  return moves.reduce((acc, m) => applyCipherMove(acc, size, m), grid);
}

export function isSolved(grid: number[], target: number[]): boolean {
  if (grid.length !== target.length) return false;
  for (let i = 0; i < grid.length; i++) if (grid[i] !== target[i]) return false;
  return true;
}
