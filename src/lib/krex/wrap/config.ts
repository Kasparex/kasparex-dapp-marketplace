import { getAdsTreasuryL1Address } from '@/lib/ads/config';
import type { KrexWrapPublicConfig } from './types';

const DEFAULT_BASE_FEE_KAS = 2;
const DEFAULT_MIN_WRAP_KREX = 1;
const DEFAULT_DECIMALS = 8;

function envTrim(key: string): string | null {
  if (typeof process === 'undefined') return null;
  const v = process.env[key]?.trim();
  return v || null;
}

/** KRC-20 tick locked in the wrap vault (canonical KREX). */
export function getKrexWrapTick(): string {
  return envTrim('NEXT_PUBLIC_KREX_WRAP_TICK') ?? 'KREX';
}

export function getKrexWrapDecimals(): number {
  const raw = envTrim('NEXT_PUBLIC_KREX_WRAP_DECIMALS');
  const n = raw ? Number(raw) : DEFAULT_DECIMALS;
  return Number.isFinite(n) && n >= 0 && n <= 18 ? Math.floor(n) : DEFAULT_DECIMALS;
}

/** Keyless (or operator) deposit vault for KRC-20 KREX. */
export function getKrexWrapVaultAddress(): string | null {
  return envTrim('NEXT_PUBLIC_KREX_WRAP_VAULT');
}

/** Wrapped KCC20 covenant id once the mint side is live. */
export function getKrexKcc20CovenantId(): string | null {
  const id = envTrim('NEXT_PUBLIC_KREX_KCC20_COVENANT_ID');
  if (!id || !/^[a-f0-9]{64}$/i.test(id)) return null;
  return id.toLowerCase();
}

export function getKrexWrapTreasuryAddress(): string {
  return (
    envTrim('NEXT_PUBLIC_KREX_WRAP_TREASURY') ||
    envTrim('NEXT_PUBLIC_STORE_TREASURY_ADDRESS') ||
    getAdsTreasuryL1Address()
  );
}

export function getKrexWrapBaseFeeKas(): number {
  const raw = envTrim('NEXT_PUBLIC_KREX_WRAP_FEE_KAS');
  const n = raw ? Number(raw) : DEFAULT_BASE_FEE_KAS;
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_BASE_FEE_KAS;
}

export function getKrexWrapMinAmount(): number {
  const raw = envTrim('NEXT_PUBLIC_KREX_WRAP_MIN_AMOUNT');
  const n = raw ? Number(raw) : DEFAULT_MIN_WRAP_KREX;
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_MIN_WRAP_KREX;
}

/** Two-way release is off until vault release signing is production-ready. */
export function isKrexUnwrapEnabled(): boolean {
  return envTrim('NEXT_PUBLIC_KREX_UNWRAP_ENABLED') === '1';
}

export function isKrexWrapMintLive(): boolean {
  return Boolean(getKrexWrapVaultAddress() && getKrexKcc20CovenantId());
}

export function getKrexWrapPublicConfig(): KrexWrapPublicConfig {
  const vaultAddress = getKrexWrapVaultAddress();
  const treasuryAddress = getKrexWrapTreasuryAddress() || null;
  const kcc20CovenantId = getKrexKcc20CovenantId();
  return {
    vaultAddress,
    treasuryAddress,
    kcc20CovenantId,
    tick: getKrexWrapTick(),
    decimals: getKrexWrapDecimals(),
    baseFeeKas: getKrexWrapBaseFeeKas(),
    minWrapKrex: getKrexWrapMinAmount(),
    unwrapEnabled: isKrexUnwrapEnabled(),
    mintLive: isKrexWrapMintLive(),
    ready: Boolean(vaultAddress && treasuryAddress),
  };
}
