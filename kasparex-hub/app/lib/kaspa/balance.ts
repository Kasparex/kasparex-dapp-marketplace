/**
 * Normalize Kaspa wallet `getBalance()` payloads to a KAS amount for display.
 * Kastle documents balance as sompi (string). Kasware may return sompi or KAS-like numbers.
 */

export const SOMPI_PER_KAS = 100_000_000n;

function sompiBigIntToKasNumber(sompi: bigint): number {
  const whole = sompi / SOMPI_PER_KAS;
  const frac = sompi % SOMPI_PER_KAS;
  return Number(whole) + Number(frac) / Number(SOMPI_PER_KAS);
}

/**
 * Kastle: `getBalance()` returns `{ balance: string }` in sompi per official API.
 */
export function kastleBalanceToKas(raw: unknown): number | null {
  if (raw == null) return null;
  if (typeof raw === "object" && raw !== null && "balance" in raw) {
    const b = (raw as { balance: unknown }).balance;
    if (typeof b === "string" && /^\d+$/.test(b.trim())) {
      try {
        return sompiBigIntToKasNumber(BigInt(b.trim()));
      } catch {
        return null;
      }
    }
    if (typeof b === "number" && Number.isFinite(b) && Number.isInteger(b) && b >= 0) {
      try {
        return sompiBigIntToKasNumber(BigInt(Math.floor(b)));
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Kasware: unwrap `{ balance }` or scalar; integers / digit strings treated as sompi, decimals as KAS.
 */
export function kaswareBalanceToKas(raw: unknown): number | null {
  if (raw == null) return null;
  let inner: unknown = raw;
  if (typeof raw === "object" && raw !== null && "balance" in raw) {
    inner = (raw as { balance: unknown }).balance;
  }
  if (typeof inner === "number") {
    if (!Number.isFinite(inner)) return null;
    if (!Number.isInteger(inner)) return inner;
    try {
      return sompiBigIntToKasNumber(BigInt(inner));
    } catch {
      return null;
    }
  }
  if (typeof inner === "string") {
    const t = inner.trim();
    if (t.includes(".") || t.includes("e") || t.includes("E")) {
      const n = Number(t);
      return Number.isFinite(n) ? n : null;
    }
    if (/^\d+$/.test(t)) {
      try {
        return sompiBigIntToKasNumber(BigInt(t));
      } catch {
        return null;
      }
    }
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}
