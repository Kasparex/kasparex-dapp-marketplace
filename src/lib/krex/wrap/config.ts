import { getAdsTreasuryL1Address } from '@/lib/ads/config';
import type { Krc20WrapCovenantMap, KrexWrapPublicConfig, Krc20BridgeNetwork } from './types';

const DEFAULT_BASE_FEE_KAS = 5;
const DEFAULT_MIN_WRAP = 1;
const DEFAULT_DECIMALS = 8;
const DEFAULT_TICK_MAINNET = 'KREX';
const DEFAULT_TICK_TESTNET = 'TKREX';

export const KASPLEX_MAINNET_API = 'https://api.kasplex.org';
export const KASPLEX_TESTNET_API = 'https://tn10api.kasplex.org';

/**
 * Next.js only inlines NEXT_PUBLIC_* via static `process.env.NAME` access.
 * Dynamic `process.env[key]` is always empty in the client bundle.
 */
function trimEnv(value: string | undefined | null): string | null {
  if (value == null) return null;
  // Strip whitespace and accidental CRLF / escaped CRLF from CLI env uploads.
  const v = value
    .replace(/\\r\\n/g, '')
    .replace(/\\n/g, '')
    .replace(/[\r\n]+/g, '')
    .trim();
  return v || null;
}

function isCovenantId(id: string): boolean {
  return /^[a-f0-9]{64}$/i.test(id);
}

export function kasplexApiBaseForNetwork(network: Krc20BridgeNetwork): string {
  return network === 'testnet-10' ? KASPLEX_TESTNET_API : KASPLEX_MAINNET_API;
}

/** Default KRC-20 tick preselected in the bridge UI (network-aware). */
export function getKrexWrapTick(network: Krc20BridgeNetwork = 'mainnet'): string {
  if (network === 'testnet-10') {
    return (
      trimEnv(process.env.NEXT_PUBLIC_KCC20_BRIDGE_TICK_TESTNET) ||
      trimEnv(process.env.NEXT_PUBLIC_KREX_WRAP_TICK_TESTNET) ||
      DEFAULT_TICK_TESTNET
    ).toUpperCase();
  }
  return (
    trimEnv(process.env.NEXT_PUBLIC_KREX_WRAP_TICK) ||
    trimEnv(process.env.NEXT_PUBLIC_KCC20_BRIDGE_TICK) ||
    DEFAULT_TICK_MAINNET
  ).toUpperCase();
}

export function getKrexWrapDecimals(): number {
  const raw =
    trimEnv(process.env.NEXT_PUBLIC_KREX_WRAP_DECIMALS) ||
    trimEnv(process.env.NEXT_PUBLIC_KCC20_BRIDGE_DECIMALS);
  const n = raw ? Number(raw) : DEFAULT_DECIMALS;
  return Number.isFinite(n) && n >= 0 && n <= 18 ? Math.floor(n) : DEFAULT_DECIMALS;
}

/** Shared deposit vault for mainnet KRC-20 → KCC20. */
export function getKrexWrapVaultAddress(): string | null {
  return (
    trimEnv(process.env.NEXT_PUBLIC_KCC20_BRIDGE_VAULT) ||
    trimEnv(process.env.NEXT_PUBLIC_KREX_WRAP_VAULT) ||
    trimEnv(process.env.NEXT_PUBLIC_KRC20_WRAP_VAULT)
  );
}

/** Testnet-10 deposit vault (optional; enables Testnet deposits in the UI). */
export function getKcc20BridgeVaultTestnet(): string | null {
  return (
    trimEnv(process.env.NEXT_PUBLIC_KCC20_BRIDGE_VAULT_TESTNET) ||
    trimEnv(process.env.NEXT_PUBLIC_KREX_WRAP_VAULT_TESTNET)
  );
}

export function getBridgeVaultAddress(network: Krc20BridgeNetwork): string | null {
  return network === 'testnet-10' ? getKcc20BridgeVaultTestnet() : getKrexWrapVaultAddress();
}

