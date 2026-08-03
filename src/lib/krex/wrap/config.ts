import { getAdsTreasuryL1Address } from '@/lib/ads/config';
import type { Krc20WrapCovenantMap, KrexWrapPublicConfig } from './types';

const DEFAULT_BASE_FEE_KAS = 2;
const DEFAULT_MIN_WRAP = 1;
const DEFAULT_DECIMALS = 8;
const DEFAULT_TICK = 'KREX';

function envTrim(key: string): string | null {
  if (typeof process === 'undefined') return null;
  const v = process.env[key]?.trim();
  return v || null;
}

function isCovenantId(id: string): boolean {
  return /^[a-f0-9]{64}$/i.test(id);
}

/** Default KRC-20 tick preselected in the wrap UI. */
export function getKrexWrapTick(): string {
  return (envTrim('NEXT_PUBLIC_KREX_WRAP_TICK') ?? DEFAULT_TICK).toUpperCase();
}

export function getKrexWrapDecimals(): number {
  const raw = envTrim('NEXT_PUBLIC_KREX_WRAP_DECIMALS');
  const n = raw ? Number(raw) : DEFAULT_DECIMALS;
  return Number.isFinite(n) && n >= 0 && n <= 18 ? Math.floor(n) : DEFAULT_DECIMALS;
}

/** Shared deposit vault for KRC-20 wraps (any tick). */
export function getKrexWrapVaultAddress(): string | null {
  return envTrim('NEXT_PUBLIC_KREX_WRAP_VAULT') || envTrim('NEXT_PUBLIC_KRC20_WRAP_VAULT');
}

/** Wrapped KREX KCC20 covenant id (legacy env). */
export function getKrexKcc20CovenantId(): string | null {
  const id = envTrim('NEXT_PUBLIC_KREX_KCC20_COVENANT_ID');
  if (!id || !isCovenantId(id)) return null;
  return id.toLowerCase();
}

/**
 * Optional JSON map of tick → KCC20 covenant id for multi-token mint.
 * Example: `{"KREX":"abc...","GRID":"def..."}`
 */
export function getKrc20WrapCovenantMap(): Krc20WrapCovenantMap {
  const map: Krc20WrapCovenantMap = {};
  const krex = getKrexKcc20CovenantId();
  if (krex) map.KREX = krex;

  const raw = envTrim('NEXT_PUBLIC_KRC20_WRAP_COVENANTS');
  if (!raw) return map;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return map;
    for (const [tick, value] of Object.entries(parsed)) {
      const id = typeof value === 'string' ? value.trim() : '';
      if (!tick.trim() || !isCovenantId(id)) continue;
      map[tick.trim().toUpperCase()] = id.toLowerCase();
    }
  } catch {
    // ignore malformed env
  }
  return map;
}

export function getWrapCovenantIdForTick(tick: string): string | null {
  const key = tick.trim().toUpperCase();
  if (!key) return null;
  return getKrc20WrapCovenantMap()[key] ?? null;
}

export function isWrapMintLiveForTick(tick: string): boolean {
  return Boolean(getKrexWrapVaultAddress() && getWrapCovenantIdForTick(tick));
}

export function getKrexWrapTreasuryAddress(): string {
  return (
    envTrim('NEXT_PUBLIC_KREX_WRAP_TREASURY') ||
    envTrim('NEXT_PUBLIC_KRC20_WRAP_TREASURY') ||
    envTrim('NEXT_PUBLIC_STORE_TREASURY_ADDRESS') ||
    getAdsTreasuryL1Address()
  );
}

export function getKrexWrapBaseFeeKas(): number {
  const raw = envTrim('NEXT_PUBLIC_KREX_WRAP_FEE_KAS') || envTrim('NEXT_PUBLIC_KRC20_WRAP_FEE_KAS');
  const n = raw ? Number(raw) : DEFAULT_BASE_FEE_KAS;
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_BASE_FEE_KAS;
}

export function getKrexWrapMinAmount(): number {
  const raw = envTrim('NEXT_PUBLIC_KREX_WRAP_MIN_AMOUNT') || envTrim('NEXT_PUBLIC_KRC20_WRAP_MIN_AMOUNT');
  const n = raw ? Number(raw) : DEFAULT_MIN_WRAP;
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_MIN_WRAP;
}

/** Two-way release is off until vault release signing is production-ready. */
export function isKrexUnwrapEnabled(): boolean {
  return (
    envTrim('NEXT_PUBLIC_KREX_UNWRAP_ENABLED') === '1' ||
    envTrim('NEXT_PUBLIC_KRC20_UNWRAP_ENABLED') === '1'
  );
}

export function isKrexWrapMintLive(): boolean {
  return isWrapMintLiveForTick(getKrexWrapTick());
}

export function getKrexWrapPublicConfig(): KrexWrapPublicConfig {
  const vaultAddress = getKrexWrapVaultAddress();
  const treasuryAddress = getKrexWrapTreasuryAddress() || null;
  const covenants = getKrc20WrapCovenantMap();
  const defaultTick = getKrexWrapTick();
  const kcc20CovenantId = getWrapCovenantIdForTick(defaultTick);
  const minWrapAmount = getKrexWrapMinAmount();
  return {
    vaultAddress,
    treasuryAddress,
    kcc20CovenantId,
    covenants,
    defaultTick,
    decimals: getKrexWrapDecimals(),
    baseFeeKas: getKrexWrapBaseFeeKas(),
    minWrapAmount,
    minWrapKrex: minWrapAmount,
    unwrapEnabled: isKrexUnwrapEnabled(),
    mintLive: Boolean(vaultAddress && kcc20CovenantId),
    ready: Boolean(vaultAddress && treasuryAddress),
  };
}
