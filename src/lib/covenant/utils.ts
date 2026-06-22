export function normalizeAddr(addr: string): string {
  return addr.trim().toLowerCase().replace(/^kaspa:/i, '');
}

export function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < bytes; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function randomId(prefix: string): string {
  return `${prefix}_${Date.now()}_${randomHex(4)}`;
}

export function sompiToKasNumber(sompi: string): number {
  return Number(BigInt(sompi)) / 1e8;
}

export function kasToSompiString(kas: number): string {
  return String(Math.round(kas * 100_000_000));
}

export async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function loadMap<T>(key: string): Map<string, T> {
  if (typeof window === 'undefined') return new Map();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Map();
    return new Map(JSON.parse(raw) as [string, T][]);
  } catch {
    return new Map();
  }
}

export function saveMap<T>(key: string, map: Map<string, T>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(Array.from(map.entries())));
}

export function allocateBps(totalSompi: bigint, bpsList: number[]): string[] {
  let allocated = 0n;
  const amounts: string[] = [];
  for (let i = 0; i < bpsList.length; i++) {
    if (i === bpsList.length - 1) {
      amounts.push(String(totalSompi - allocated));
    } else {
      const slice = (totalSompi * BigInt(bpsList[i])) / 10000n;
      amounts.push(String(slice));
      allocated += slice;
    }
  }
  return amounts;
}