/** Wrapped KREX KCC20 covenant id (legacy env). */
export function getKrexKcc20CovenantId(): string | null {
  const id = trimEnv(process.env.NEXT_PUBLIC_KREX_KCC20_COVENANT_ID);
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

  const raw =
    trimEnv(process.env.NEXT_PUBLIC_KRC20_WRAP_COVENANTS) ||
    trimEnv(process.env.NEXT_PUBLIC_KCC20_BRIDGE_COVENANTS);
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

export function isWrapMintLiveForTick(tick: string, network: Krc20BridgeNetwork = 'mainnet'): boolean {
  return Boolean(getBridgeVaultAddress(network) && getWrapCovenantIdForTick(tick));
}

/** Ops TN10 fee sink (wallet 2). Override with NEXT_PUBLIC_KCC20_BRIDGE_TREASURY_TESTNET. */
const DEFAULT_BRIDGE_TREASURY_TESTNET =
  'kaspatest:qpgmnzeq5e59er2hkadaxd7s3yc8k69s4pqkxvw0zsktuk787e94wjlmdjcxl';

export function getKrexWrapTreasuryAddress(network: Krc20BridgeNetwork = 'mainnet'): string {
  if (network === 'testnet-10') {
    return (
      trimEnv(process.env.NEXT_PUBLIC_KCC20_BRIDGE_TREASURY_TESTNET) ||
      trimEnv(process.env.NEXT_PUBLIC_KREX_WRAP_TREASURY_TESTNET) ||
      DEFAULT_BRIDGE_TREASURY_TESTNET
    );
  }
  return (
    trimEnv(process.env.NEXT_PUBLIC_KCC20_BRIDGE_TREASURY) ||
    trimEnv(process.env.NEXT_PUBLIC_KREX_WRAP_TREASURY) ||
    trimEnv(process.env.NEXT_PUBLIC_KRC20_WRAP_TREASURY) ||
    trimEnv(process.env.NEXT_PUBLIC_STORE_TREASURY_ADDRESS) ||
    getAdsTreasuryL1Address()
  );
}

export function getKrexWrapBaseFeeKas(): number {
  const raw =
    trimEnv(process.env.NEXT_PUBLIC_KCC20_BRIDGE_FEE_KAS) ||
    trimEnv(process.env.NEXT_PUBLIC_KREX_WRAP_FEE_KAS) ||
    trimEnv(process.env.NEXT_PUBLIC_KRC20_WRAP_FEE_KAS);
  const n = raw ? Number(raw) : DEFAULT_BASE_FEE_KAS;
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_BASE_FEE_KAS;
}

export function getKrexWrapMinAmount(): number {
  const raw =
    trimEnv(process.env.NEXT_PUBLIC_KCC20_BRIDGE_MIN_AMOUNT) ||
    trimEnv(process.env.NEXT_PUBLIC_KREX_WRAP_MIN_AMOUNT) ||
    trimEnv(process.env.NEXT_PUBLIC_KRC20_WRAP_MIN_AMOUNT);
  const n = raw ? Number(raw) : DEFAULT_MIN_WRAP;
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_MIN_WRAP;
}

/** Two-way release is off until vault release signing is production-ready. */
export function isKrexUnwrapEnabled(): boolean {
  return (
    trimEnv(process.env.NEXT_PUBLIC_KREX_UNWRAP_ENABLED) === '1' ||
    trimEnv(process.env.NEXT_PUBLIC_KRC20_UNWRAP_ENABLED) === '1' ||
    trimEnv(process.env.NEXT_PUBLIC_KCC20_BRIDGE_REVERSE_ENABLED) === '1'
  );
}

export function isKrexWrapMintLive(): boolean {
  return isWrapMintLiveForTick(getKrexWrapTick('mainnet'), 'mainnet');
}

export function getKrexWrapPublicConfig(
  network: Krc20BridgeNetwork = 'mainnet',
): KrexWrapPublicConfig {
  const vaultAddress = getBridgeVaultAddress(network);
  const treasuryAddress = getKrexWrapTreasuryAddress(network) || null;
  const covenants = getKrc20WrapCovenantMap();
  const defaultTick = getKrexWrapTick(network);
  const kcc20CovenantId = getWrapCovenantIdForTick(defaultTick);
  const minWrapAmount = getKrexWrapMinAmount();
  const testnetVaultConfigured = Boolean(getKcc20BridgeVaultTestnet());
  return {
    network,
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
    testnetAvailable: testnetVaultConfigured,
  };
}
